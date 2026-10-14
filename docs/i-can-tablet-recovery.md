# I Can Cards and Tablet Loading

## New teaching resources
Flash Card Presenter includes I Can! Cards (11 supplied PNGs) and I Can! Song Sequence
(40 manually advanced cues matching the supplied verse and chorus order).
The eight core actions are jump, run, stretch, spin, walk, cook, climb and sing.
Dance, swim and Do It All are extras, not inserted into the supplied song's lyrics.

Selecting either set opens a focused lesson screen. Portrait card artwork is contained
without cropping. The original MP3, previous/next/first controls and card-set return
remain visible. Landscape tablet/desktop views place controls beside the image.
The native music player pauses on leaving the focused screen.
There is no guessed timed synchronization; Next advances the cue manually.

The song is also included in Audio Player independently of device-local uploaded tracks.
Its original 4,128,899 bytes are preserved; no resampling or re-encoding was applied.
The 438 MB attached video was not added to the public download.
Images and MP3 are precached for offline use after a successful download.

## Tablet incident
On investigation, the live production URL returned HTTP 200 and service worker v1.5.2.
GitHub main contained v1.5.1; aaa-integration contained v1.5.20 before these changes.
Vercel reported success for commit 962b4a1, but the production alias still served older code.
An open PR from aaa-integration was not found.
These observations show deployment differences, not proof of the tablet's flashing cause.
The tablet model/OS and an on-device retest are still required.

## Loading safeguards
The new service worker is v1.5.22. Updates retain the previous build's caches for existing
tabs, do not delete unrelated caches, require a healthy offline shell before activation,
and do not replace it with server-error responses. RSC responses are not cached as HTML.
Safari-style media Range requests receive correct 206 responses from offline audio.
Partial network audio responses are not cached as complete recordings.
Worker registration bypasses HTTP worker caching and disposes its update timer on cleanup.
Recovery UI offers manual retry/reload, never automatic reload loops or deletion of records.
Object.hasOwn calls in attendance were replaced with a compatible own-property check.

## Verification
Android now defaults to a lower-compositing display before first paint. The URL
/?safe=1 enables the same mode on any device. Blur, filters, blend layers and decorative
confetti/flash/particles are removed; real images, layout transforms and functional
timer motion are preserved. No classroom storage is read or changed by this mode.
The reported black screen with working audio suggests rendering may be involved,
but does not identify the root cause. A current Chrome browser and physical-device
retest of the deployed build are still needed; this is not a legacy-browser polyfill.

npm run doctor includes lyric ordering, all 11 image signatures, original audio checksum,
offline media ranges, cache version retention, server-failure fallback and install failure.
Browser checks verified native MP3 playback (174.96 seconds), navigation, image loading and
header/control clearance on phone, portrait/landscape tablet and desktop-sized viewports.
These browser checks are not equivalent to an actual iPad/Android device test.
