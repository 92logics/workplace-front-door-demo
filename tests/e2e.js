// Headless browser tests. Usage: NODE_PATH=/workspace/avatar-test/node_modules node tests/e2e.js <baseUrl> <shotsDir>
const puppeteer = require('puppeteer-core'); const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:8777/'; const SHOTS = process.argv[3] || '/tmp/wfd-shots'; fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0; const errors = [];
const ok = (c, n, x = '') => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('dialog', d => d.accept());
  const client = await page.target().createCDPSession(); fs.rmSync('/tmp/wfd-dl', { recursive: true, force: true }); await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: '/tmp/wfd-dl' });
  const go = async h => { await page.goto(BASE + h, { waitUntil: 'networkidle0' }); await sleep(150); };
  const txt = async s => page.$eval(s, e => e.textContent);
  // ---- mobile (iPhone-sized) ----
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const r = await page.goto(BASE, { waitUntil: 'networkidle0' }); ok(r.status() === 200, 'index loads ' + r.status());
  await page.evaluate(() => localStorage.clear()); await go('#/home');
  ok((await txt('#disclaimer')).includes('not a WorkPlace system'), 'disclaimer on page');
  ok(await page.$$eval('#needTiles .tile', e => e.length) === 5, '5 need-based tiles');
  ok(await page.$eval('.tabbar', e => getComputedStyle(e).display) === 'flex' && await page.$eval('#side', e => e.getBoundingClientRect().right <= 0), 'mobile: bottom tab bar, side menu hidden');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'mobile: no horizontal overflow');
  await page.screenshot({ path: SHOTS + '/demo-screenshot-mobile-home.png' });
  await page.click('#menuBtn'); await sleep(300); ok(await page.$eval('#side', e => e.classList.contains('open')), 'mobile menu opens'); await page.click('#menuBtn');
  await page.click('#langBtn'); await sleep(150); ok((await txt('h1')).includes('¿Qué necesita') && await page.evaluate(() => document.documentElement.lang === 'es'), 'Spanish toggle (sample translation)'); await page.click('#langBtn'); await sleep(100);
  await page.click('#textBtn'); ok(await page.evaluate(() => document.documentElement.classList.contains('big')), 'larger-text toggle'); await page.click('#textBtn');
  // need tile
  await page.click('[data-need=training]'); await sleep(250); ok((await txt('main')).includes('Your next steps') && await page.$$eval('.listing', e => e.length) >= 3, 'need tile → guided next steps + matches');
  // find with filters
  await go('#/find'); const all = await page.$$eval('.listing', e => e.length);
  await page.type('#fq', 'cna'); await page.$eval('#fq', e => e.dispatchEvent(new Event('change', { bubbles: true }))); await sleep(150);
  const cna = await page.$$eval('.listing', e => e.length); ok(cna >= 2 && cna < all, `keyword search narrows (${all}→${cna})`);
  await page.$eval('#fq', e => { e.value = ''; }); await page.select('#ft', 'training'); await page.click('#ffree'); await sleep(150);
  ok((await page.$$eval('.listing .meta', e => e.filter((_, i) => i % 2 === 0).map(x => x.textContent))).every(t => t.startsWith('TRAINING')), 'type + free filter');
  await page.select('#ft', ''); await page.click('#ffree'); await page.select('#ftown', 'Bridgeport'); await sleep(150);
  ok((await page.$$eval('.listing', e => e.map(x => x.querySelector('.meta').textContent))).every(t => t.includes('Bridgeport')), 'town filter');
  await page.click('.saveBtn'); await sleep(100); await page.click('.intBtn'); await sleep(150);
  ok((await page.$eval('.intBtn', e => e.textContent)).includes('Sent R-'), 'I\'m interested → referral reference');
  await go('#/saved'); ok(await page.$$eval('#savedList .listing', e => e.length) === 1, 'saved opportunity listed');
  // events + ics
  await go('#/events'); ok(await page.$$eval('#evList .card', e => e.length) === 5, '5 events');
  await page.click('.regBtn'); await page.click('.icsBtn'); await sleep(700);
  ok(fs.existsSync('/tmp/wfd-dl') && fs.readdirSync('/tmp/wfd-dl').some(f => f.endsWith('.ics')), 'Add to calendar downloads .ics');
  // screener
  await go('#/screener'); await page.type('#sAge', '20'); await page.select('#sStatus', 'laid_off'); await page.click('#sDig'); await page.click('#scrForm button'); await sleep(200);
  ok(await page.$$eval('.scrMatch', e => e.length) === 5 && (await txt('#scrOut')).includes('Young adult'), 'screener shows 5 explained matches');
  await page.screenshot({ path: SHOTS + '/demo-screenshot-mobile-screener.png', fullPage: false });
  // appointment with SMS consent (user already opted in) → confirmation SMS + inbox
  await go('#/appointments?topic=career'); ok(await page.$eval('#aTopic', e => e.value) === 'career', 'appointment topic prefilled from link');
  await page.$eval('#aDate', e => e.value = '2026-11-10'); await page.click('#apptForm button'); await sleep(250);
  ok((await txt('#apptOut')).includes('A-2001') && (await txt('#apptOut')).includes('confirmation text'), 'appointment request + simulated confirmation text');
  ok((await txt('#apptTable')).includes('Career planning'), 'request listed in My requests');
  // inbox
  await go('#/inbox'); const n = await page.$$eval('.msgItem', e => e.length); ok(n >= 5, 'inbox has confirmations (' + n + ')');
  const unread0 = await txt('#unread'); await page.click('.msgItem summary'); await sleep(150); ok(+(await txt('#unread')) === +unread0 - 1, 'opening a message marks it read');
  await page.screenshot({ path: SHOTS + '/demo-screenshot-mobile-inbox.png' });
  // employer
  await go('#/employer'); await page.type('#eCo', 'Sample Co'); await page.type('#eEmail', 'hr@example.com'); await page.click('#empForm button'); await sleep(150); ok((await txt('#empOut')).includes('B-'), 'employer pathway request');
  // ---- desktop / responsive web ----
  await page.setViewport({ width: 1366, height: 900 }); await go('#/home');
  ok(await page.$eval('.tabbar', e => getComputedStyle(e).display) === 'none' && await page.$eval('#side', e => e.getBoundingClientRect().width > 200), 'desktop: sidebar layout, no tab bar');
  await page.screenshot({ path: SHOTS + '/demo-screenshot-desktop-home.png' });
  // CMS
  await go('#/staff/content'); await page.$eval('#cmsBannerTxt', e => e.value = 'Hiring Fair on Friday - all welcome!'); await page.click('#cmsBannerSave'); await sleep(150);
  await go('#/home'); ok((await txt('#cmsBanner')).includes('Hiring Fair on Friday'), 'CMS banner change appears on home');
  await go('#/staff/content'); await page.click('.pubBtn[data-id=T299]'); await sleep(150);
  await go('#/find'); ok((await txt('#results')).includes('Solar Installer'), 'publishing draft makes it public');
  await go('#/staff/content'); await page.$$eval('.tVis', e => { e[4].checked = false; }); await page.click('#tilesSave'); await sleep(150); await go('#/home'); ok(await page.$$eval('#needTiles .tile', e => e.length) === 4, 'hide tile via CMS');
  await go('#/staff/content'); await page.type('#cTitle', 'Pop-up Job Club'); await page.$eval('#cDate', e => e.value = '2026-11-20T10:00'); await page.click('#cmsAdd button'); await sleep(150);
  await go('#/events'); ok((await txt('#evList')).includes('Pop-up Job Club'), 'staff-added event appears for public');
  await go('#/staff/content'); ok(await page.$$eval('#auditTable tbody tr', e => e.length) >= 4, 'CMS audit log records changes');
  await page.select('#role', 'Viewer'); await sleep(150); ok(await page.$eval('#cmsBannerSave', e => e.disabled), 'Viewer role is read-only');
  await page.select('#role', 'Admin'); await sleep(100);
  await page.screenshot({ path: SHOTS + '/demo-screenshot-cms.png' });
  // Messaging
  await go('#/staff/messaging');
  const opted = async ph => page.evaluate(ph => WFDApp.db().subs.find(s => s.phone === ph).sms, ph);
  const ph = await page.$eval('#simSel', e => e.value); ok(await opted(ph) === 'opted_in', 'sim phone starts opted in');
  const c0 = await page.evaluate(() => WFDApp.db().consent.length);
  await page.click('.kw[data-k=STOP]'); await sleep(200);
  ok(await opted(ph) === 'opted_out' && (await txt('#simScreen')).includes('unsubscribed'), 'STOP → opted out + confirmation reply');
  ok(await page.evaluate(() => WFDApp.db().consent.length) === c0 + 1, 'STOP written to consent log');
  await page.type('#simText', 'Is the fair still on?'); await page.click('#simForm button'); await sleep(200);
  ok((await txt('#queue')).includes('Is the fair still on?'), 'free-text reply routed to staff inbox');
  const card = await page.$x ? null : null;
  await page.evaluate(ph => { const c = [...document.querySelectorAll('#queue .card')].find(x => x.dataset.phone === ph); c.querySelector('input').value = 'Yes it is'; c.querySelector('form').requestSubmit(); }, ph); await sleep(200);
  ok((await txt('#campOut')).includes('Blocked'), 'staff cannot text an opted-out number');
  await page.click('.kw[data-k=START]'); await sleep(200); ok(await opted(ph) === 'opted_in' && (await txt('#simScreen')).includes('Reply HELP'), 'START → opted in again');
  await page.click('.kw[data-k=HELP]'); await sleep(200); ok((await txt('#simScreen')).includes('Help -'), 'HELP auto-reply');
  await page.evaluate(ph => { const c = [...document.querySelectorAll('#queue .card')].find(x => x.dataset.phone === ph); c.querySelector('input').value = 'Yes it is, 10am'; c.querySelector('form').requestSubmit(); }, ph); await sleep(200);
  ok((await txt('#simScreen')).includes('Yes it is, 10am'), 'two-way: staff reply delivered to resident');
  // campaign
  await page.select('#cmpTpl', (await page.$$eval('#cmpTpl option', o => o[2].value))); await sleep(100);
  ok(/GSM-7 · 1 segment/.test(await txt('#segInfo')), 'segment counter');
  const expected = await page.evaluate(() => WFD.audience(WFDApp.db().subs, { channel: 'sms', interests: ['youth'] }).length);
  await page.$$eval('.cmpInt', e => e.find(x => x.value === 'youth').click()); await sleep(100);
  ok((await txt('#audInfo')).includes(`Audience: ${expected} consenting`), 'audience excludes non-consenting, segmented by interest');
  await page.click('#cmpSend'); await sleep(200); ok((await txt('#campOut')).includes(`to ${expected} recipients`), 'campaign sent to consenting segment only');
  await page.select('#cmpChan', 'push'); await page.$eval('#cmpText', e => e.value = 'New training courses posted'); await page.$eval('#cmpWhen', e => e.value = '2026-11-12T23:00'); await page.$eval('#campForm', e => e.dispatchEvent(new Event('input')));
  await page.click('#cmpSend'); await sleep(200); ok(await page.$$eval('#schedTable .runNow', e => e.length) === 1, 'push scheduled');
  await page.click('.runNow'); await sleep(200); ok((await txt('#campOut')).includes('Sent'), 'scheduled push sent now');
  await page.evaluate(() => window.scrollTo(0, 0)); await sleep(100); await page.screenshot({ path: SHOTS + '/demo-screenshot-sms-console.png', fullPage: false });
  await page.select('#role', 'Viewer'); await sleep(150); ok((await txt('#subTable')).includes('•••') && await page.$eval('#cmpSend', e => e.disabled), 'Viewer: phones masked, cannot send'); await page.select('#role', 'Admin'); await sleep(100);
  // consent log
  await go('#/staff/consent'); ok((await txt('#consentTable')).includes('keyword:STOP') && (await txt('#consentTable')).includes('keyword:START'), 'consent log shows STOP and START events');
  await page.click('#cCsv'); await sleep(600); ok(fs.readdirSync('/tmp/wfd-dl').includes('consent-log.csv'), 'consent CSV export');
  await page.screenshot({ path: SHOTS + '/demo-screenshot-consent.png' });
  // analytics
  await go('#/staff/analytics'); ok(+(await page.$eval('.kpi[data-k=kAppt] b', e => e.textContent)) === 39, 'analytics counts the live appointment (38+1)');
  ok(await page.$$eval('#needBars .bar', e => e.length) === 5 && await page.$$eval('#funnel .bar', e => e.length) === 3, 'need chart + funnel');
  await page.screenshot({ path: SHOTS + '/demo-screenshot-analytics.png' });
  // integrations
  await go('#/integrations'); ok(await page.$$eval('#intTable tbody tr', e => e.length) === 10, 'integration plan table');
  await page.click('#apiGo'); await sleep(500); ok((await txt('#apiOut')).includes('not a WorkPlace system'), 'API explorer calls static endpoint');
  await page.click('#whGo'); await sleep(100); ok((await txt('#whOut')).includes('"opted_out"'), 'webhook simulator applies STOP');
  await page.screenshot({ path: SHOTS + '/demo-screenshot-integrations.png' });
  // a11y basics
  const a11y = await page.evaluate(() => { const bad = [...document.querySelectorAll('input,select,textarea')].filter(e => e.type !== 'hidden' && !e.getAttribute('aria-label') && !(e.id && document.querySelector(`label[for="${e.id}"]`)) && !e.closest('label')); return { skip: !!document.querySelector('.skip'), live: !!document.querySelector('[aria-live]'), lang: document.documentElement.lang, bad: bad.length }; });
  ok(a11y.skip && a11y.live && a11y.lang && a11y.bad === 0, 'a11y: skip link, live region, lang, all inputs labelled', JSON.stringify(a11y));
  // PWA offline
  const swOk = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; }); ok(swOk, 'service worker active');
  await sleep(500); await page.setOfflineMode(true); await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(500);
  ok((await txt('#disclaimer')).includes('92 Logics') && await page.$$eval('main .tile, main .card, main table', e => e.length) > 0, 'loads offline from cache');
  await page.setOfflineMode(false);
  ok(errors.length === 0, 'no JS errors', errors.join(' | '));
  await browser.close(); console.log(`\n${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
