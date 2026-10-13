# Classroom Sound Pad Research

Reviewed 14 October 2026. Intended audience: elementary ESL classes in Japan, with students operating a projected board and the teacher sometimes using an iPhone.

## Recommendation

Keep the integrated Sound Pad as the classroom's primary board. Give the four established favourites prominent positions, use clear collections, and keep volume and Stop All permanently reachable. Native soundboards are useful fallback options, especially when a lesson needs custom music, trimming or loops. They do not replace this app's linked attendance, timers and flashcards.

This recommendation is a design judgment informed by the sources below, not a claim that competing apps have been installed or tested here.

## Alternatives

| Option | Best fit | Verified capabilities | Classroom tradeoff |
| --- | --- | --- | --- |
| [Soundboard Studio](https://apps.apple.com/us/app/soundboard-studio/id1108810082?platform=ipad) | iPhone/iPad fallback | Local file import, track volumes, trimming, fades, multiple boards, low-latency playback; some features require Pro | A separate board to maintain. Free limits and paid features need checking in the local App Store before purchase. |
| [Farrago](https://www.rogueamoeba.com/farrago/index.php) | Mac classroom computer | Labelled tiles, sound sets, keyboard playback, relative volumes, loops, trimming/fades and lockable sets | Mac-specific; useful for a teacher-operated board, with more production controls than young students need. |
| [Jingle Palette Reloaded](https://jinglepalettereloaded.com/) | Windows fallback | Its [official manual](https://jinglepalettereloaded.com/manual/5.6/English/en/settings.htm) documents fullscreen operation and archiving palettes with associated audio | Investigate as a Windows fallback. No installation or classroom usability test was performed. |
| [SoundTools local Soundboard](https://soundtools.online/soundboard/) | Browser-based custom clips | Twelve pads, keyboard control, local file loading, trimming, export and IndexedDB storage | Saved clips are tied to the browser/device; keep exported backups. |
| [Simulation Lab classroom soundboard](https://thesimulationlabedu.com/classroom-soundboard) | Quick classroom cues | A teacher-focused board synthesizing bell, buzzer, applause, drumroll and other effects in the browser | Synthesized effects may not meet the user's preference for natural giggles and recorded crowds. |
| [ESL Tools](https://www.esltools.net/) | Additional ESL soundboard to investigate | The official site lists a custom soundboard | Its public page did not expose enough detail to verify offline operation or persistence. Do not assume either. |

## Sound Sources

- [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds): 100 sound files, explicitly CC0. Good candidates for short confirmation, selection and transition cues.
- [Kenney Music Jingles](https://kenney.nl/assets/music-jingles): investigate brief reward/round-complete jingles. Verify the selected download's licence and audition it before adding it.
- [Freesound's licensing FAQ](https://freesound.org/help/faq/): individual recordings use different licences. Prefer CC0 for natural applause, classroom bells or foley, and retain the exact recording page and author information for each imported file.
- [Mixkit's sound-effect licence](https://mixkit.co/license/modal/sfxFree/): permits incorporated end products but prohibits standalone redistribution in a tool or with source files. Do not directly copy its stock recordings into this public soundboard repository without resolving that restriction.

No external recording was downloaded or substituted during this pass. The four favourite files remain byte-identical: heartbeat.mp3, gameshow.mp3 (thinking), laugh.mp3 (giggle), and cheer.mp3.

## Implemented Improvements

- Favourite collection opens first; other collections retain access to all 24 sounds.
- Opaque labels, large touch pads, persistent volume/mute/Stop All controls and live loading/playing/error feedback.
- Mute restores the previous volume rather than jumping to 70%.
- Stop All cancels pending playback and reuses the AudioContext.
- A newer pad request wins over an earlier slow download.
- Preloading fetches bytes without creating an AudioContext before the first gesture.
- Loading failures offer a retry; no unrelated synthesizer cue substitutes for a missing recording.

## Next Audio Selection Criteria

Audition each replacement on the classroom speaker before shipping it. Prefer short, clean, recognisable cues with little leading silence. Compare peak level and perceived loudness against the established favourites; avoid sudden loud transients. Keep source, licence, original file and processing notes together. Technical decoding checks cannot establish whether children find a recording pleasant.

Potential replacements to audition: a gentle classroom attention bell, a soft correct-answer chime, a short celebration jingle, a cartoon spring and a quieter transition swoosh. Retain the four favourites unless the teacher explicitly requests a replacement.
