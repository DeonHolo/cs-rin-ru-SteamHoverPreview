import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
    selectLatestTopicUrl,
    extractForumThreadTags,
    csrinruEnhancedTagColor,
    csrinruSourceBackground,
    csrinruThreadTags
} from '../src/adapters/csrinru.mjs';

test('latest page is greatest offset rather than last DOM anchor', () => {
    const href = selectLatestTopicUrl(
        '/forum/viewtopic.php?t=100',
        [
            { href: '/forum/viewtopic.php?t=100&start=120', text: '5' },
            { href: '/forum/viewtopic.php?t=100&start=30', text: '2' },
            { href: '/forum/viewtopic.php?t=999&start=999', text: '100' },
            { href: 'https://outside.example/forum/viewtopic.php?t=100&start=999', text: '100' }
        ],
        'https://cs.rin.ru/forum/viewforum.php?f=10'
    );
    assert.equal(new URL(href).searchParams.get('start'), '120');
    assert.equal(new URL(href).searchParams.get('t'), '100');
});

test('an explicit last-post link is preferred to page navigation', () => {
    const href = selectLatestTopicUrl(
        '/forum/viewtopic.php?t=100',
        [
            { href: '/forum/viewtopic.php?t=100&start=120', text: '5' },
            { href: '/forum/viewtopic.php?t=100&p=800#p800', title: 'View latest post' }
        ],
        'https://cs.rin.ru/forum/'
    );
    assert.equal(new URL(href).searchParams.get('p'), '800');
});

test('thread tags hide Info and deduplicate without erasing status text', () => {
    assert.deepEqual(extractForumThreadTags('[Info] Game [CRACKED] [cracked] [Early Access]'), [
        '[CRACKED]',
        '[Early Access]'
    ]);
});

test('explicit post-only links in the topic row work without accepting an unrelated topic', () => {
    const href = selectLatestTopicUrl(
        '/forum/viewtopic.php?t=100',
        [
            { href: '/forum/viewtopic.php?p=800#p800', title: 'View latest post' },
            { href: '/forum/viewtopic.php?t=999&p=900#p900', title: 'View latest post' },
            { href: '/forum/viewtopic.php?p=999#p999', title: 'Unrelated link' }
        ],
        'https://cs.rin.ru/forum/'
    );
    assert.equal(new URL(href).searchParams.get('p'), '800');
});

test('Enhanced colours match captured original output across backgrounds and UTF-16 titles', async () => {
    const fixture = JSON.parse(
        await readFile(new URL('./fixtures/csrinru/enhanced-tag-colors.json', import.meta.url), 'utf8')
    );
    for (const { tag, background, color } of fixture.cases) {
        assert.equal(csrinruEnhancedTagColor(tag, background), color, tag + ' on ' + background);
        assert.equal(csrinruEnhancedTagColor(tag.toUpperCase(), background), color);
    }
});

test('Enhanced background follows the source parent through transparent ancestors', () => {
    const grandparent = { background: 'rgb(240, 240, 240)', parentElement: null };
    const parent = { background: 'rgba(0, 0, 0, 0)', parentElement: grandparent };
    const getStyle = (element) => ({ getPropertyValue: () => element.background });
    assert.deepEqual(csrinruSourceBackground(parent, getStyle), [240, 240, 240]);
    assert.deepEqual(csrinruSourceBackground(null, getStyle), [28, 28, 28]);
});

test('existing Enhanced inline colours take priority; absent/unsafe colours use its original algorithm', () => {
    const spans = [
        { textContent: '[', style: { color: 'rgb(1, 2, 3)' } },
        { textContent: 'CRACKED', style: { color: 'rgb(225, 69, 100)' } },
        { textContent: 'Early Access', style: { color: 'url(unsafe)' } }
    ];
    const link = {
        textContent: '[Info] Game [CRACKED] [Early Access] [cracked]',
        parentElement: null,
        querySelectorAll: () => spans
    };
    assert.deepEqual(
        csrinruThreadTags(link, () => ({})),
        [
            { text: '[CRACKED]', color: '#e14564' },
            { text: '[Early Access]', color: '#b7ba6d' }
        ]
    );
    spans[1].style.color = '#abc';
    assert.equal(csrinruThreadTags(link, () => ({}))[0].color, '#aabbcc');
});
