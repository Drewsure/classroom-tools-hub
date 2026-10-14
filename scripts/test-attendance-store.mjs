import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/attendance-store.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const store = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const cls = { id: "test", name: "Test", day: "Monday", time: "16:00", students: [
  { name: "Aki", grade: null, card: "B" }, { name: "Ren", grade: null, card: null },
] };
let storage;
function savedData() {
  const backup = JSON.parse(store.exportAttendanceBackup());
  delete backup.exportedAt;
  return backup;
}
function reset() {
  const map = new Map();
  storage = {
    get length() { return map.size; }, key: (index) => [...map.keys()][index] ?? null,
    getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
  globalThis.window = { localStorage: storage, dispatchEvent: () => true };
  store.writeClasses([structuredClone(cls)]);
  store.writeActiveId(cls.id);
  store.startLesson(cls.id);
  store.ensureTodayRecord(cls);
}
test("presence, bag, book and homework survive rereads without changing the class list", () => {
  reset();
  const rec = store.recordFor(cls.id);
  rec.students.Aki = { p: 0, bag: 0, book: 1, hw: 1 };
  store.writeRecord(rec);
  assert.deepEqual(store.readRecord(rec.date, cls.id).students.Aki, rec.students.Aki);
  assert.deepEqual(store.presentStudents(store.readClasses()[0]), ["Ren"]);
  assert.equal(store.readActiveId(), "test");
});
test("all-absent stays empty instead of falling back to sample names", () => {
  reset();
  const rec = store.recordFor(cls.id);
  Object.values(rec.students).forEach((entry) => { entry.p = 0; });
  store.writeRecord(rec);
  assert.deepEqual(store.presentStudents(cls), []);
});
test("changing classes never overwrites the previous class attendance", () => {
  reset();
  const other = { ...structuredClone(cls), id: "other", name: "Other" };
  const rec = store.recordFor(cls.id);
  rec.students.Aki.p = 0;
  store.writeRecord(rec);
  store.writeClasses([cls, other]);
  store.writeActiveId(other.id);
  store.startLesson(other.id);
  store.ensureTodayRecord(other);
  store.writeActiveId(cls.id);
  assert.deepEqual(store.presentStudents(cls), ["Ren"]);
});
test("an ongoing lesson holds its Japan date across midnight", () => {
  reset();
  const date = new Date(store.todayStr());
  date.setUTCDate(date.getUTCDate() - 1);
  const yesterday = date.toISOString().slice(0, 10);
  storage.setItem("classroom-tools-att-session", JSON.stringify({ classId: cls.id, date: yesterday, startedAt: Date.now() }));
  assert.equal(store.lessonDate(cls.id), yesterday);
  store.startLesson(cls.id);
  assert.equal(store.lessonDate(cls.id), store.todayStr());
});
test("old records migrate Book without altering existing attendance/bag/homework", () => {
  reset();
  const date = store.todayStr();
  storage.setItem("attendance_" + date + "_test", JSON.stringify({
    date, classId: "test", students: { Aki: { p: 0, bag: 1, hw: 1 } },
  }));
  assert.deepEqual(store.readRecord(date, "test").students.Aki, { p: 0, bag: 1, hw: 1, book: 0 });
});
test("roster edits retain historical students and class snapshots", () => {
  reset();
  store.updateActiveClassStudents(["Ren", "New", "New", " "]);
  assert.deepEqual(store.readClasses()[0].students.map((s) => s.name), ["Ren", "New"]);
  const rec = store.recordFor("test");
  assert.ok(Object.hasOwn(rec.students, "Aki"));
  assert.equal(rec.classSnapshot.students[0].name, "Aki");
  assert.deepEqual(store.presentStudents(store.readClasses()[0]), ["Ren", "New"]);
});
test("deleted classes and removed students remain in exported history", () => {
  reset();
  store.writeClasses([]);
  const backup = JSON.parse(store.exportAttendanceBackup());
  assert.equal(backup.records[0].classSnapshot.name, "Test");
  assert.ok(backup.records[0].students.Aki);
});
test("backup restore recovers all fields and never overwrites newer local checks", () => {
  reset();
  const rec = store.recordFor("test");
  rec.students.Aki = { p: 0, hw: 1, bag: 0, book: 1 };
  store.writeRecord(rec);
  const backup = store.exportAttendanceBackup();
  const key = "attendance_" + rec.date + "_test";
  storage.removeItem(key);
  assert.equal(store.restoreAttendanceBackup(backup), 1);
  assert.deepEqual(store.readRecord(rec.date, "test").students.Aki, rec.students.Aki);
  rec.students.Aki.p = 1;
  store.writeRecord(rec);
  assert.equal(store.restoreAttendanceBackup(backup), 0);
  assert.equal(store.readRecord(rec.date, "test").students.Aki.p, 1);
});
test("malformed or duplicate backups are rejected before any storage writes", () => {
  reset();
  const original = store.exportAttendanceBackup();
  const backup = JSON.parse(original);
  backup.records[0].students.Aki.p = 7;
  assert.throws(() => store.restoreAttendanceBackup(JSON.stringify(backup)));
  const expected = JSON.parse(original);
  delete expected.exportedAt;
  assert.deepEqual(savedData(), expected);
  const duplicate = JSON.parse(original);
  duplicate.records.push(duplicate.records[0]);
  assert.throws(() => store.restoreAttendanceBackup(JSON.stringify(duplicate)));
});
test("storage failures report Not saved rather than pretending to succeed", () => {
  reset();
  const original = storage.setItem;
  storage.setItem = () => { throw new Error("QuotaExceededError"); };
  const save = store.guardMutation(() => store.writeRecord(store.recordFor("test")), false);
  assert.equal(save(), false);
  assert.match(store.attendanceError(), /Not saved/);
  storage.setItem = original;
  store.guardMutation(() => store.writeRecord(store.recordFor("test")), undefined)();
  assert.equal(store.attendanceError(), null);
});
test("partially failed restores roll back the entire attempted import", () => {
  reset();
  const backup = JSON.parse(store.exportAttendanceBackup());
  backup.records.push({ ...backup.records[0], date: "2026-01-01" });
  backup.records.push({ ...backup.records[0], date: "2026-01-02" });
  const before = savedData();
  const original = storage.setItem;
  let calls = 0;
  storage.setItem = (key, value) => {
    if (++calls === 3) throw new Error("QuotaExceededError");
    original(key, value);
  };
  assert.throws(() => store.restoreAttendanceBackup(JSON.stringify(backup)));
  storage.setItem = original;
  assert.deepEqual(savedData(), before);
});

test("restore repairs damaged records and class data while retaining their original bytes", () => {
  reset();
  const backup = store.exportAttendanceBackup();
  const key = "attendance_" + store.todayStr() + "_test";
  storage.setItem(store.CLASSES_KEY, "broken classes");
  storage.setItem(key, "broken lesson");
  assert.equal(store.restoreAttendanceBackup(backup), 1);
  assert.equal(store.readClasses()[0].name, "Test");
  assert.equal(store.readRecord(store.todayStr(), "test").students.Aki.p, 1);
  const recovery = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key) => key.startsWith("classroom-tools-att-recovery-")).map((key) => storage.getItem(key));
  assert.ok(recovery.includes("broken classes"));
  assert.ok(recovery.includes("broken lesson"));
});

test("damaged session metadata cannot block an otherwise valid class", () => {
  reset();
  for (const raw of ["broken", "null", "[]", JSON.stringify({ classId: "test", date: store.todayStr(), startedAt: "invalid" })]) {
    storage.setItem("classroom-tools-att-session", raw);
    assert.equal(store.lessonDate("test"), store.todayStr());
    assert.deepEqual(store.presentStudents(cls), ["Aki", "Ren"]);
  }
});

test("restore repairs a stale active class pointer without replacing valid lessons", () => {
  reset();
  const backup = store.exportAttendanceBackup();
  store.writeActiveId("deleted-class");
  assert.equal(store.restoreAttendanceBackup(backup), 0);
  assert.equal(store.readActiveId(), "test");
});

test("invalid lesson writes are rejected before touching saved data", () => {
  reset();
  const before = savedData();
  const rec = store.recordFor("test");
  rec.students.Aki.p = 2;
  assert.throws(() => store.writeRecord(rec), /Invalid attendance record/);
  assert.deepEqual(savedData(), before);
});

test("student names cannot inherit entries from the JavaScript object prototype", () => {
  reset();
  const special = { ...structuredClone(cls), students: [
    { name: "constructor", grade: null, card: null },
    { name: "__proto__", grade: null, card: null },
  ] };
  store.writeClasses([special]);
  const rec = store.recordFor("test");
  rec.students.constructor.p = 0;
  store.writeRecord(rec);
  assert.deepEqual(store.presentStudents(special), ["__proto__"]);
});
