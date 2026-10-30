/* Digital Workforce Front Door — demo app. 92 Logics demonstration; not a WorkPlace system; synthetic data only. */
(function () {
  const KEY = 'wfd-demo-v1';
  const ME = 'S1000'; // the synthetic signed-in job seeker
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const now = () => new Date().toISOString();
  const fmt = iso => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  let db;
  function fresh() { const s = clone(WFD_SEED); return { listings: s.listings, subs: s.subs, consent: s.consent, events: s.events, inbox: s.inbox, content: s.content, threads: s.threads, saved: [], appointments: [], referrals: [], scheduled: [], audit: [], rules: clone(WFD.DEFAULT_RULES), role: 'Admin', lang: 'en', big: false }; }
  function load() { try { db = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { db = fresh(); } }
  function save() { localStorage.setItem(KEY, JSON.stringify(db)); badge(); }
  function track(t, extra) { db.events.push(Object.assign({ t, ts: now() }, extra || {})); save(); }
  function audit(action, detail) { db.audit.unshift({ ts: now(), role: db.role, action, detail }); }
  function say(msg) { $('#live').textContent = msg; }
  function toInbox(from, subject, body) { db.inbox.unshift({ id: 'M' + Date.now() + Math.floor(Math.random() * 1000), from, subject, body, ts: now(), read: false }); }
  function me() { return db.subs.find(s => s.id === ME); }
  function badge() { const n = db.inbox.filter(m => !m.read).length; $('#unread').textContent = n ? n : ''; }
  window.WFDApp = { db: () => db, reset: () => { db = fresh(); save(); } };

  // ---------- i18n (sample Spanish for navigation + front door; full translation would be professional) ----------
  const T = { es: { navSeeker: 'Para quienes buscan empleo', home: 'Inicio', find: 'Empleos y capacitación', findShort: 'Buscar', events: 'Eventos', screener: 'Encontrar mis servicios', screenerShort: 'Servicios', appts: 'Citas', apptsShort: 'Citas', inbox: 'Buzón', saved: 'Guardados', employer: 'Empleadores', hello: '¿Qué necesita hoy?', helloSub: 'Elija una opción. No necesita saber el nombre de ningún programa.' },
    en: { navSeeker: 'For job seekers', home: 'Home', find: 'Jobs & training', findShort: 'Find', events: 'Events', screener: 'Find my services', screenerShort: 'Services', appts: 'Appointments', apptsShort: 'Book', inbox: 'Inbox', saved: 'Saved', employer: 'Employers', hello: 'What do you need today?', helloSub: 'Pick one. You do not need to know any program names.' } };
  const t = k => (T[db.lang] || T.en)[k] || T.en[k] || k;
  function applyLang() {
    document.documentElement.lang = db.lang; $$('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });
    $('#langBtn').textContent = db.lang === 'en' ? 'ES' : 'EN'; $('#langBtn').setAttribute('aria-label', db.lang === 'en' ? 'Cambiar a español' : 'Switch to English');
    document.documentElement.classList.toggle('big', !!db.big); $('#textBtn').setAttribute('aria-pressed', db.big ? 'true' : 'false');
  }

  // ---------- views ----------
  const V = {};
  V.home = () => {
    const c = db.content; const tiles = c.tiles.filter(x => x.visible);
    const need = id => WFD_SEED.needs.find(n => n.id === id) || {};
    const up = db.listings.filter(l => l.type === 'event' && l.status === 'published').sort((a, b) => a.start.localeCompare(b.start)).slice(0, 3);
    return `<div class="banner" id="cmsBanner">${esc(c.banner)}</div>
    <h1>${esc(t('hello'))}</h1><p class="meta">${esc(t('helloSub'))}</p>
    <div class="tiles" id="needTiles">${tiles.map(x => `<a class="tile" href="#/need/${x.id}" data-need="${x.id}"><div class="ic" aria-hidden="true">${need(x.id).icon || '•'}</div><b>${esc(db.lang === 'es' ? (need(x.id).es || x.label) : x.label)}</b><span>${esc(x.blurb)}</span></a>`).join('')}</div>
    <h2>Quick actions</h2><div class="row"><a class="btn" href="#/screener">Find services that fit me</a><a class="btn sec" href="#/appointments">Talk to a counselor</a><a class="btn sec" href="#/find">Search jobs &amp; training</a></div>
    <h2>Coming up</h2><div class="cards">${up.map(evCard).join('')}</div>`;
  };
  V.need = (id) => {
    const n = WFD_SEED.needs.find(x => x.id === id); if (!n) return V.home();
    track('need', { need: id });
    if (id === 'employer') { location.hash = '#/employer'; return ''; }
    const items = WFD.filterListings(db.listings, { need: id });
    const steps = { job: ['Search openings below', 'Get resume help at a workshop', 'Book a career coach'], training: ['Check the courses below', 'Use the screener to see support you may qualify for', 'Ask a counselor about training funds'], career: ['Book a counselor', 'Try a practice interview lab', 'Take the services screener'], youth: ['See youth programs below', 'Come to Youth Career Day', 'Talk to a youth coach'] }[id] || [];
    return `<p><a href="#/home">← Home</a></p><h1>${n.icon} ${esc(n.label)}</h1><p>${esc(n.blurb)}</p>
      <div class="card"><b>Your next steps</b><ol>${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol><a class="btn" href="#/appointments?topic=${id}">Request help</a> <a class="btn sec" href="#/screener">Take the screener</a></div>
      <h2>Matches (${items.length})</h2><div class="cards">${items.map(card).join('')}</div>`;
  };
  function card(l) {
    const saved = db.saved.includes(l.id);
    const money = l.type === 'job' ? `$${l.pay}/hr` : l.type === 'training' ? (l.cost ? '$' + l.cost : 'Free') : fmt(l.start);
    return `<article class="card listing" data-id="${l.id}"><div class="meta">${l.type.toUpperCase()} · ${esc(l.town)}${l.remote ? ' · remote/virtual option' : ''}</div>
      <h3 style="margin:.2em 0"><a href="#/item/${l.id}">${esc(l.title)}</a></h3><div class="meta">${esc(l.org)} · ${esc(money)}</div>
      <div>${(l.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
      <p class="row" style="margin:.6em 0 0"><button class="btn sm sec saveBtn" data-id="${l.id}" aria-pressed="${saved}">${saved ? '★ Saved' : '☆ Save'}</button><button class="btn sm intBtn" data-id="${l.id}">I'm interested</button></p></article>`;
  }
  function evCard(l) { return `<article class="card" data-id="${l.id}"><div class="meta">EVENT · ${esc(l.town)} · ${fmt(l.start)}</div><h3 style="margin:.2em 0">${esc(l.title)}</h3><div class="meta">${esc(l.location || '')}</div>
    <p class="row" style="margin:.6em 0 0"><button class="btn sm regBtn" data-id="${l.id}">Register</button><button class="btn sm sec icsBtn" data-id="${l.id}">Add to calendar</button></p></article>`; }
  V.find = (q) => {
    const p = new URLSearchParams(q || '');
    return `<h1>${esc(t('find'))}</h1>
    <form id="findForm" class="row" role="search"><div><label for="fq">Keyword</label><input id="fq" name="q" value="${esc(p.get('q') || '')}" placeholder="e.g. CNA, warehouse, IT"></div>
    <div><label for="ft">Type</label><select id="ft" name="type"><option value="">Jobs + training</option><option value="job">Jobs</option><option value="training">Training</option></select></div>
    <div><label for="ftown">Town</label><select id="ftown" name="town"><option value="">Any town</option>${WFD_SEED.towns.map(x => `<option>${x}</option>`).join('')}</select></div>
    <label class="chk"><input type="checkbox" id="fremote" name="remote"> Remote/virtual</label><label class="chk"><input type="checkbox" id="ffree" name="free"> Free only</label></form>
    <p class="meta" id="fcount" aria-live="polite"></p><div class="cards" id="results"></div>`;
  };
  function runFind(log) {
    const f = $('#findForm'); if (!f) return;
    const crit = { q: f.q.value, type: f.type.value, town: f.town.value, remote: f.remote.checked, freeOnly: f.free.checked };
    const r = WFD.filterListings(db.listings.filter(l => l.type !== 'event'), crit);
    $('#results').innerHTML = r.map(card).join('') || '<p class="note">No matches. Try fewer filters, or <a href="#/appointments">ask a counselor</a>.</p>';
    bindCards();
    $('#fcount').textContent = r.length + ' result' + (r.length === 1 ? '' : 's');
    if (log && crit.q.trim()) track('search', { q: crit.q.trim().toLowerCase() });
  }
  V.item = (id) => {
    const l = db.listings.find(x => x.id === id); if (!l) return '<p>Not found.</p>';
    track('view', { id });
    return `<p><a href="#/find">← Back</a></p>${l.type === 'event' ? evCard(l) : card(l)}<div class="card"><p>${esc(l.desc)}</p><p class="meta">Listing ID ${l.id}. Source in production: WorkPlace CMS or a partner feed (see Integrations).</p></div>`;
  };
  V.events = () => {
    const evs = db.listings.filter(l => l.type === 'event' && l.status === 'published').sort((a, b) => a.start.localeCompare(b.start));
    return `<h1>${esc(t('events'))}</h1><div class="cards" id="evList">${evs.map(evCard).join('')}</div>`;
  };
  V.saved = () => { const s = db.listings.filter(l => db.saved.includes(l.id)); return `<h1>${esc(t('saved'))}</h1><div class="cards" id="savedList">${s.map(x => x.type === 'event' ? evCard(x) : card(x)).join('') || '<p class="note">Nothing saved yet. Use ☆ Save on any listing.</p>'}</div>`; };
  V.screener = () => `<h1>${esc(t('screener'))}</h1><p>Answer 5 quick questions to see services that may fit you. <b>This is illustrative only, not an eligibility decision.</b> In production, WorkPlace staff set and approve these rules.</p>
    <form id="scrForm" class="card"><label for="sAge">How old are you?</label><input id="sAge" name="age" type="number" min="14" max="99" required>
    <label for="sStatus">Which best describes you now?</label><select id="sStatus" name="status" required><option value="">Choose…</option><option value="employed">Working full-time</option><option value="underemployed">Working, but need more hours or pay</option><option value="unemployed">Not working</option><option value="laid_off">Recently laid off</option><option value="student">In school</option></select>
    <label class="chk"><input type="checkbox" name="veteran" id="sVet"> I am a veteran or eligible spouse</label>
    <label class="chk"><input type="checkbox" name="digitalHelp" id="sDig"> I'd like help using a computer or phone</label>
    <p><button class="btn" type="submit">See my options</button></p></form><div id="scrOut" aria-live="polite"></div>`;
  V.appointments = (q) => {
    const p = new URLSearchParams(q || ''); const m = me();
    const mine = db.appointments.slice().reverse();
    return `<h1>${esc(t('appts'))}</h1><form id="apptForm" class="card"><label for="aTopic">What do you need help with?</label><select id="aTopic" name="topic" required>
      ${[['job', 'Finding a job'], ['training', 'Training'], ['career', 'Career planning'], ['youth', 'Youth programs'], ['other', 'Something else']].map(([v, l]) => `<option value="${v}" ${p.get('topic') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <label for="aMode">How would you like to meet?</label><select id="aMode" name="mode"><option>Phone call</option><option>Video</option><option>In person</option></select>
      <div class="row"><div><label for="aDate">Preferred date</label><input id="aDate" name="date" type="date" required></div><div><label for="aTime">Time</label><select id="aTime" name="time"><option>Morning</option><option>Afternoon</option><option>Evening</option></select></div></div>
      <label for="aPhone">Mobile number</label><input id="aPhone" name="phone" value="${esc(m.phone)}" inputmode="tel" autocomplete="tel">
      <label class="chk"><input type="checkbox" id="aSms" name="sms" ${m.sms === 'opted_in' ? 'checked' : ''}> <span>Text me reminders and updates about my request. Msg frequency varies; msg &amp; data rates may apply. Reply STOP to opt out, HELP for help. Consent is not required to get services. (Consent text v1.0)</span></label>
      <p><button class="btn" type="submit">Request appointment</button></p></form><div id="apptOut" aria-live="polite"></div>
      <h2>My requests</h2><div class="tw"><table id="apptTable"><thead><tr><th>Ref</th><th>Topic</th><th>When</th><th>Mode</th><th>Status</th></tr></thead><tbody>${mine.map(a => `<tr><td>${a.ref}</td><td>${esc(a.topic)}</td><td>${esc(a.date)} ${esc(a.time)}</td><td>${esc(a.mode)}</td><td>${esc(a.status)}</td></tr>`).join('') || '<tr><td colspan=5>None yet.</td></tr>'}</tbody></table></div>`;
  };
  V.inbox = () => `<h1>${esc(t('inbox'))}</h1><p class="meta">Messages, confirmations and reminders for <b>${esc(me().name)}</b> (synthetic user). Push notifications land here too.</p>
    <div id="inboxList">${db.inbox.map(m => `<details class="card msgItem ${m.read ? '' : 'unread'}" data-id="${m.id}"><summary>${m.read ? '' : '● '}${esc(m.subject)} <span class="meta">— ${esc(m.from)}, ${fmt(m.ts)}</span></summary><p style="white-space:pre-wrap">${esc(m.body)}</p></details>`).join('') || '<p class="note">No messages.</p>'}</div>`;
  V.employer = () => `<h1>${esc(t('employer'))}</h1><p>Hiring help, recruiting events, on-the-job training support and a direct line to business services staff.</p>
    <form id="empForm" class="card"><label for="eCo">Company name</label><input id="eCo" name="co" required><label for="eNeed">What do you need?</label><select id="eNeed" name="need"><option>Help hiring for open roles</option><option>Join a hiring fair</option><option>Training support for staff</option><option>Post a job</option></select>
    <label for="eRoles">Roles / number of hires</label><input id="eRoles" name="roles"><label for="eEmail">Email</label><input id="eEmail" name="email" type="email" required>
    <p><button class="btn" type="submit">Contact business services</button></p></form><div id="empOut" aria-live="polite"></div>`;

  // ---------- staff ----------
  const canEdit = area => db.role === 'Admin' || (area === 'content' && db.role === 'Content editor') || (area === 'msg' && db.role === 'Messaging staff');
  const roleBar = area => `<div class="row card"><div><label for="role">Signed in as (demo role)</label><select id="role">${['Admin', 'Content editor', 'Messaging staff', 'Viewer'].map(r => `<option ${db.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div><p class="meta" style="margin:0">${canEdit(area) ? '<span class="ok">You can edit this area.</span>' : '<span class="bad">Read-only for this role.</span>'} Production: SSO + MFA, role-based access, audit log.</p></div>`;
  V['staff/content'] = () => {
    const ro = !canEdit('content') ? 'disabled' : '';
    return `<h1>Content manager</h1>${roleBar('content')}
    <div class="card"><h2 style="margin-top:0">Home banner</h2><textarea id="cmsBannerTxt" ${ro}>${esc(db.content.banner)}</textarea><p><button class="btn" id="cmsBannerSave" ${ro}>Publish banner</button></p></div>
    <div class="card"><h2 style="margin-top:0">Need tiles</h2><div class="tw"><table><thead><tr><th>Tile</th><th>Label</th><th>Description</th><th>Visible</th></tr></thead><tbody>${db.content.tiles.map((x, i) => `<tr><td>${x.id}</td><td><input class="tLabel" data-i="${i}" value="${esc(x.label)}" ${ro}></td><td><input class="tBlurb" data-i="${i}" value="${esc(x.blurb)}" ${ro} size="40"></td><td><input type="checkbox" class="tVis" data-i="${i}" ${x.visible ? 'checked' : ''} ${ro}></td></tr>`).join('')}</tbody></table></div><p><button class="btn" id="tilesSave" ${ro}>Save tiles</button></p></div>
    <div class="card"><h2 style="margin-top:0">Listings &amp; events</h2><div class="tw"><table id="cmsTable"><thead><tr><th>ID</th><th>Type</th><th>Title</th><th>Town</th><th>Status</th><th></th></tr></thead><tbody>${db.listings.map(l => `<tr data-id="${l.id}"><td>${l.id}</td><td>${l.type}</td><td>${esc(l.title)}</td><td>${esc(l.town)}</td><td>${l.status}</td><td><button class="btn sm sec pubBtn" data-id="${l.id}" ${ro}>${l.status === 'draft' ? 'Publish' : 'Unpublish'}</button></td></tr>`).join('')}</tbody></table></div>
    <h3>Add a listing or event</h3><form id="cmsAdd" class="row"><div><label for="cType">Type</label><select id="cType" name="type" ${ro}><option value="event">Event</option><option value="training">Training</option><option value="job">Job</option></select></div><div><label for="cTitle">Title</label><input id="cTitle" name="title" required ${ro}></div><div><label for="cTown">Town</label><select id="cTown" name="town" ${ro}>${WFD_SEED.towns.map(x => `<option>${x}</option>`).join('')}</select></div><div><label for="cDate">Date (events)</label><input id="cDate" name="date" type="datetime-local" ${ro}></div><label class="chk"><input type="checkbox" name="publish" checked ${ro}> Publish now</label><button class="btn" ${ro}>Add</button></form></div>
    <div class="card"><h2 style="margin-top:0">Audit log</h2><div class="tw"><table id="auditTable"><thead><tr><th>When</th><th>Role</th><th>Action</th><th>Detail</th></tr></thead><tbody>${db.audit.slice(0, 30).map(a => `<tr><td>${fmt(a.ts)}</td><td>${esc(a.role)}</td><td>${esc(a.action)}</td><td>${esc(a.detail)}</td></tr>`).join('') || '<tr><td colspan=4>No changes yet.</td></tr>'}</tbody></table></div></div>`;
  };
  let simPhone = null;
  V['staff/messaging'] = () => {
    const ro = !canEdit('msg') ? 'disabled' : ''; const viewer = db.role === 'Viewer';
    simPhone = simPhone || db.subs[1].phone;
    const sub = db.subs.find(s => s.phone === simPhone) || db.subs[1];
    const th = db.threads.find(x => x.phone === sub.phone) || { msgs: [] };
    const open = db.threads.filter(x => x.status === 'open');
    return `<h1>SMS &amp; push console</h1>${roleBar('msg')}
    <p class="note">Simulation only: no real texts or pushes are sent. In production a messaging provider (for example Twilio or a similar carrier-registered service, 10DLC long code or toll-free number) delivers SMS; Firebase Cloud Messaging / Apple Push deliver push.</p>
    <div class="grid2"><section><h2>Two-way SMS simulator</h2><label for="simSel">Simulate a resident's phone</label><select id="simSel">${db.subs.map(s => `<option value="${esc(s.phone)}" ${s.phone === sub.phone ? 'selected' : ''}>${esc(viewer ? WFD.maskPhone(s.phone) : s.phone)} · ${esc(s.name)} · ${s.sms}</option>`).join('')}</select>
      <div class="phone" style="margin-top:8px"><div class="meta" style="color:#ccc;text-align:center">${esc(viewer ? WFD.maskPhone(sub.phone) : sub.phone)} — <span id="simStatus" class="st ${sub.sms}">${sub.sms}</span></div><div class="screen" id="simScreen">${th.msgs.map(m => `<div class="msg ${m.dir === 'in' ? 'in' : 'out'}">${esc(m.body)}</div>`).join('')}</div>
      <form id="simForm" class="row" style="margin-top:6px"><input id="simText" aria-label="Text from resident" placeholder="Type a reply… (try STOP, START, HELP)" style="flex:1"><button class="btn sm">Send</button></form>
      <div class="row" style="margin-top:6px">${['STOP', 'START', 'HELP'].map(k => `<button class="btn sm sec kw" data-k="${k}">${k}</button>`).join('')}</div></div></section>
    <section><h2>Compose campaign</h2><form id="campForm" class="card"><label for="cmpTpl">Template</label><select id="cmpTpl"><option value="">— blank —</option><option value="Reminder: your career center appointment is tomorrow. Reply C to confirm or call us to reschedule. Reply STOP to opt out.">Appointment reminder</option><option value="Hiring Fair this week! See employers hiring now. Details in the Front Door app. Reply STOP to opt out.">Event reminder</option><option value="We got your request. A counselor will contact you within 2 business days. Reply STOP to opt out.">Referral follow-up</option></select>
      <label for="cmpChan">Channel</label><select id="cmpChan" name="channel" ${ro}><option value="sms">SMS</option><option value="push">Push notification</option></select>
      <fieldset style="border:0;padding:0"><legend style="font-weight:600;font-size:.9rem">Segment by interest (none = all consenting)</legend>${WFD_SEED.interestsAll.map(i => `<label class="chk" style="display:inline-flex;margin-right:10px"><input type="checkbox" class="cmpInt" value="${i}" ${ro}> ${i}</label>`).join('')}</fieldset>
      <label for="cmpText">Message</label><textarea id="cmpText" ${ro}></textarea><p class="meta" id="segInfo">0 chars · 0 segments</p>
      <label for="cmpWhen">Schedule (optional)</label><input id="cmpWhen" type="datetime-local" ${ro}>
      <p class="meta" id="audInfo"></p><p id="quietWarn"></p><button class="btn" id="cmpSend" ${ro}>Send / schedule</button></form><div id="campOut" aria-live="polite"></div>
      <h3>Scheduled</h3><div class="tw"><table id="schedTable"><thead><tr><th>When</th><th>Channel</th><th>Recipients</th><th></th></tr></thead><tbody>${db.scheduled.map((s, i) => `<tr><td>${fmt(s.when)}</td><td>${s.channel}</td><td>${s.count}</td><td><button class="btn sm runNow" data-i="${i}" ${ro}>Send now</button></td></tr>`).join('') || '<tr><td colspan=4>None.</td></tr>'}</tbody></table></div></section></div>
    <h2>Staff inbox — replies routed to staff (${open.length} open)</h2><div id="queue">${open.map(q => `<div class="card" data-phone="${esc(q.phone)}"><b>${esc(viewer ? WFD.maskPhone(q.phone) : q.phone)}</b> <span class="meta">${esc((db.subs.find(s => s.phone === q.phone) || {}).name || '')}</span><div>${q.msgs.slice(-3).map(m => `<div class="meta">${m.dir === 'in' ? '⬅' : '➡'} ${esc(m.body)}</div>`).join('')}</div><form class="row qReply"><input aria-label="Staff reply" placeholder="Reply as staff" ${ro} style="flex:1"><button class="btn sm" ${ro}>Reply</button><button type="button" class="btn sm sec qClose" ${ro}>Close</button></form></div>`).join('') || '<p class="note">No open conversations.</p>'}</div>
    <h2>Subscribers</h2><div class="tw"><table id="subTable"><thead><tr><th>Name</th><th>Phone</th><th>SMS consent</th><th>Push</th><th>Lang</th><th>Interests</th></tr></thead><tbody>${db.subs.map(s => `<tr><td>${esc(s.name)}</td><td>${esc(viewer ? WFD.maskPhone(s.phone) : s.phone)}</td><td><span class="st ${s.sms}">${s.sms}</span></td><td>${s.push ? 'on' : 'off'}</td><td>${s.lang}</td><td>${s.interests.join(', ')}</td></tr>`).join('')}</tbody></table></div>`;
  };
  V['staff/consent'] = () => { const viewer = db.role === 'Viewer'; const rows = db.consent.slice().sort((a, b) => b.ts.localeCompare(a.ts));
    return `<h1>Consent log</h1><p>Append-only record of every SMS opt-in and opt-out: who, when, how (web form with consent-text version, or keyword). In production: stored with immutable timestamps, retained per the agreed retention policy, exportable for audits.</p>
    <div class="row"><select id="cFilter" aria-label="Filter events"><option value="">All events</option><option value="opt_in">Opt-ins</option><option value="opt_out">Opt-outs</option></select><button class="btn sec" id="cCsv">Export CSV</button></div>
    <div class="tw"><table id="consentTable"><thead><tr><th>When</th><th>Phone</th><th>Event</th><th>Method / evidence</th></tr></thead><tbody>${rows.map(c => `<tr data-ev="${c.event}"><td>${fmt(c.ts)}</td><td>${esc(viewer ? WFD.maskPhone(c.phone) : c.phone)}</td><td class="${c.event === 'opt_out' ? 'bad' : 'ok'}">${c.event}</td><td>${esc(c.method)}</td></tr>`).join('')}</tbody></table></div>`; };
  V['staff/analytics'] = () => {
    const a = WFD.analytics(db.events, db.subs, db.consent);
    const bars = (obj, lab) => { const mx = Math.max(1, ...Object.values(obj)); return Object.entries(obj).sort((x, y) => y[1] - x[1]).map(([k, v]) => `<div class="bar"><em>${esc(lab ? lab(k) : k)}</em><i style="width:${Math.round(v / mx * 60)}%"></i><span>${v}</span></div>`).join(''); };
    const needL = k => (WFD_SEED.needs.find(n => n.id === k) || {}).label || k;
    return `<h1>Analytics</h1><p class="meta">Privacy-first: counts of anonymous events only, no personal data, no third-party trackers. Baseline is synthetic; your clicks in this demo are added live.</p>
    <div class="kpis" id="kpis">${[['kSessions', a.sessions, 'Visits'], ['kScreen', a.screeners, 'Screeners completed'], ['kAppt', a.appointments, 'Appointment requests'], ['kRef', a.referrals, 'Interest / referral forms'], ['kEmp', a.employer, 'Employer requests'], ['kSms', a.smsSent, 'SMS sent'], ['kDel', a.deliveryRate + '%', 'SMS delivery rate'], ['kOpt', a.optedIn, 'Opted-in subscribers'], ['kOut', a.optOutRate + '%', 'Opt-out share of consent events'], ['kPush', a.pushEnabled, 'Push-enabled devices']].map(([id, v, l]) => `<div class="kpi" data-k="${id}"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    <div class="grid2"><div class="card"><h2 style="margin-top:0">What people need (front-door tiles)</h2><div class="bars" id="needBars">${bars(a.needClicks, needL)}</div></div>
    <div class="card"><h2 style="margin-top:0">Top searches</h2><div class="bars" id="searchBars">${bars(a.searches)}</div></div></div>
    <div class="card"><h2 style="margin-top:0">Service-navigation funnel</h2><div class="bars" id="funnel">${bars({ '1 Visited': a.funnel.visits, '2 Explored (view/search)': a.funnel.explored, '3 Took action': a.funnel.acted })}</div><p class="meta">Action rate: ${a.funnel.visits ? Math.round(a.funnel.acted / a.funnel.visits * 1000) / 10 : 0}% of visits. Proposed outcome measures: requests that reach a counselor within 2 business days, event attendance after reminders, repeat use at 30/90 days.</p></div>
    <button class="btn sec" id="aCsv">Export KPIs (CSV)</button>`;
  };
  V.integrations = () => `<h1>Integrations &amp; API</h1><p>Integration plan as it would appear in the proposal. Status columns follow the RFP's categories. Nothing here connects to a real system.</p>
    <div class="tw"><table id="intTable"><thead><tr><th>Integration</th><th>Method</th><th>Category</th><th>Who sets it up</th></tr></thead><tbody>
    ${[['workplace.org content & links', 'Deep links / RSS or WordPress REST if available', 'Configuration', '92 Logics; WorkPlace grants access'], ['Event calendar', 'iCal (.ics) feed import + calendar download', 'Configuration', '92 Logics'], ['Referral & interest forms', 'API/webhook into existing form tool or CRM', 'Custom development', '92 Logics + WorkPlace IT'], ['Appointment scheduling', 'Scheduling tool API (e.g. Microsoft Bookings / Calendly) or request queue', 'Depends on third-party access', 'WorkPlace chooses tool'], ['CRM', 'REST API connector', 'Custom development', 'Depends on CRM vendor approval'], ['Workforce case-management system', 'Read-only referral hand-off only, with written authorization', 'Depends on third-party/state approval', 'WorkPlace + system owner'], ['State/national job & training listings', 'Public job/training feeds where licensed', 'Depends on third-party approval', 'WorkPlace; 92 Logics builds import'], ['SMS provider', 'Provider REST API + inbound webhook, carrier registration', 'Configuration', '92 Logics; WorkPlace owns the account'], ['Push notifications', 'Firebase Cloud Messaging / Apple Push', 'Out of the box (platform)', '92 Logics'], ['Analytics', 'Privacy-first event API → SQL / Power BI', 'Configuration', '92 Logics']].map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <h2>Read-only demo API (static JSON)</h2><div class="row"><select id="apiSel" aria-label="Endpoint">${['listings', 'events', 'services', 'kpis', 'openapi'].map(e => `<option value="api/v1/${e}.json">GET /api/v1/${e}.json</option>`).join('')}</select><button class="btn" id="apiGo">Call</button></div><pre id="apiOut">Choose an endpoint and press Call.</pre>
    <h2>Try the inbound-SMS webhook logic</h2><p class="meta">Paste a provider-style payload. The same keyword rules as the console are applied; nothing is sent.</p>
    <textarea id="whIn" aria-label="Webhook payload JSON">{"From":"+12035550199","To":"+10005550100","Body":"STOP"}</textarea><p><button class="btn" id="whGo">Process</button></p><pre id="whOut"></pre>`;
  V.about = () => `<h1>About this demo</h1><div class="card"><p><b>Demonstration by 92 Logics for The WorkPlace Mobile App RFP — not a WorkPlace system.</b> All people, employers, phone numbers, listings and statistics are synthetic. No WorkPlace logos are used. It runs entirely in your browser (localStorage), makes no external calls and has no tracking.</p>
    <p>It shows the core of our proposed approach: a mobile-first progressive web app (installable, works offline for browsing) with a responsive web view, need-based navigation, discovery with filters, a services screener, appointment and referral requests, an inbox, an employer pathway, a staff content manager with roles and an audit log, a two-way SMS/push console with STOP/START/HELP handling and a consent log, analytics, and an integration/API plan.</p>
    <p>Proposed production stack: React (React Native / Expo for iOS + Android from one codebase, plus the web PWA), ASP.NET Core API on Azure with SQL Server, a carrier-registered SMS provider, FCM/APNs push, WCAG 2.1 AA testing. Source: <a href="https://github.com/92logics/workplace-front-door-demo">github.com/92logics/workplace-front-door-demo</a>.</p></div>`;

  // ---------- actions ----------
  function sendInbound(phone, body) {
    let sub = db.subs.find(s => s.phone === phone);
    const r = WFD.handleInbound(sub, body, now());
    Object.assign(sub, r.subscriber);
    let th = db.threads.find(x => x.phone === phone); if (!th) { th = { phone, msgs: [], status: 'open' }; db.threads.push(th); }
    th.msgs.push({ dir: 'in', body, ts: now() });
    if (r.reply) { th.msgs.push({ dir: 'out', body: r.reply, ts: now(), auto: true }); db.events.push({ t: 'sms_out', delivered: true, ts: now() }); }
    if (r.consentEvent) db.consent.push(r.consentEvent);
    if (r.routeToStaff) th.status = 'open';
    save(); return r;
  }
  function deliver(c) {
    const rec = WFD.audience(db.subs, c);
    rec.forEach(s => {
      db.events.push({ t: c.channel === 'sms' ? 'sms_out' : 'push_out', delivered: true, ts: now() });
      if (c.channel === 'sms') { let th = db.threads.find(x => x.phone === s.phone); if (!th) { th = { phone: s.phone, msgs: [], status: 'closed' }; db.threads.push(th); } th.msgs.push({ dir: 'out', body: c.text, ts: now() }); }
      if (s.id === ME) toInbox(c.channel === 'sms' ? 'Text message (sample)' : 'Push notification (sample)', c.text.slice(0, 60), c.text);
    });
    audit('campaign sent', `${c.channel} to ${rec.length} recipients`); save(); return rec.length;
  }
  function dl(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  const csv = rows => rows.map(r => r.map(v => { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(',')).join('\n');

  function bindCards() {
    $$('.saveBtn').forEach(b => b.onclick = () => { const id = b.dataset.id; db.saved = db.saved.includes(id) ? db.saved.filter(x => x !== id) : db.saved.concat(id); save(); const s = db.saved.includes(id); b.textContent = s ? '★ Saved' : '☆ Save'; b.setAttribute('aria-pressed', s); say(s ? 'Saved' : 'Removed'); });
    $$('.intBtn').forEach(b => b.onclick = () => { const l = db.listings.find(x => x.id === b.dataset.id); const ref = 'R-' + (1000 + db.referrals.length + 1); db.referrals.push({ ref, id: l.id, ts: now() }); toInbox('Career Center (sample)', 'We got your interest: ' + l.title, `Reference ${ref}. A staff member will follow up within 2 business days.`); track('referral', { id: l.id }); b.textContent = '✓ Sent ' + ref; b.disabled = true; say('Interest sent, reference ' + ref); });
    $$('.regBtn').forEach(b => b.onclick = () => { const l = db.listings.find(x => x.id === b.dataset.id); toInbox('Events (sample)', 'You are registered: ' + l.title, `${l.title}\n${fmt(l.start)} at ${l.location}. We'll remind you the day before if you opted in to texts.`); track('referral', { id: l.id, kind: 'event' }); b.textContent = '✓ Registered'; b.disabled = true; say('Registered'); });
    $$('.icsBtn').forEach(b => b.onclick = () => { const l = db.listings.find(x => x.id === b.dataset.id); dl(l.id + '.ics', WFD.ics(l), 'text/calendar'); say('Calendar file downloaded'); });
  }
  function bind(route) {
    bindCards();
    if (route === 'find') { const f = $('#findForm'); f.oninput = () => runFind(false); f.onchange = () => runFind(true); f.onsubmit = e => { e.preventDefault(); runFind(true); }; runFind(false); }
    if (route === 'screener') $('#scrForm').onsubmit = e => { e.preventDefault(); const f = e.target; const res = WFD.screen({ age: f.age.value, status: f.status.value, veteran: f.veteran.checked, digitalHelp: f.digitalHelp.checked }, db.rules); track('screener');
      const m = res.filter(r => r.match); $('#scrOut').innerHTML = `<h2>${m.length} option${m.length === 1 ? '' : 's'} that may fit you</h2>${m.map(r => `<div class="card scrMatch" data-r="${r.id}"><b>${esc(r.name)}</b><div class="meta">${r.reasons.map(esc).join(' · ')}</div><a class="btn sm" href="#/appointments?topic=${r.need}">Ask about this</a></div>`).join('') || '<p class="note">Nothing matched automatically, but a counselor can still help. <a href="#/appointments">Request an appointment</a>.</p>'}<details><summary>Why not the others?</summary>${res.filter(r => !r.match).map(r => `<p class="meta">${esc(r.name)}: ${r.reasons.map(esc).join(' · ')}</p>`).join('')}</details>`; say(m.length + ' options found'); };
    if (route === 'appointments') $('#apptForm').onsubmit = e => { e.preventDefault(); const f = e.target; const m = me(); const ref = 'A-' + (2000 + db.appointments.length + 1);
      db.appointments.push({ ref, topic: f.topic.options[f.topic.selectedIndex].text, mode: f.mode.value, date: f.date.value, time: f.time.value, status: 'Requested', ts: now() });
      if (f.sms.checked && m.sms !== 'opted_in') { m.sms = 'opted_in'; db.consent.push({ phone: m.phone, event: 'opt_in', method: 'web form: appointment request (consent text v1.0)', ts: now() }); }
      let txt = ''; if (m.sms === 'opted_in') { const body = `Front Door Demo: request ${ref} received. A counselor will contact you to confirm. Reply STOP to opt out.`; let th = db.threads.find(x => x.phone === m.phone); if (!th) { th = { phone: m.phone, msgs: [], status: 'closed' }; db.threads.push(th); } th.msgs.push({ dir: 'out', body, ts: now() }); db.events.push({ t: 'sms_out', delivered: true, ts: now() }); txt = ' A confirmation text was sent (simulated).'; }
      toInbox('Career Center (sample)', 'Appointment request ' + ref, `We received your request (${f.topic.options[f.topic.selectedIndex].text}, ${f.mode.value}, ${f.date.value} ${f.time.value}). A counselor will confirm.`);
      track('appointment'); render(); $('#apptOut').innerHTML = `<div class="alert ok" role="status">Request <b>${ref}</b> sent.${txt}</div>`; };
    if (route === 'inbox') $$('.msgItem').forEach(d => d.ontoggle = () => { if (d.open) { const m = db.inbox.find(x => x.id === d.dataset.id); if (!m.read) { m.read = true; d.classList.remove('unread'); save(); } } });
    if (route === 'employer') $('#empForm').onsubmit = e => { e.preventDefault(); const ref = 'B-' + (3000 + db.referrals.length + 1); db.referrals.push({ ref, kind: 'employer', ts: now() }); track('employer'); $('#empOut').innerHTML = `<div class="alert ok" role="status">Thanks — request <b>${ref}</b> is with business services staff (simulated).</div>`; e.target.reset(); };
    if ($('#role')) $('#role').onchange = e => { db.role = e.target.value; save(); render(); };
    if (route === 'staff/content') {
      $('#cmsBannerSave').onclick = () => { db.content.banner = $('#cmsBannerTxt').value; audit('banner published', db.content.banner.slice(0, 60)); save(); render(); say('Banner published'); };
      $('#tilesSave').onclick = () => { $$('.tLabel').forEach(i => db.content.tiles[i.dataset.i].label = i.value); $$('.tBlurb').forEach(i => db.content.tiles[i.dataset.i].blurb = i.value); $$('.tVis').forEach(i => db.content.tiles[i.dataset.i].visible = i.checked); audit('tiles updated', db.content.tiles.filter(x => x.visible).length + ' visible'); save(); render(); say('Tiles saved'); };
      $$('.pubBtn').forEach(b => b.onclick = () => { const l = db.listings.find(x => x.id === b.dataset.id); l.status = l.status === 'draft' ? 'published' : 'draft'; audit('listing ' + l.status, l.id + ' ' + l.title); save(); render(); });
      $('#cmsAdd').onsubmit = e => { e.preventDefault(); const f = e.target; const pre = { event: 'E', training: 'T', job: 'J' }[f.type.value]; const id = pre + (400 + db.listings.length);
        const start = f.date.value ? new Date(f.date.value).toISOString() : new Date(Date.now() + 7 * 864e5).toISOString();
        db.listings.push({ id, type: f.type.value, title: f.title.value, org: 'Career Center (sample)', town: f.town.value, pay: 20, cost: 0, needs: f.type.value === 'event' ? ['job', 'career'] : [f.type.value === 'job' ? 'job' : 'training'], tags: ['new'], remote: false, status: f.publish.checked ? 'published' : 'draft', start, end: start, location: f.town.value + ' career center (sample)', desc: 'Added by staff in the demo CMS.' });
        audit('listing added', id + ' ' + f.title.value); save(); render(); say('Listing added'); };
    }
    if (route === 'staff/messaging') {
      $('#simSel').onchange = e => { simPhone = e.target.value; render(); };
      const sim = body => { if (!body.trim()) return; sendInbound(simPhone, body.trim()); render(); };
      $('#simForm').onsubmit = e => { e.preventDefault(); sim($('#simText').value); };
      $$('.kw').forEach(b => b.onclick = () => sim(b.dataset.k));
      const upd = () => { const s = WFD.smsSegments($('#cmpText').value); $('#segInfo').textContent = `${s.chars} chars · ${s.encoding} · ${s.segments} segment${s.segments === 1 ? '' : 's'}`;
        const ints = $$('.cmpInt').filter(i => i.checked).map(i => i.value); const n = WFD.audience(db.subs, { channel: $('#cmpChan').value, interests: ints }).length;
        $('#audInfo').textContent = `Audience: ${n} consenting recipient${n === 1 ? '' : 's'} (opted-out and non-consented excluded) · est. ${n * s.segments} message segments`;
        const w = $('#cmpWhen').value ? new Date($('#cmpWhen').value) : new Date(); $('#quietWarn').innerHTML = $('#cmpChan').value === 'sms' && WFD.inQuietHours(w) ? '<span class="warn">⚠ Outside 8am–9pm recipient time. Recommend scheduling for daytime.</span>' : ''; };
      $('#cmpTpl').onchange = e => { if (e.target.value) { $('#cmpText').value = e.target.value; upd(); } };
      $('#campForm').oninput = upd; $('#campForm').onchange = upd; upd();
      $('#campForm').onsubmit = e => { e.preventDefault(); const text = $('#cmpText').value.trim(); if (!text) { $('#campOut').innerHTML = '<div class="alert bad">Write a message first.</div>'; return; }
        const c = { channel: $('#cmpChan').value, interests: $$('.cmpInt').filter(i => i.checked).map(i => i.value), text };
        if ($('#cmpWhen').value) { c.when = new Date($('#cmpWhen').value).toISOString(); c.count = WFD.audience(db.subs, c).length; db.scheduled.push(c); audit('campaign scheduled', c.channel + ' ' + c.when); save(); render(); $('#campOut').innerHTML = `<div class="alert ok" role="status">Scheduled for ${fmt(c.when)}.</div>`; return; }
        const n = deliver(c); render(); $('#campOut').innerHTML = `<div class="alert ok" role="status">Sent (simulated) to <b>${n}</b> recipients by ${c.channel}.</div>`; };
      $$('.runNow').forEach(b => b.onclick = () => { const c = db.scheduled.splice(+b.dataset.i, 1)[0]; const n = deliver(c); render(); $('#campOut').innerHTML = `<div class="alert ok" role="status">Sent (simulated) to <b>${n}</b> recipients.</div>`; });
      $$('#queue .card').forEach(cd => { const ph = cd.dataset.phone; const th = db.threads.find(x => x.phone === ph);
        cd.querySelector('.qReply').onsubmit = e => { e.preventDefault(); const v = e.target.querySelector('input').value.trim(); if (!v) return; const s = db.subs.find(x => x.phone === ph);
          if (s.sms !== 'opted_in') { $('#campOut').innerHTML = '<div class="alert bad" role="alert">Blocked: this number has not opted in (or has opted out). No message sent.</div>'; return; }
          th.msgs.push({ dir: 'out', body: v, ts: now(), staff: db.role }); db.events.push({ t: 'sms_out', delivered: true, ts: now() }); audit('staff reply', WFD.maskPhone(ph)); save(); render(); };
        cd.querySelector('.qClose').onclick = () => { th.status = 'closed'; audit('conversation closed', WFD.maskPhone(ph)); save(); render(); }; });
    }
    if (route === 'staff/consent') { $('#cFilter').onchange = e => $$('#consentTable tbody tr').forEach(r => r.hidden = e.target.value && r.dataset.ev !== e.target.value);
      $('#cCsv').onclick = () => dl('consent-log.csv', csv([['timestamp', 'phone', 'event', 'method']].concat(db.consent.map(c => [c.ts, db.role === 'Viewer' ? WFD.maskPhone(c.phone) : c.phone, c.event, c.method]))), 'text/csv'); }
    if (route === 'staff/analytics') $('#aCsv').onclick = () => { const a = WFD.analytics(db.events, db.subs, db.consent); dl('kpis.csv', csv([['metric', 'value']].concat(Object.entries(a).filter(([, v]) => typeof v !== 'object'))), 'text/csv'); };
    if (route === 'integrations') {
      $('#apiGo').onclick = async () => { try { const r = await fetch($('#apiSel').value); $('#apiOut').textContent = JSON.stringify(await r.json(), null, 2).slice(0, 4000); } catch (e) { $('#apiOut').textContent = 'Error: ' + e.message; } };
      $('#whGo').onclick = () => { try { const p = JSON.parse($('#whIn').value); const kind = WFD.classifyKeyword(p.Body); const sub = { phone: p.From, sms: 'opted_in' }; const r = WFD.handleInbound(sub, p.Body, now());
        $('#whOut').textContent = JSON.stringify({ classified: kind, newConsentState: r.subscriber.sms, autoReply: r.reply, consentLogEntry: r.consentEvent, routeToStaff: r.routeToStaff }, null, 2); } catch (e) { $('#whOut').textContent = 'Invalid JSON: ' + e.message; } };
    }
  }

  function render() {
    const h = location.hash.replace(/^#\/?/, '') || 'home';
    const [path, query] = h.split('?'); const parts = path.split('/');
    let route = parts[0], arg = parts.slice(1).join('/');
    if (route === 'staff') { route = 'staff/' + parts[1]; arg = ''; }
    const view = V[route] || V.home;
    const html = view(arg || query, query); if (html === '' ) return;
    $('#main').innerHTML = html;
    $$('.side a, .tabbar a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#/' + path || (path.startsWith('need') && a.getAttribute('href') === '#/home')));
    applyLang(); bind(V[route] ? route : 'home'); badge();
  }
  function init() {
    load(); applyLang();
    if (!sessionStorage.getItem('wfd-session')) { sessionStorage.setItem('wfd-session', '1'); db.events.push({ t: 'session', ts: now() }); save(); }
    $('#langBtn').onclick = () => { db.lang = db.lang === 'en' ? 'es' : 'en'; save(); render(); };
    $('#textBtn').onclick = () => { db.big = !db.big; save(); applyLang(); };
    $('#menuBtn').onclick = () => { const o = $('#side').classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', o); };
    $('#side').addEventListener('click', e => { if (e.target.tagName === 'A') { $('#side').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); } });
    $('#resetBtn').onclick = () => { if (confirm('Reset all demo data?')) { db = fresh(); save(); location.hash = '#/home'; render(); } };
    window.addEventListener('hashchange', () => { render(); $('#main').focus({ preventScroll: true }); window.scrollTo(0, 0); });
    render();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  init();
})();
