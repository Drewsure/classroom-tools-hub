export type CardLevel = "P" | "B" | "G";
export interface AttStudent { name: string; grade: string | null; card: CardLevel | null; }
export interface AttClass { id: string; name: string; day: string; time: string; students: AttStudent[]; }
export interface AttEntry { p: number; hw: number; bag: number; book: number; }
export interface AttRecord {
  date: string; classId: string; students: Record<string, AttEntry>;
  classSnapshot?: AttClass; updatedAt?: string;
}

export const CLASSES_KEY = "classroom-tools-att-classes";
export const ACTIVE_KEY = "classroom-tools-att-active";
export const CHANGE_EVENT = "classroom-attendance-change";
export const PREFIX = "attendance_";
const SESSION_KEY = "classroom-tools-att-session";
const ERROR_EVENT = "classroom-attendance-error";
let storageError: string | null = null;
export const attendanceError = () => storageError;

export function todayStr(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function guardMutation<A extends unknown[], R>(fn: (...args: A) => R, fallback: R) {
  return (...args: A): R => {
    try {
      const result = fn(...args);
      storageError = null;
      window.dispatchEvent(new CustomEvent(ERROR_EVENT));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      storageError = /backup|Duplicate|Invalid class/i.test(message)
        ? "Not saved. Invalid or duplicate class/backup data. Use unique student names within each class."
        : "Not saved. Browser storage is unavailable, full, or damaged. Export a backup before closing this app.";
      window.dispatchEvent(new CustomEvent(ERROR_EVENT));
      notify();
      return fallback;
    }
  };
}
export { ERROR_EVENT };

export function readClasses(): AttClass[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CLASSES_KEY);
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (!validClasses(data)) throw new Error("Invalid saved class list");
  return data;
}
export function writeClasses(classes: AttClass[]) {
  if (!validClasses(classes)) throw new Error("Invalid class list or duplicate student names");
  window.localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
}
export function readActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}
export function writeActiveId(id: string) {
  window.localStorage.setItem(ACTIVE_KEY, id);
}

export function lessonDate(classId: string): string {
  if (typeof window === "undefined") return todayStr();
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw) {
    let session: unknown;
    try { session = JSON.parse(raw); } catch { return todayStr(); }
    // Keep a class stable across midnight; expire abandoned sessions after 18 hours.
    if (object(session) && session.classId === classId && validDate(session.date) &&
        typeof session.startedAt === "number" && Number.isFinite(session.startedAt) &&
        Date.now() - session.startedAt >= 0 && Date.now() - session.startedAt < 18 * 60 * 60 * 1000) {
      return session.date;
    }
  }
  return todayStr();
}
export function startLesson(classId: string) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({
    classId, date: todayStr(), startedAt: Date.now(),
  }));
}
export function defaultEntry(): AttEntry {
  return { p: 1, hw: 0, bag: 1, book: 0 };
}
export function readRecord(date: string, classId: string): AttRecord | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PREFIX + date + "_" + classId);
  if (!raw) return null;
  const record = JSON.parse(raw);
  if (!validRecord(record) || record.date !== date || record.classId !== classId) {
    throw new Error("Invalid attendance record");
  }
  // Older records did not have a Book field. Missing is not evidence of a book.
  record.students = Object.assign(Object.create(null), Object.fromEntries(
    Object.entries(record.students).map(([name, entry]) =>
      [name, { ...defaultEntry(), ...(entry as AttEntry) }])));
  return record;
}
export function writeRecord(rec: AttRecord) {
  const snapshot = rec.classSnapshot ?? readClasses().find((cls) => cls.id === rec.classId);
  const saved = { ...rec, classSnapshot: snapshot, updatedAt: new Date().toISOString() };
  if (!validRecord(saved)) throw new Error("Invalid attendance record");
  window.localStorage.setItem(PREFIX + rec.date + "_" + rec.classId, JSON.stringify(saved));
}
export function recordFor(classId: string): AttRecord {
  const date = lessonDate(classId);
  const rec = readRecord(date, classId) ?? { date, classId, students: Object.create(null) as Record<string, AttEntry> };
  const cls = readClasses().find((item) => item.id === classId);
  for (const student of cls?.students ?? []) {
    if (!Object.hasOwn(rec.students, student.name)) rec.students[student.name] = defaultEntry();
  }
  return rec;
}
export function ensureTodayRecord(cls: AttClass) {
  const rec = recordFor(cls.id);
  for (const student of cls.students) {
    if (!Object.hasOwn(rec.students, student.name)) rec.students[student.name] = defaultEntry();
  }
  writeRecord(rec);
}
export function presentStudents(cls: AttClass | null): string[] {
  if (!cls) return [];
  const rec = readRecord(lessonDate(cls.id), cls.id);
  return cls.students.filter((student) => (rec?.students[student.name] ?? defaultEntry()).p === 1)
    .map((student) => student.name);
}

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function updateActiveClassStudents(names: string[]): boolean {
  const id = readActiveId();
  const classes = readClasses();
  const cls = classes.find((item) => item.id === id);
  if (!cls) return false;
  ensureTodayRecord(cls);
  cls.students = [...new Set(names.map((name) => name.trim()).filter(Boolean))].map((name) =>
    cls.students.find((student) => student.name === name) ?? { name, grade: null, card: null });
  writeClasses(classes);
  ensureTodayRecord(cls);
  notify();
  return true;
}
const validDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
function validClasses(value: unknown): value is AttClass[] {
  return Array.isArray(value) && value.every((cls) => object(cls) &&
    typeof cls.id === "string" && cls.id.length > 0 && typeof cls.name === "string" &&
    typeof cls.day === "string" && typeof cls.time === "string" &&
    Array.isArray(cls.students) && cls.students.every((s) => object(s) &&
      typeof s.name === "string" && s.name.trim().length > 0 &&
      (s.grade === null || typeof s.grade === "string") &&
      (s.card === null || ["P", "B", "G"].includes(String(s.card)))) &&
    new Set(cls.students.map((s) => s.name)).size === cls.students.length) &&
    new Set(value.map((cls) => cls.id)).size === value.length;
}
function validRecord(value: unknown): value is AttRecord {
  return object(value) && validDate(value.date) && typeof value.classId === "string" &&
    value.classId.length > 0 && object(value.students) &&
    Object.entries(value.students).every(([name, e]) => name.trim().length > 0 && object(e) &&
      ["p", "hw", "bag"].every((field) => e[field] === 0 || e[field] === 1) &&
      (e.book === undefined || e.book === 0 || e.book === 1)) &&
    (value.classSnapshot === undefined ||
      (object(value.classSnapshot) && validClasses([value.classSnapshot]) && value.classSnapshot.id === value.classId));
}
export function allRecords(): AttRecord[] {
  const records: AttRecord[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    const value = JSON.parse(window.localStorage.getItem(key)!);
    if (!validRecord(value) || key !== PREFIX + value.date + "_" + value.classId) {
      throw new Error("Invalid saved lesson");
    }
    records.push(value);
  }
  return records.sort((a, b) => a.date.localeCompare(b.date));
}
export function exportAttendanceBackup(): string {
  return JSON.stringify({
    format: "classroom-attendance", version: 1, exportedAt: new Date().toISOString(),
    classes: readClasses(), activeClassId: readActiveId(), records: allRecords(),
  }, null, 2);
}
export function restoreAttendanceBackup(text: string): number {
  const data: unknown = JSON.parse(text);
  if (!object(data) || data.format !== "classroom-attendance" || data.version !== 1 ||
      !validClasses(data.classes) || !Array.isArray(data.records) || !data.records.every(validRecord) ||
      !(data.activeClassId === null || typeof data.activeClassId === "string")) {
    throw new Error("Not a valid Classroom Tools attendance backup");
  }
  const records = data.records as AttRecord[];
  const keys = records.map((r) => PREFIX + r.date + "_" + r.classId);
  if (new Set(keys).size !== keys.length) throw new Error("Duplicate lessons in backup");
  let current: AttClass[] = [];
  let damagedClasses: string | null = null;
  try { current = readClasses(); }
  catch { damagedClasses = window.localStorage.getItem(CLASSES_KEY); }
  const classes = [...current, ...data.classes.filter((cls) => !current.some((c) => c.id === cls.id))];
  // Recover missing data only: never overwrite newer local attendance silently.
  const writes = new Map<string, string>([[CLASSES_KEY, JSON.stringify(classes)]]);
  let recovered = 0;
  if (damagedClasses !== null) {
    writes.set("classroom-tools-att-recovery-" + Date.now(), damagedClasses);
  }
  records.forEach((record, index) => {
    const original = window.localStorage.getItem(keys[index]);
    let valid = false;
    try {
      if (original !== null) {
        const saved = JSON.parse(original);
        valid = validRecord(saved) && saved.date === record.date && saved.classId === record.classId;
      }
    } catch { /* Keep damaged bytes separately before recovering this lesson. */ }
    if (!valid) {
      if (original !== null) writes.set("classroom-tools-att-recovery-" + Date.now() + "-" + index, original);
      writes.set(keys[index], JSON.stringify(record));
      recovered++;
    }
  });
  const activeId = readActiveId();
  if (!classes.some((cls) => cls.id === activeId)) {
    const recoveredId = classes.find((cls) => cls.id === data.activeClassId)?.id ?? "";
    writes.set(ACTIVE_KEY, recoveredId);
  }
  const originals = new Map([...writes.keys()].map((key) => [key, window.localStorage.getItem(key)]));
  try {
    for (const [key, value] of writes) window.localStorage.setItem(key, value);
  } catch (error) {
    for (const [key, value] of originals) {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    }
    throw error;
  }
  notify();
  return recovered;
}

