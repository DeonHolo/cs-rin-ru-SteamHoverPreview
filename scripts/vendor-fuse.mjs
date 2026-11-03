import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await readFile(path.join(root, 'node_modules/fuse.js/package.json'), 'utf8'));
if (pkg.version !== '7.5.0') throw new Error('Review and pin Fuse.js before updating the bundled asset.');
const source = await readFile(path.join(root, 'node_modules/fuse.js/dist/fuse.basic.min.mjs'), 'utf8');
const license = await readFile(path.join(root, 'node_modules/fuse.js/LICENSE'), 'utf8');
const notice =
    '/*\nFuse.js 7.5.0: unmodified upstream basic ESM with the full upstream license prepended.\n' + license + '\n*/\n';
const bundled = notice + source;
const asset = path.join(root, 'src/assets/fuse.basic.min.mjs');
if (process.argv.includes('--check')) {
    if ((await readFile(asset, 'utf8')) !== bundled)
        throw new Error('Bundled Fuse.js differs from the pinned package.');
} else {
    await writeFile(asset, bundled);
    await writeFile(path.join(root, 'src/assets/FUSE-LICENSE.txt'), license);
}
console.log(
    'Fuse.js 7.5.0 basic build and Apache-2.0 license ' + (process.argv.includes('--check') ? 'verified.' : 'bundled.')
);
