# CS.RIN.RU 4.03: search-result hover previews

Forum search results were silently rejected before any Steam lookup. The adapter's structural fallback accepted forumline/topiclist/forumbg containers but omitted the actual tablebg table used by CS.RIN's topic search. Normal forum listings could pass through a separate Topics section heading; search results use a combined Topics / Author / Replies / Views / Last post column heading, so that route did not apply.

The CS.RIN adapter now recognizes topic-title links in table.tablebg as well. Existing sticky/announcement exclusions stay in place. Only a.topictitle links get the structural fallback; pagination and ordinary post-reference links do not become hover targets. Nested search-highlight spans are read as part of the title. Matching, tags, storage, colours and shared core remain unchanged; 1337x needs no change.

The sanitized fixture tests/fixtures/csrinru/search-topics.html reproduces the observed table class, combined heading, row classes, title-highlight span, pagination and latest-post structure. It contains no session IDs, account information or authenticated content. The regression was reproduced against the old generated 4.02 script: the valid search preview timed out without loading. The same case is rerun after rebuilding 4.03, alongside normal forum and ignored-link cases. See [verification](search-results-verification-2026-11-05.json).

## Explicit section protection in 4.04

The live forum also uses Global Announcements headings and global_read/global_read_locked icons. These are now explicitly excluded alongside Announcements and Stickies. Section-heading recognition tolerates surrounding colons. A dedicated browser case verifies that each non-Topics section and both global icons start no Steam requests, while a normal row below Topics still opens a preview.
