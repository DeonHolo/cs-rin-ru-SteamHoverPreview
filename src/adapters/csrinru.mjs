export function selectLatestTopicUrl(topicUrl, links, baseUrl) {
    const base = new URL(baseUrl);
    const topic = new URL(topicUrl, base);
    const topicId = topic.searchParams.get('t');
    const candidates = [];
    for (const link of links) {
        try {
            const url = new URL(link.href, base);
            if (url.origin !== base.origin || !/\/viewtopic\.php$/i.test(url.pathname)) continue;
            const explicitLast =
                /(?:^|\s)(?:lastpost|last-post)(?:\s|$)/i.test(link.className || '') ||
                /\b(?:last post|latest post|последн(?:ее|ий) сообщени)/i.test(`${link.title || ''} ${link.text || ''}`);
            const postId = Number(url.searchParams.get('p') || url.hash.match(/^#p(\d+)$/)?.[1] || 0);
            const linkedTopic = url.searchParams.get('t');
            // phpBB also emits explicit last-post links containing only p=<id> in this topic's row.
            if (linkedTopic !== topicId && !(linkedTopic === null && explicitLast && postId > 0)) continue;
            const start = Number(url.searchParams.get('start') || 0);
            if (!Number.isFinite(start) || start < 0 || !Number.isFinite(postId) || postId < 0) continue;
            candidates.push({ url, start, postId, explicitLast });
        } catch {
            /* Unusable or foreign links are ignored. */
        }
    }
    const explicit = candidates
        .filter((item) => item.explicitLast && item.postId > 0)
        .sort((a, b) => b.postId - a.postId)[0];
    const latestPost = candidates.filter((item) => item.postId > 0).sort((a, b) => b.postId - a.postId)[0];
    const latestPage = candidates.sort((a, b) => b.start - a.start)[0];
    return (explicit || latestPost || latestPage)?.url.href || topic.href;
}

export function extractForumThreadTags(rawTitle) {
    const seen = new Set();
    return (String(rawTitle).match(/\[[^\]]+\]/g) || []).filter((tag) => {
        const key = tag.toLowerCase();
        if (key === '[info]' || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// CS.RIN.RU Enhanced 1.2.9 colorize(), SubZeroPL, Unlicense.
// Keep its UTF-16 hash, sine colour and source-background rerolls exactly compatible.
// https://github.com/SubZeroPL/cs-rin-ru-enhanced-mod
export function csrinruEnhancedTagColor(tag, backgroundRgb = [28, 28, 28]) {
    let hash = 0;
    const lower = String(tag).toLowerCase();
    for (let index = 0; index < lower.length; index++) hash = lower.charCodeAt(index) + ((hash << 5) - hash);
    const background = backgroundRgb.reduce((sum, value) => sum + value, 0);
    let color;
    // Normal tags settle in a few iterations. Bound malformed/pathological inputs.
    for (let attempt = 0; attempt < 1024; attempt++) {
        color = Math.floor(Math.abs(((Math.sin(hash) * 10000) % 1) * 16777216)).toString(16);
        // Upstream reads the unpadded hex components; padding earlier changes its output.
        const brightness = [0, 2, 4].reduce(
            (sum, offset) => sum + parseInt(color.substring(offset, offset + 2), 16),
            0
        );
        if (!(Math.abs(brightness - background) < 300)) break;
        hash = (hash << 5) - hash;
    }
    return '#' + color.padStart(6, '0');
}

export function csrinruSourceBackground(sourceParent, getStyle) {
    for (let parent = sourceParent; parent; parent = parent.parentElement) {
        const background = getStyle(parent).getPropertyValue('background-color');
        const rgb = background.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (rgb) return rgb.slice(1).map(Number);
    }
    return [28, 28, 28];
}

function csrinruInlineTagColor(value) {
    const color = String(value || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(color))
        return (
            '#' +
            [...color.slice(1)]
                .map((ch) => ch + ch)
                .join('')
                .toLowerCase()
        );
    const rgb = color.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
    if (!rgb || rgb.slice(1).some((value) => Number(value) > 255)) return '';
    return (
        '#' +
        rgb
            .slice(1)
            .map((value) => Number(value).toString(16).padStart(2, '0'))
            .join('')
    );
}

export function csrinruThreadTags(link, getStyle) {
    const background = csrinruSourceBackground(link.parentElement, getStyle);
    const spans = [...link.querySelectorAll('span')];
    const label = (text) =>
        String(text)
            .trim()
            .replace(/^\[|\]$/g, '')
            .trim()
            .toLowerCase();
    return extractForumThreadTags(link.textContent).map((text) => {
        // Enhanced creates separate bracket/label spans. Copy its raw inline colour,
        // not a computed foreground already transformed by a dark-mode extension.
        const colored = spans.find(
            (span) => label(span.textContent) === label(text) && csrinruInlineTagColor(span.style.color)
        );
        return {
            text,
            color: (colored && csrinruInlineTagColor(colored.style.color)) || csrinruEnhancedTagColor(text, background)
        };
    });
}

export function createCsrinruAdapter({ window: win, document: doc, cleanTitle, sourceTools }) {
    const selector =
        'a.topictitle, .topiclist a[href*="viewtopic.php"][href*="t="], table.forumline a[href*="viewtopic.php"][href*="t="]';
    const rows = new WeakMap();
    const sectionType = (text) => {
        const s = text.replace(/\s+/g, ' ').trim().toLowerCase();
        if (/^(?:topics|темы|sujets|themen)$/.test(s)) return 'topics';
        if (
            /^(?:announcements|объявления|annonces|ankündigungen|stickies|важные темы|важные|épinglés|wichtig)$/.test(s)
        )
            return 'pinned';
        return null;
    };
    function inTopics(row, link) {
        if (
            row.matches(
                '[data-topic-type="sticky"], [data-topic-type="announcement"], .sticky, .announcement, .global-announce, .topic_sticky, .topic_announce'
            ) ||
            row.querySelector('img[src*="sticky"], img[src*="announce"]')
        )
            return false;
        let prior = row.previousElementSibling;
        while (prior) {
            const section = sectionType(prior.textContent);
            if (section) return section === 'topics';
            prior = prior.previousElementSibling;
        }
        // A structural topic-title row is accepted without requiring an English heading.
        return (
            link.matches('a.topictitle') &&
            Boolean(row.closest('table.forumline, .topiclist, .forumbg, [data-topic-list]'))
        );
    }
    function getSource(link) {
        if (!link?.matches?.(selector) || link.closest('.pagination, .lastpost, .last-post, .postprofile')) return null;
        let url;
        try {
            url = sourceTools.safeUrl(link.getAttribute('href'));
        } catch {
            return null;
        }
        if (!/\/forum\/viewtopic\.php$/i.test(url.pathname)) return null;
        const id = url.searchParams.get('t');
        if (!/^[1-9]\d*$/.test(id || '')) return null;
        const rawTitle = link.textContent.replace(/\s+/g, ' ').trim();
        if (!rawTitle || /^\d+$/.test(rawTitle) || /^(?:next|previous|first|last)$/i.test(rawTitle)) return null;
        const row = link.closest('tr, li.row, .row') || link.parentElement;
        if (!row || !inTopics(row, link)) return null;
        const threadTags = csrinruThreadTags(link, win.getComputedStyle.bind(win));
        const rowLinks = [...row.querySelectorAll('a[href*="viewtopic.php"]')].map((anchor) => ({
            href: anchor.getAttribute('href'),
            text: anchor.textContent.trim(),
            title: `${anchor.title || ''} ${anchor.querySelector('img')?.alt || ''} ${anchor.querySelector('img')?.title || ''}`.trim(),
            className: anchor.className
        }));
        const fingerprint = `${rawTitle}|${url.href}|${JSON.stringify(threadTags)}|${JSON.stringify(rowLinks)}`;
        const old = rows.get(row);
        if (old?.fingerprint === fingerprint && old.link === link) return old.source;
        const title = cleanTitle(rawTitle);
        if (!title) return null;
        url.hash = '';
        url.searchParams.delete('start');
        url.searchParams.delete('p');
        const explicit = sourceTools.getSteamLinks(row);
        const source = {
            key: `csrinru:${id}`,
            title,
            rawTitle,
            url: url.href,
            link,
            latestUrl: selectLatestTopicUrl(url.href, rowLinks, win.location.href),
            threadTags,
            explicitAppId: explicit.length === 1 ? explicit[0].appId : undefined
        };
        rows.set(row, { fingerprint, source, link });
        return source;
    }
    return {
        id: 'csrinru',
        name: 'CS.RIN.RU Steam Hover Preview',
        selector,
        defaultTheme: 'dark',
        showAppId: true,
        getLinks: (root = doc) => [...root.querySelectorAll(selector)],
        getSource,
        getActions: (source) => [
            { id: 'latest', label: 'Open Latest Page', icon: 'external', href: source.latestUrl || source.url }
        ],
        async runAction() {},
        async findAppIds(source) {
            const parsed = await sourceTools.fetchDocument(source.url);
            const firstPost = parsed.querySelector(
                '.postbody .content, .postbody, .post .content, [data-post-content]'
            );
            if (!firstPost) throw new Error('No first-post content was found. Paste the correct Steam URL or AppID.');
            return sourceTools.getSteamLinks(firstPost);
        }
    };
}
