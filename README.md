# Digital Workforce Front Door — working demo (The WorkPlace Mobile App RFP)

**Demonstration by 92 Logics for The WorkPlace Mobile App RFP — not a WorkPlace system. All data is synthetic.** No WorkPlace logos or branding. No real people, employers or phone numbers (all phones are fictional 555-01xx). No texts or pushes are actually sent. No tracking and no external calls: everything runs in your browser (localStorage).

Live: https://92logics.github.io/workplace-front-door-demo/

## What it shows
| RFP need | In the demo |
|---|---|
| Need-based navigation ("I need a job", "I want training", "I need career help", "I am a young adult", "I am an employer") | Home tiles → guided next steps + matching listings |
| Discovery of jobs, training, programs, events with location and other filters | Search with keyword, type, town, remote/virtual, free-only; saved opportunities |
| Calls to action: request help, referral/interest form, contact a counselor | "I'm interested" referral with reference number; appointment request form; services screener |
| Events, registration, calendar options | Register + "Add to calendar" (.ics) |
| User dashboard / inbox | Inbox of confirmations, reminders, staff replies and push notifications; unread badge |
| Employer pathway | Business-services request form |
| Staff content management without developers | Banner, need tiles, listings/events (draft → publish), audit log, role-based access (Admin / Content editor / Messaging staff / Viewer) |
| Two-way SMS, consent, opt-out, staff tools | SMS simulator with STOP/START/HELP keyword handling, auto-replies, routing of free text to a staff inbox, staff replies blocked for non-consenting numbers |
| Composing, scheduling, segmentation, push vs SMS | Campaign composer with templates, interest segments, GSM-7/UCS-2 segment counter, quiet-hours warning, schedule, SMS or push |
| Consent records | Append-only consent log (method/evidence, consent-text version), CSV export |
| Analytics | Privacy-first KPIs, need mix, top searches, service-navigation funnel, CSV export |
| Integrations | Integration plan by RFP category (out of box / configuration / custom / third-party approval), static JSON API + OpenAPI, inbound-SMS webhook simulator |
| Cross-platform, mobile-first, web | Installable PWA (offline browsing), responsive: bottom tab bar on phones, sidebar on desktop |
| Accessibility & language | Skip link, labelled controls, live regions, focus outlines, larger-text toggle, sample Spanish navigation |

## Proposed production architecture
React Native (Expo) for iOS + Android from one codebase, plus a React web/PWA front end sharing components and API; ASP.NET Core API on Azure with SQL Server; headless CMS screens in the admin app; a carrier-registered SMS provider (two-way, 10DLC/toll-free) via webhooks; FCM/APNs push; Entra ID/MFA for staff; WCAG 2.1 AA testing; WorkPlace owns its data, content and app-store accounts.

## Run and test
Any static server: `python3 -m http.server` → http://localhost:8000/. `node build-api.js` regenerates `api/v1/*.json`.
Tests: `node tests/core.test.js` (unit) · `node tests/e2e.js <url> <shotsDir>` (puppeteer-core + Chrome).
