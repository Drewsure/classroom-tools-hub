# Timer, Card and Dice Audio

Implemented 14 October 2026.

Countdowns speak "One minute remaining", "Forty five seconds remaining" and "Thirty seconds remaining". Stopwatches use matching elapsed-time phrases. The three marks fire once per run, including when starting exactly at a mark. Pause/resume does not repeat them. Reset rearms them. A long background delay skips stale announcements rather than queueing several incorrect time messages.

The shared countdown hook covers all nine countdown tools, Activity Hub's race timer, PE's lesson timer, and Tally's mini timer. Dashboard timer widgets embed these same components. Stopwatch and Stopwatch + Splits use the shared elapsed-time hook. The existing spoken final ten seconds remain.

## Research and Selection

- [Kenney Casino Audio](https://kenney.nl/assets/casino-audio): explicitly CC0, with recorded card and dice foley. Selected paper shuffle/slide and dice throw clips replace the electronic sweep and repeated pitched ticks.
- [Kenney Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds): explicitly CC0. Selected a thruster and a short crunch explosion for the rocket and bomb.
- [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds): explicitly CC0. Selected separate confirmation, glass, stop and clock-click cues.
- [Microsoft SAPI file streams](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ms722562(v=vs.85)) support recording a local installed voice into WAV. The English Zira voice on this computer produced the six milestone announcements.

Original Kenney licence files are retained in audio-licenses. These are recordings/edited samples, not a claim that their perceived quality was rated by students. Test loudness on the classroom speaker before a lesson.

## Sound Map

| Tool | Finish |
| --- | --- |
| Classic | Short confirmation chime |
| Rocket | Thruster ignition |
| Bomb | Short explosion/crunch |
| Candle | Soft air/paper puff |
| Hourglass | Resonant short bong |
| Radial | Glass chime |
| Snail Race and Activity Hub race | Original crowd cheer |
| Traffic Light | Short stop tone |
| Progress Bar | Different confirmation cue |
| PE lesson | Separate lesson-finish cue |
| Tally mini timer | Separate round-finish cue |
| Stopwatch | Clock-like start/lap click, with elapsed announcements |

## Build and Reliability

build-classroom-cues.mjs contains the exact original pack filenames. It converts selected OGG clips to mono 16-bit PCM WAV, caps effects at 2.4 seconds, applies high/low pass filtering and short fades, and normalizes peaks to 0.55. Voice peaks are normalized to 0.68. The original Sound Pad heartbeat, thinking, giggle and cheer MP3s are untouched.

Runtime playback uses cached samples, resumes the AudioContext during a user gesture, separates voice/effect channels, cancels pending playback on pause/reset/mute/unmount, and rejects out-of-date sample requests. Samples are precached by service worker v1.5.17. Generation tools are build-time helpers; no external audio server or account is needed during a lesson.

The doctor checks include milestone regression tests, unique countdown-finish mappings, PCM format/non-silence/peak checks, offline-cache coverage and preservation hashes for the four favourite Sound Pad recordings.
