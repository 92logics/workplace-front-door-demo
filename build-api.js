// Builds the static read-only demo API from the synthetic seed. Run: node build-api.js
const fs = require('fs'); require('./data.js'); const W = require('./core.js'); const S = globalThis.WFD_SEED;
const note = 'Demonstration by 92 Logics - not a WorkPlace system. Synthetic data only.';
const out = (n, data) => fs.writeFileSync(`api/v1/${n}.json`, JSON.stringify({ _note: note, generated: '2026-10-30', count: Array.isArray(data) ? data.length : undefined, data }, null, 1));
fs.mkdirSync('api/v1', { recursive: true });
out('listings', S.listings.filter(l => l.status === 'published' && l.type !== 'event'));
out('events', S.listings.filter(l => l.type === 'event'));
out('services', S.needs.map(n => ({ id: n.id, label: n.label, label_es: n.es, description: n.blurb })).concat([]));
out('kpis', W.analytics(S.events, S.subs, S.consent));
fs.writeFileSync('api/v1/openapi.json', JSON.stringify({ openapi: '3.0.3', info: { title: 'Front Door demo API (92 Logics demonstration)', version: '0.1', description: note + ' Production API: ASP.NET Core, OAuth2/Entra ID, role-scoped.' },
  paths: { '/api/v1/listings.json': { get: { summary: 'Published jobs and training (filters in production: q, type, town, remote, free)', responses: { 200: { description: 'OK' } } } },
    '/api/v1/events.json': { get: { summary: 'Events (also as iCal feed in production)', responses: { 200: { description: 'OK' } } } },
    '/api/v1/services.json': { get: { summary: 'Need-based service entry points', responses: { 200: { description: 'OK' } } } },
    '/api/v1/kpis.json': { get: { summary: 'Aggregate, de-identified usage KPIs', responses: { 200: { description: 'OK' } } } },
    '/webhooks/sms/inbound': { post: { summary: '(production) Inbound SMS from provider; STOP/START/HELP handled, other text routed to staff queue; signature-verified', responses: { 200: { description: 'OK' } } } } } }, null, 1));
console.log('api built');
