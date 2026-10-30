/* Synthetic seed data. Every name, employer, phone and listing is fictional. 92 Logics demonstration. */
(function (root) {
  const towns = ['Bridgeport', 'Stamford', 'Norwalk', 'Danbury', 'Milford', 'Greenwich', 'Ansonia'];
  const needs = [
    { id: 'job', icon: '💼', label: 'I need a job', es: 'Necesito un trabajo', blurb: 'Search openings, get resume help and meet a career coach.' },
    { id: 'training', icon: '🎓', label: 'I want training', es: 'Quiero capacitación', blurb: 'Short courses, certificates and apprenticeships.' },
    { id: 'career', icon: '🧭', label: 'I need career help', es: 'Necesito ayuda profesional', blurb: 'Talk to a counselor, plan next steps, practise interviews.' },
    { id: 'youth', icon: '🌱', label: 'I am a young adult', es: 'Soy un adulto joven', blurb: 'Programs for ages 16-24: first jobs, school and skills.' },
    { id: 'employer', icon: '🏢', label: 'I am an employer', es: 'Soy un empleador', blurb: 'Hiring help, recruiting events and training support.' }
  ];
  const L = [];
  const jobs = [
    ['Warehouse Associate', 'Harborline Logistics (sample)', 'Bridgeport', 19.5, ['job'], ['entry level', 'full-time']],
    ['Certified Nursing Assistant', 'Shoreside Care Home (sample)', 'Milford', 21, ['job', 'training'], ['healthcare', 'CNA', 'certificate']],
    ['IT Help Desk Technician', 'Brightpath Tech (sample)', 'Stamford', 26, ['job'], ['IT', 'remote option']],
    ['Customer Service Representative', 'Northfield Insurance (sample)', 'Norwalk', 20, ['job', 'youth'], ['entry level', 'bilingual a plus']],
    ['CNC Machine Operator', 'Valley Precision (sample)', 'Ansonia', 24, ['job'], ['manufacturing']],
    ['Medical Billing Specialist', 'Greenleaf Clinic (sample)', 'Danbury', 23, ['job'], ['healthcare', 'remote option']],
    ['Retail Shift Lead', 'Corner Market Co. (sample)', 'Greenwich', 18.5, ['job', 'youth'], ['part-time']],
    ['Electrician Apprentice', 'Coastline Electric (sample)', 'Bridgeport', 22, ['job', 'training', 'youth'], ['apprenticeship']]
  ];
  jobs.forEach((j, i) => L.push({ id: 'J' + (101 + i), type: 'job', title: j[0], org: j[1], town: j[2], pay: j[3], needs: j[4], tags: j[5], remote: j[5].includes('remote option'), cost: 0, status: 'published', desc: `Synthetic job listing for demonstration. ${j[0]} in ${j[2]}, about $${j[3]}/hr.` }));
  const trainings = [
    ['Google IT Support-style Certificate Prep (8 weeks)', 'Regional Community College (sample)', 'Stamford', 0, ['training'], ['IT', 'evening'], true],
    ['CNA Training Course', 'Healthcare Skills Center (sample)', 'Bridgeport', 0, ['training', 'job'], ['healthcare'], false],
    ['Advanced Manufacturing Bootcamp', 'Manufacturing Alliance (sample)', 'Ansonia', 0, ['training'], ['manufacturing'], false],
    ['Commercial Driver (CDL-A) Program', 'Truck Academy (sample)', 'Milford', 450, ['training'], ['transport'], false],
    ['Digital Skills for Everyday Life', 'Public Library (sample)', 'Norwalk', 0, ['training', 'career'], ['digital literacy', 'beginner'], true],
    ['Youth Pre-Apprenticeship: Building Trades', 'Trades Council (sample)', 'Bridgeport', 0, ['training', 'youth'], ['ages 16-24'], false]
  ];
  trainings.forEach((t, i) => L.push({ id: 'T' + (201 + i), type: 'training', title: t[0], org: t[1], town: t[2], cost: t[3], needs: t[4], tags: t[5], remote: t[6], status: 'published', desc: `Synthetic training listing. Cost to learner: ${t[3] ? '$' + t[3] : 'free (sample)'}.` }));
  const d = (n, h) => { const x = new Date(Date.UTC(2026, 10, 2)); x.setUTCDate(x.getUTCDate() + n); x.setUTCHours(h); return x.toISOString(); };
  const events = [
    ['Spring Hiring Fair (sample)', 'Bridgeport', 9, 15, ['job', 'employer']],
    ['Resume Workshop', 'Stamford', 4, 17, ['job', 'career']],
    ['Youth Career Day', 'Norwalk', 12, 18, ['youth']],
    ['Employer Breakfast: Hiring Incentives', 'Danbury', 6, 13, ['employer']],
    ['Interview Practice Lab (virtual)', 'Milford', 3, 22, ['career', 'job']]
  ];
  events.forEach((e, i) => L.push({ id: 'E' + (301 + i), type: 'event', title: e[0], org: 'Career Center (sample)', town: e[1], start: d(e[2], e[3]), end: d(e[2], e[3] + 2), needs: e[4], tags: ['event'], remote: e[0].includes('virtual'), cost: 0, status: 'published', location: e[1] + ' career center (sample)', desc: 'Synthetic event for demonstration.' }));
  L.push({ id: 'T299', type: 'training', title: 'Solar Installer Basics (draft)', org: 'Green Jobs Lab (sample)', town: 'Danbury', cost: 0, needs: ['training'], tags: ['green'], remote: false, status: 'draft', desc: 'Draft listing - not visible to the public until published.' });

  const interestsAll = ['jobs', 'training', 'youth', 'events', 'employer'];
  const first = ['Alex', 'Maria', 'Jordan', 'Sam', 'Priya', 'Luis', 'Taylor', 'Chen', 'Aisha', 'Diego', 'Morgan', 'Fatima', 'Kevin', 'Rosa', 'Jamal', 'Elena', 'Noah', 'Grace', 'Omar', 'Lena', 'Victor', 'Hana', 'Ray', 'Nadia'];
  const subs = first.map((f, i) => ({
    id: 'S' + (1000 + i), name: f + ' Sample', phone: '(203) 555-01' + String(10 + i).padStart(2, '0'),
    sms: i % 7 === 3 ? 'opted_out' : i % 5 === 4 ? 'none' : 'opted_in', push: i % 3 !== 1, lang: i % 4 === 1 ? 'es' : 'en',
    interests: interestsAll.filter((_, k) => (i + k) % 3 === 0 || k === i % 5)
  }));
  const consent = [];
  subs.forEach((s, i) => {
    if (s.sms === 'opted_in' || s.sms === 'opted_out') consent.push({ phone: s.phone, event: 'opt_in', method: i % 2 ? 'web form (consent text v1.0)' : 'keyword:START', ts: d(-30 + i, 14) });
    if (s.sms === 'opted_out') consent.push({ phone: s.phone, event: 'opt_out', method: 'keyword:STOP', ts: d(-10 + i % 5, 15) });
  });
  // Baseline analytics log (synthetic, last 30 days)
  const ev = []; let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 420; i++) ev.push({ t: 'session', ts: d(-Math.floor(rnd() * 30), 12) });
  ['job', 'training', 'career', 'youth', 'employer'].forEach((n, k) => { for (let i = 0; i < [140, 90, 60, 45, 25][k]; i++) ev.push({ t: 'need', need: n }); });
  for (let i = 0; i < 210; i++) ev.push({ t: 'view' });
  ['cna', 'warehouse', 'it', 'cdl', 'resume', 'youth'].forEach((q, k) => { for (let i = 0; i < [30, 22, 18, 12, 10, 8][k]; i++) ev.push({ t: 'search', q }); });
  for (let i = 0; i < 64; i++) ev.push({ t: 'screener' });
  for (let i = 0; i < 38; i++) ev.push({ t: 'appointment' });
  for (let i = 0; i < 21; i++) ev.push({ t: 'referral' });
  for (let i = 0; i < 9; i++) ev.push({ t: 'employer' });
  for (let i = 0; i < 300; i++) ev.push({ t: 'sms_out', delivered: rnd() > 0.03 });

  const inbox = [
    { id: 'M1', from: 'Career Center (sample)', subject: 'Welcome to the Front Door demo', body: 'This inbox shows messages the app would deliver: confirmations, reminders and replies from staff. All synthetic.', ts: d(-2, 14), read: false },
    { id: 'M2', from: 'Events (sample)', subject: 'Reminder: Resume Workshop', body: 'Your Resume Workshop is coming up. Add it to your calendar from the Events page.', ts: d(-1, 14), read: false }
  ];
  const content = {
    banner: 'Free career help is available - start by telling us what you need.',
    tiles: needs.map(n => ({ id: n.id, label: n.label, blurb: n.blurb, visible: true }))
  };
  const threads = [{ phone: subs[0].phone, msgs: [{ dir: 'in', body: 'Can I bring my kid to the hiring fair?', ts: d(-1, 15) }], status: 'open' }];
  root.WFD_SEED = { towns, needs, listings: L, subs, consent, events: ev, inbox, content, threads, interestsAll };
})(typeof globalThis !== "undefined" ? globalThis : this);
