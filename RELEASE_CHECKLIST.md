# CS.RIN.RU 4.01 — release checklist

Unpublished patch, 4 November 2026, following public 4.00. Checked items require local code/test evidence; unchecked items need real-site validation or a release decision. [Paste-ready Greasy Fork changelog](GREASYFORK_CHANGELOG.md).

## Version and scope

- [x] Public userscript version 4.01; development package version 4.0.1.
- [x] Changelog describes only user-visible changes since public 4.00.
- [x] Preserve the installable filename, name, namespace and update identity.
- [x] Restore Enhanced forum-tag colours and add the SteamDB logo only to the CS.RIN AppID shortcut.
- [x] Preserve preview typography, sizing, reviews, Steam tags, matching and media behavior.
- [x] Bundle the icon locally and record its upstream source/licence; no extra icon request.

## Local verification

- [x] Compare 21 original Enhanced colour fixtures, including dark/light backgrounds, Chinese and emoji tags.
- [x] Verify source inline colours, transparent ancestors and same-title colour-cache refresh.
- [x] Verify matched and failed previews, SteamDB destination/accessibility and 15 px logo.
- [x] Synchronize shared core 1.0.6, rebuild both scripts and check the source/hash locks.
- [x] Run lint, Node tests, generated-build/syntax checks, formatting and isolated browser cases for both adapters.
- [x] Confirm 1337x stays at 5.00 and its public changelogs/package metadata remain unchanged.


Verified: **71 CS.RIN Node tests, 65 1337x Node tests and 60 browser cases passed**. Lint, build, syntax/generated-output, formatting and shared-source checks passed in both repositories.

## Real browser and release checks

- [ ] Install the rebuilt 4.01 script in the intended userscript manager and verify its version.
- [ ] Compare CRACKED, Early Access and VR Optional with actual Enhanced forum-title colours, including Dark Reader on/off where used.
- [ ] Verify AppID copy, the SteamDB-logo link and Open Latest Page on a logged-in forum listing.
- [ ] Check cold/cached hovers, actual Steam tags, review updates and media controls in the real browser.
- [ ] Review the generated script and remaining manual results, then publish deliberately when ready.

See [colour compatibility notes](docs/wiki/Enhanced-Tag-Colors.md), [current verification](docs/wiki/csrinru-4.01-verification.json) and [development commands](CONTRIBUTING.md). The automated work does not install or publish the script.
