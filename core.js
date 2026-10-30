/* Core logic for the Digital Workforce Front Door demo (pure functions; browser + Node).
   Demonstration by 92 Logics. Not a WorkPlace system. All data is synthetic. */
(function (root) {
  const STOP_WORDS = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'OPTOUT', 'REVOKE'];
  const START_WORDS = ['START', 'UNSTOP', 'YES', 'SUBSCRIBE', 'OPTIN'];
  const HELP_WORDS = ['HELP', 'INFO'];
  const PROGRAM = 'Front Door Demo';
  const REPLIES = {
    stop: `${PROGRAM}: You are unsubscribed and will receive no more messages. Reply START to resubscribe.`,
    start: `${PROGRAM}: You are subscribed to service updates. Msg freq varies. Msg&data rates may apply. Reply HELP for help, STOP to opt out.`,
    help: `${PROGRAM}: Help - call the career center at (000) 555-0100 (demo number). Reply STOP to opt out.`,
    routed: null
  };

  /** Classify an inbound SMS body per common carrier/CTIA keyword practice. */
  function classifyKeyword(body) {
    const w = String(body || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (STOP_WORDS.includes(w)) return 'stop';
    if (START_WORDS.includes(w)) return 'start';
    if (HELP_WORDS.includes(w)) return 'help';
    return 'routed';
  }

  /** Apply an inbound message to a subscriber; returns {subscriber, reply, consentEvent, routeToStaff}. */
  function handleInbound(sub, body, ts) {
    const kind = classifyKeyword(body);
    const s = Object.assign({}, sub);
    let consentEvent = null, reply = REPLIES[kind], routeToStaff = false;
    if (kind === 'stop') {
      if (s.sms !== 'opted_out') consentEvent = { phone: s.phone, event: 'opt_out', method: 'keyword:' + String(body).trim().toUpperCase(), ts };
      s.sms = 'opted_out';
    } else if (kind === 'start') {
      if (s.sms !== 'opted_in') consentEvent = { phone: s.phone, event: 'opt_in', method: 'keyword:' + String(body).trim().toUpperCase(), ts };
      s.sms = 'opted_in';
    } else if (kind === 'routed') {
      routeToStaff = true;
      reply = s.sms === 'opted_in' ? `${PROGRAM}: Thanks, a staff member will reply during business hours.` : null;
    }
    return { subscriber: s, reply, consentEvent, routeToStaff, kind };
  }

  /** GSM-7 vs UCS-2 segment calculation. */
  const GSM = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
  const GSM_EXT = '^{}\\[~]|€';
  function smsSegments(text) {
    text = String(text || '');
    let gsm = true, len = 0;
    for (const ch of text) { if (GSM.includes(ch)) len += 1; else if (GSM_EXT.includes(ch)) len += 2; else { gsm = false; break; } }
    if (!gsm) { len = [...text].length; return { encoding: 'UCS-2', chars: len, segments: len === 0 ? 0 : len <= 70 ? 1 : Math.ceil(len / 67) }; }
    return { encoding: 'GSM-7', chars: len, segments: len === 0 ? 0 : len <= 160 ? 1 : Math.ceil(len / 153) };
  }

  /** Who receives a campaign: consent + channel + segment filter. Opted-out never receive. */
  function audience(subs, { channel = 'sms', interests = [] } = {}) {
    return subs.filter(s => {
      if (channel === 'sms' && s.sms !== 'opted_in') return false;
      if (channel === 'push' && !s.push) return false;
      if (interests.length && !interests.some(i => (s.interests || []).includes(i))) return false;
      return true;
    });
  }

  /** Quiet hours: recommend messages only 08:00-21:00 recipient local time. */
  function inQuietHours(date) { const h = date.getHours(); return h < 8 || h >= 21; }

  /** Illustrative service-matching screener (NOT real WIOA eligibility; rules are staff-configurable). */
  const DEFAULT_RULES = [
    { id: 'youth', name: 'Young adult career pathways', need: 'youth', test: { ageMin: 16, ageMax: 24 }, why: 'Age 16-24' },
    { id: 'adult', name: 'Career coaching & job search help', need: 'career', test: { ageMin: 18 }, why: 'Age 18+' },
    { id: 'dislocated', name: 'Support after a layoff', need: 'job', test: { ageMin: 18, status: ['laid_off'] }, why: 'Recently laid off' },
    { id: 'training', name: 'Training scholarship information session', need: 'training', test: { ageMin: 18, status: ['unemployed', 'laid_off', 'underemployed'] }, why: 'Unemployed or underemployed' },
    { id: 'digital', name: 'Digital skills workshop', need: 'training', test: { digitalHelp: true }, why: 'Asked for computer/phone help' },
    { id: 'veteran', name: 'Veteran priority services', need: 'career', test: { veteran: true }, why: 'Veteran or eligible spouse' }
  ];
  function screen(ans, rules = DEFAULT_RULES) {
    const age = Number(ans.age);
    return rules.map(r => {
      const t = r.test, reasons = [];
      let ok = true;
      if (t.ageMin != null) { const p = age >= t.ageMin; ok = ok && p; reasons.push((p ? '✓ ' : '✗ ') + 'age ≥ ' + t.ageMin); }
      if (t.ageMax != null) { const p = age <= t.ageMax; ok = ok && p; reasons.push((p ? '✓ ' : '✗ ') + 'age ≤ ' + t.ageMax); }
      if (t.status) { const p = t.status.includes(ans.status); ok = ok && p; reasons.push((p ? '✓ ' : '✗ ') + 'status: ' + t.status.join('/')); }
      if (t.veteran) { const p = !!ans.veteran; ok = ok && p; reasons.push((p ? '✓ ' : '✗ ') + 'veteran'); }
      if (t.digitalHelp) { const p = !!ans.digitalHelp; ok = ok && p; reasons.push((p ? '✓ ' : '✗ ') + 'wants digital help'); }
      return { id: r.id, name: r.name, need: r.need, match: ok, reasons };
    });
  }

  /** Listing filter for jobs / training / events. */
  function filterListings(items, { q = '', type = '', town = '', remote = false, freeOnly = false, need = '' } = {}) {
    const qq = q.trim().toLowerCase();
    return items.filter(i => i.status !== 'draft' &&
      (!type || i.type === type) && (!town || i.town === town) && (!remote || i.remote) && (!freeOnly || i.cost === 0) &&
      (!need || (i.needs || []).includes(need)) &&
      (!qq || (i.title + ' ' + i.org + ' ' + i.desc + ' ' + (i.tags || []).join(' ')).toLowerCase().includes(qq)));
  }

  /** iCalendar (.ics) for an event. */
  function ics(ev) {
    const f = d => d.replace(/[-:]/g, '').replace(/\.\d+/, '').slice(0, 15) + 'Z';
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//92 Logics//Front Door Demo//EN', 'BEGIN:VEVENT', 'UID:' + ev.id + '@demo.92logics',
      'DTSTART:' + f(ev.start), 'DTEND:' + f(ev.end || ev.start), 'SUMMARY:' + ev.title, 'LOCATION:' + (ev.location || ev.town || ''),
      'DESCRIPTION:Demo event (synthetic) - 92 Logics demonstration', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }

  /** Analytics: aggregate the event log. */
  function analytics(events, subs, consent) {
    const count = (t) => events.filter(e => e.t === t).length;
    const by = (t, k) => events.filter(e => e.t === t).reduce((m, e) => (m[e[k]] = (m[e[k]] || 0) + 1, m), {});
    const sent = events.filter(e => e.t === 'sms_out').length, deliv = events.filter(e => e.t === 'sms_out' && e.delivered).length;
    const optOuts = consent.filter(c => c.event === 'opt_out').length, optIns = consent.filter(c => c.event === 'opt_in').length;
    const sessions = count('session');
    return {
      sessions, needClicks: by('need', 'need'), screeners: count('screener'), appointments: count('appointment'),
      referrals: count('referral'), employer: count('employer'), searches: by('search', 'q'), views: count('view'),
      smsSent: sent, smsDelivered: deliv, deliveryRate: sent ? Math.round(deliv / sent * 1000) / 10 : 0,
      optedIn: subs.filter(s => s.sms === 'opted_in').length, optIns, optOuts,
      optOutRate: (optIns + optOuts) ? Math.round(optOuts / (optIns + optOuts) * 1000) / 10 : 0,
      pushEnabled: subs.filter(s => s.push).length,
      funnel: { visits: sessions, explored: count('view') + count('search'), acted: count('appointment') + count('referral') + count('employer') }
    };
  }

  function maskPhone(p) { p = String(p); const n = (p.match(/\d/g) || []).length; let i = 0; return p.replace(/\d/g, d => (++i <= n - 4 ? '•' : d)); }

  const api = { classifyKeyword, handleInbound, smsSegments, audience, inQuietHours, screen, DEFAULT_RULES, filterListings, ics, analytics, maskPhone, REPLIES, STOP_WORDS, START_WORDS, HELP_WORDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WFD = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
