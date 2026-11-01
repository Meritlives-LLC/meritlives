// Execute the established editorial scenarios unchanged, waiting for local lazy-loaded
// Filament assets before navigating again. Keep evidence separate from the earlier run.
const fs = require('node:fs');
const path = require('node:path');
let source = fs.readFileSync(path.join(__dirname, 'editorial-browser.cjs'), 'utf8');
source = source.replace("path.resolve('../backend/tests/browser/evidence')", "path.resolve('../backend/tests/browser/feature-image-evidence/writing-regression')");
source = source.replaceAll("waitUntil:'domcontentloaded'", "waitUntil:'networkidle'");
source = source.replace("await editor.fill(", "await page.waitForFunction(()=>document.querySelector('trix-editor')?.isContentEditable);await editor.fill(");
source = source.replace("page.on('pageerror',e=>errors.push(e.message));", "page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',page.url(),e.stack);});");
eval(source);
