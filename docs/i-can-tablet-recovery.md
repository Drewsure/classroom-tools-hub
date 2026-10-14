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
The new service worker is v1.5.25. Updates retain the previous build's caches for existing
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

## Persistent Android black screen
After the push of 2dfe037, a network check confirmed production served worker v1.5.22
and the display-mode bootstrap. This does not prove the tablet loaded that build.
Open /tablet-check.html in the normal browser after deploying the diagnostic-page
commit. This standalone white page uses no React, Tailwind, filters or animation,
and does not access classroom storage. A screenshot captures browser/OS information,
basic image/color support and the worker version available from the server. That
version is not claimed to be the version controlling an already-open tablet tab.
Compare normal Chrome, the installed app and a private-tab test without clearing
the original app's data. Do not uninstall or clear website storage before exporting
saved records. The physical tablet's root cause remains unconfirmed.

The tablet subsequently displayed the plain diagnostic page but still flashed and
went blank in /?safe=1. Embedded SVG icon filters are now removed at the generator,
with a fresh image URL so old cache entries cannot silently retain those filters.
Compatibility mode also removes text/box shadows and fixed background attachment.
/?safe=2 provides an opt-in plain launch board with all 29 tool buttons. This is a
diagnostic/recovery option, not a replacement for the normal illustrated board.
Closing a tool preserves the safe query parameter. Local browser checks verified
launching, starting, pausing and closing a timer; on-device verification is pending.

## Student-facing tablet board
After the user confirmed plain mode tools worked, compatible display now has its own
illustrated student board, not a permanent text-only menu. It preserves the 29 manga
tool icons, shared search/category/favorites state, roster access and attendance.
The original layered board is not mounted after compatible-display hydration. The
tablet board uses a single normal document scroller, opaque picture tiles, fixed
image dimensions, lazy image decoding and no decorative filters or blend layers.
Touch-pointer detection also handles Android's desktop-style user-agent. The explicit
/?safe=1 link selects this illustrated board, while /?safe=2 keeps the plain fallback.
Phone screens use a native category menu to avoid burying the illustrations under
rows of category buttons. Desktop non-touch screens retain the existing board.
Production-browser checks at the tablet's reported 686px width confirmed ten timer
cards fit vertically, all ten images loaded and no horizontal overflow. Search and
timer start/pause/close worked. Physical-tablet testing of v1.5.24 is still required.

## SVG-to-PNG rendering test
The user then supplied a tablet screenshot with heavy streaking and repeated artwork
in the illustrated board. This is not a successful on-device fix. Because the plain
page's PNG icon displayed correctly, v1.5.25 tests PNG tool thumbnails in place of
SVG images while retaining the same artwork and layout. This does not establish that
SVG rendering or the tablet GPU is the root cause.

The existing icon generator now retains vector sources and bakes 29 separate
bitmap-*.png assets at 320x320 using Sharp. All tool-icon consumers use the new URLs,
so previously cached SVG responses cannot substitute for the bitmaps. All 29 PNGs
are precached and checked for PNG signatures, fixed dimensions, successful decoding
and nonblank color content. The bitmap payload adds about 1.45 MB; full decoded
thumbnail memory is bounded at about 11.3 MiB for all 29 images. The diagnostic page
shows snail, picker and weather PNG examples for an independent tablet test.

Local production-browser verification passed, but physical-tablet verification is
pending. No classroom data is cleared by these changes.
An npm audit during the lockfile update also reported five high-severity entries
in the existing ESLint dependency chain, all stemming from the braces nested-pattern
DoS advisory GHSA-vfj7-8cjw-p6xm. These are not claimed to cause browser corruption.
No forced downgrade of eslint-config-next was applied during the emergency UI fix.
