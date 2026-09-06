# Classroom Tools Hub - Disaster Prevention Log

## Golden rules
1. The project lives at C:\dev\classroom-tools-hub - NEVER inside OneDrive (node_modules sync = freezes and corruption).
2. Never run "npm run build" while the dev server is running (they share the .next folder).
3. NEVER clear site data / browsing data for the app origin - attendance, saved classes, and audio uploads live ONLY in browser storage.
4. Real student names never enter git - browser storage only (this repo is public).
5. Stay on Next.js 15.5.x until Vercel fixes the Next 16 packaging bug (missing next-server.js.nft.json).
6. Never run "npm audit fix --force".
7. After every working change: commit + push (Vercel deploys automatically).

## Browser data backup (run in F12 console on EACH site/device you use)
(function () {
  var out = {};
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k.indexOf("classroom-tools") === 0 || k.indexOf("attendance_") === 0) out[k] = localStorage.getItem(k);
  }
  var blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "classroom-tools-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
})();

Run monthly, and ALWAYS before any browser cleanup or audio-player upgrade.

## Incident log (near-disasters, causes, fixes)
1. Lost AI session - the bot died holding the only copy of the newest code. Recovered from GitHub + Vercel + downloaded pieces. Prevention: rule 7.
2. OneDrive project crash - syncing 20,000 node_modules files froze and corrupted the project. Fix: everything moved to C:\dev. Prevention: rule 1.
3. Git clone died mid-transfer (curl 18 / early EOF) - fix: download the ZIP in the browser, plus "git config --global http.version HTTP/1.1".
4. Dev/prod .next collision - starting the dev server right after a production build gave a 500 and "moduleId is not a function". Usually self-heals (Fast Refresh full reload). If it sticks: Ctrl+C, delete the .next folder, restart dev. Prevention: rule 2.
5. Verification-gate miscalibration - an edit script miscounted its anchors, discarded good edits, and reported SKIP. Lesson: a SKIP line means "verify before trusting", and gates must check markers, not counts.
6. Roster write-back contamination - the randomizers wrote their shrunken pools back into the shared roster, churning names between every tool once multiple classes synced. Fix: randomizers became read-only toward the roster (Stage 3, commit de8c520). Rule: only Enter Names and Attendance write rosters.
7. Next 16 on Vercel - compiled fine locally, failed in Vercel packaging (nft.json). Fix: downgrade to 15.5.x. Retry 16 only after Vercel confirms support.

## Maintenance playbook
- Start dev:      cd C:\dev\classroom-tools-hub ; npx next dev -p 3100
- Ship a change:  cd C:\dev\classroom-tools-hub ; git add . ; git commit -m "what changed" ; git push origin main
- Clean restart:  Ctrl+C the server, then: Remove-Item .next -Recurse -Force ; npx next dev -p 3100
- New site/device: re-import the class schedule via Attendance > Import (storage is per-site)
- Deploy check:   Vercel > Deployments (green in ~3 min), then Ctrl+Shift+R on the live site