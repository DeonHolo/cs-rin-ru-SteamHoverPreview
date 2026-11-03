# CS.RIN.RU 4.01: Enhanced colours and SteamDB logo

This patch follows public 4.00. It restores forum-tag colour compatibility and replaces the arrow beside the AppID with a small SteamDB logo. It preserves the existing preview typography, dimensions, Steam tags, review row and media controls.

## Colour contract

CS.RIN.RU Enhanced assigns colours by hashing the bracketed tag, generating a sine-based RGB value, and rerolling when its brightness is too close to the source title’s ancestor background. A generic hue/contrast palette introduced in the refactor did not preserve that contract.

The adapter now reads an existing Enhanced label span’s raw inline colour first. Enhanced creates separate bracket and label spans; computed foreground colours are deliberately not copied because a dark-mode extension may have already transformed them. Without a coloured label span, the original Enhanced 1.2.9 calculation runs against the nearest opaque RGB source ancestor, falling back to RGB 28,28,28. The preview theme does not choose forum-tag colours.

The calculation keeps the original UTF-16 hash and unpadded hex parsing; changing either changes results. The reroll loop has a safety limit of 1024 iterations for pathological inputs. Source caching includes resolved tag colours so late Enhanced styling is picked up on the next hover even when the title text is unchanged. Redundant Info tags stay hidden; duplicate status tags stay deduplicated.

On source background RGB 28,28,28:

| Forum tag | Colour |
| --- | --- |
| CRACKED | #e14564 |
| Early Access | #b7ba6d |
| VR Optional | #4ff2a6 |

These are forum-status tags, separate from Steam’s user-defined game tags. A forum theme or Enhanced fork may choose different source colours; existing valid inline colours take precedence.

## SteamDB shortcut

The AppID row uses the SteamDB logo’s unmodified path from Simple Icons under CC0-1.0, at the existing 15 px action-icon size and link colour. The accessible name remains Open SteamDB and the destination remains the matched AppID’s SteamDB page. The SVG is bundled locally, adding no request. AppID copy stays separate.

Only the CS.RIN adapter shows the AppID/SteamDB row. The icon helper is synchronized through shared core 1.0.6; 1337x remains version 5.00 with its existing visible behavior and changelog.

## Verification and provenance

The site-specific fixture in tests/fixtures/csrinru/enhanced-tag-colors.json captures 21 original outputs across dark/light source backgrounds, Latin, Chinese and emoji tags. Adapter tests also cover transparent ancestors, existing inline colours and safe fallback. Chromium cases cover source-background compatibility, same-title colour refresh, failed VR previews and the locally bundled SteamDB shortcut. Current results are recorded in [4.01 verification](csrinru-4.01-verification.json).

- [CS.RIN.RU Enhanced 1.2.9 source](https://github.com/SubZeroPL/cs-rin-ru-enhanced-mod/blob/master/cs-rin-ru-enhanced-mod.user.js)
- [Simple Icons SteamDB SVG](https://github.com/simple-icons/simple-icons/blob/521c96fd04b0ea93034db8715eda5a4de27a58bb/icons/steamdb.svg)
- [Third-party notices](../../THIRD_PARTY_NOTICES.md)
- [Paste-ready changelog](../../GREASYFORK_CHANGELOG.md)

The automated browser checks use isolated mocked pages. Real userscript-manager, Dark Reader and logged-in forum checks remain on the [release checklist](../../RELEASE_CHECKLIST.md). No publishing or browser installation is performed by this change.
