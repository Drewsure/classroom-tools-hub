# Attendance Reliability

## One active class
The Attendance registry is authoritative whenever a class is selected. Name Picker,
Group Generator, Spinner Wheel, Order Shuffler, Tally loading and Activity Hub student
dice use the same class and presence flags. Legacy named rosters remain usable when
explicitly selected. Saving a legacy roster does not clear an ongoing attendance class.

Student games keep their local no-repeat pools separate from the permanent class
membership. Attendance/class changes cancel pending selection animations, including
delayed wheel/shuffler callbacks. An all-absent class cannot fall back to sample students.

## Saved lessons
Each class/date record is kept under the existing localStorage attendance key.
Present, homework, bag and book are separate fields. Old records preserve their
original three flags; Book was not recorded previously and is shown as unknown in history.
Records retain class snapshots and student entries even if the roster is later edited
or the class is removed. History CSV exports recorded students, not only the current roster.

An active session holds the Japan lesson date across midnight for up to 18 hours.
Today's lesson explicitly starts today's session without erasing an existing record.
This remains one record per class per day, not separate attendance for two same-day lessons.

## Recovery
Backup records downloads a versioned JSON containing classes and all saved lessons.
Restore validates the entire file before writing, recovers missing/corrupted lessons,
and never replaces a valid existing lesson with potentially older backup values.
Damaged bytes are retained under recovery keys before replacement.
A partial restore failure rolls back its attempted writes. Storage failures are visible.
Student names within a class must be unique (use surnames/initials where needed).

## Durability limits
These are persistent device/browser records, not a server database or cross-device sync.
Clearing website data, uninstalling with data removal, device loss or browser eviction
can remove local records. Keep downloaded JSON backups outside browser storage, preferably
in the school's managed backup location. Restoring on another device is supported.
No attendance data is transmitted to a server by these changes.

## Verification
Run npm run doctor. Attendance tests cover fields, all-absent classes, class changes,
midnight sessions, old-record migration, roster edits, removed classes, backup recovery,
invalid files, storage failures and partial-restore rollback. PE reference tests check
command/body-part/movement coverage. Browser verification used synthetic students only.
