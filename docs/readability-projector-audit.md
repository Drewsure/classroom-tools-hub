# Readability and Projector Audit

14 October 2026. Covers the 29 registered tools and their shared launcher.

## Findings Corrected

- Invalid launcher background allowed the light home screen through behind white labels. The opened tool now has a solid contrasting background.
- Header blur/clipping trapped the attendance overlay. Attendance now renders through a body portal above tool docks and closes independently with Escape.
- Fixed timer minimum widths/heights exceeded phone and short projector viewports. Shared container-based sizing keeps the artwork, readout and Pause control together.
- Timer presets, custom-time fields and stepper labels now have opaque contrasting surfaces; numeric fields are labelled. Teacher Reset remains guarded.
- White result labels on bright seasonal skins now have contrasting backgrounds across affected card, picker, dice and math tools.
- Activity Hub panel bodies can scroll when necessary. Its expanded race uses remaining height and larger snails/readout.
- PE popup close controls sit above their scrollable content.
- Letter/swatches grids adapt to phones; Audio Player's upload header wraps.
- Dashboard sound widgets use valid Tailwind gradients; saved-dashboard Delete controls have dark foregrounds on white.
- Sound Pad has a responsive collection view and a permanently visible volume/mute/Stop All dock.

## Verification

- Source review covered all registered tool implementations.
- Parent browser sweep checked all 29 idle screens for horizontal overflow at a wide viewport and actual CSS width 390px. Sound Pad and Audio Player header overflows were found and fixed.
- All ten running timers were checked at actual CSS viewport 1280 x 721: Pause remained visible, with no horizontal overflow. Timer agent additionally checked setup/paused layouts at 375 x 667, 390 x 844, 1024 x 768 and 1920 x 1080.
- Selected expanded panels, bright themes, the PE popup and Attendance were inspected separately.
- Every one of the 24 Sound Pad recordings was clicked, decoded and started in the browser; Stop All returned the pad to Ready. No captured browser warnings or errors during this playback sweep.
- Nine regression tests cover preserved favourite files, loading cancellation, ordering, mute, context reuse, retries, completion and disposal.
- The doctor command includes registry/assets/sounds, these audio regression tests, TypeScript, lint and production build.

## Limits

This is a source and browser review, not proof that every possible state is problem-free. A phone-sized desktop browser does not replace testing an installed iPhone PWA on real Safari. Actual classroom speaker quality and back-row projector readability need an in-room check. Expanded theme lists, long rosters, large dashboards and lap histories may scroll intentionally; core controls must remain reachable.
