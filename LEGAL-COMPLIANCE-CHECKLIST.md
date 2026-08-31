# AP Electrical Services — required before public launch

Status date: 31 August 2026  
Publication status: **BLOCKED — do not deploy publicly until every required item below is resolved.**

This file is the owner hand-off checklist. Verified public facts live in `config/legal.ts`; unknown facts deliberately remain `null` or empty environment values. Never replace them with estimates.

## Identity and licensed-profession disclosures

- [x] Record the verified establishment locality: Kato Polemidia, Limassol, Cyprus / Κάτω Πολεμίδια, Λεμεσός, Κύπρος.
- [ ] Add or legally validate the full geographic address where Antis Petrides is established. The locality alone does not identify a street/premises and is not being treated as the complete address required by section 8 of Cyprus Law 156(I)/2004.
- [x] Record the verified professional title: Electrical Installations Contractor / Εργολήπτης Ηλεκτρικών Εγκαταστάσεων, with 25 years of professional experience.
- [x] Record the owner’s instruction that the electrician licence/registration number must not be published on the website or stored in public environment configuration.
- [ ] Obtain a written Cyprus-lawyer or competent-authority determination on whether section 8(1)(d), the professional rules, or another applicable provision requires publishing a register identifier/registration number or equivalent. If it is mandatory, the site cannot launch while that identifier is withheld.
- [ ] Confirm the exact professional category/certificate type, issuing state, and current validity without placing the confidential certificate copy or number in the public repository.
- [x] Record the owner-confirmed competent authority: Department of Electrical and Mechanical Services (EMS), Ministry of Transport, Communications and Works / Τμήμα Ηλεκτρομηχανολογικών Υπηρεσιών (Τ.ΗΜΥ), Υπουργείο Μεταφορών, Επικοινωνιών και Έργων.
- [ ] Confirm the exact register that applies to this certificate and the official URL where the applicable professional rules can be accessed.
- [x] Record the owner-confirmed VAT status: not registered for VAT; no VAT number applies.
- [ ] Have a Cyprus-qualified lawyer review the Legal Notice and consumer-facing Terms after these facts and the actual contracting workflow are supplied.

Why this blocks launch: section 8 of [Cyprus Law 156(I)/2004](https://cylaw.org/nomoi/enop/non-ind/2004_1_156/division-ddb446f2e4-4121-425b-b740-151f2e17c54e.html) requires continuous access to identity, geographic address and contact details and, where applicable, the relevant public register and registration number/equivalent, supervisory authority, regulated-profession information, professional rules, and VAT information. The statute does not establish from the currently available facts that every electrician licence number must always appear; that applicability question must be resolved rather than guessed. Official Cyprus guidance states that electrical professions require the relevant competency and current registration documentation: [Electrical Services’ Professionals](https://www.businessincyprus.gov.cy/business-sectors/electrical-services-professionals/).

## Privacy operations and retention

- [x] Record `pavlospetrides741@gmail.com` as the approved privacy and rights-request contact.
- [ ] Decide and document specific maximum retention periods for: active enquiries; completed or declined enquiries; records moved into customer/accounting files; abuse-prevention data; hosting logs; Supabase Auth/security logs; and backups. Put the approved periods in `config/legal.ts` and the production policy.
- [ ] Define a repeatable deletion process and owner responsible for running it. Test deletion from the appointment table and any provider backups within the approved lifecycle.
- [ ] Confirm how an access, correction, deletion, restriction, portability, or objection request will be identified, logged, answered, and completed within the applicable GDPR period.
- [ ] Record the legitimate-interests assessment for short-lived abuse prevention and website security.
- [ ] Ensure the provider does not copy enquiry data into unmanaged personal notes, messaging tools, or mailboxes without updating the data map and retention rules.

## Hosting, processors, regions, and transfers

- [x] Record the final public HTTPS domain as `https://apetrides.com` and use it for `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_PRODUCTION_DOMAIN` in production.
- [x] Record Vercel as the intended production host.
- [ ] Migrate or adapt the current Vinext + OpenAI Sites/Cloudflare-compatible build to a verified Vercel deployment. The current repository configuration is not evidence that the dynamic application is Vercel-ready.
- [ ] Confirm the Vercel account/plan, Functions region, DPA, current subprocessors, support access, enabled observability/log drains, and actual runtime-log retention. Vercel’s current documentation makes log retention plan-dependent.
- [ ] In the Supabase dashboard, record the exact project region. “Europe” is insufficient because the general grouping can include non-EU locations; use the concrete assigned region.
- [ ] Execute/accept and archive the current Supabase DPA, verify its current subprocessors, and document the transfer mechanism and supplementary measures where processing can occur outside the EEA.
- [ ] Confirm backups, support access, Auth logs, email/auth delivery configuration, and any replicas or integrations. The code audit found no extra destination, but account-level features cannot be proven from source code.
- [ ] Maintain a processor register and review provider/subprocessor changes on a defined schedule.

References: [Supabase regions](https://supabase.com/docs/guides/platform/regions), [Supabase DPA](https://supabase.com/downloads/docs/Supabase%2BDPA%2B260317.pdf), [Vercel DPA](https://vercel.com/legal/Vercel_Inc_-_Data_Processing_Addendum.pdf), [Vercel regions/transfers](https://vercel.com/docs/security/compliance), and [Vercel runtime logs](https://vercel.com/docs/logs/runtime).

## Cookies, storage, and production verification

- [ ] After the real Vercel deployment, scan anonymous `/el` and `/en` visits on `https://apetrides.com` in a clean browser for cookies, local storage, session storage, IndexedDB, Cache Storage, service workers, third-party requests, and response `Set-Cookie` headers.
- [ ] Repeat the scan for the private admin login, successful password login, MFA verification, session refresh, and logout. Record the exact production cookie names, attributes, duration, and deletion behavior.
- [ ] Verify whether the hosting edge injects any security or access cookies. Add them to the policy if present.
- [ ] Keep analytics, advertising, pixels, embeds, and marketing disabled. If any are proposed later, perform a new legal/technical audit and implement prior blocking plus equal accept/reject/withdraw controls before enabling them.
- [ ] Do not add a cosmetic cookie banner or “Cookie Settings” link while there is no optional storage to control.

Cyprus’s official guidance identifies section 99(5) of Law 112(I)/2004 as the cookie rule and requires informed, affirmative consent where consent is necessary: [Office of the Commissioner — Cookies](https://www.gov.cy/dataprotection/documents/cookies/).

## Forms, contracts, and operational accuracy

- [ ] Confirm that the appointment form fields match what is genuinely needed. Do not request sensitive data; keep the warning beside the submit button.
- [ ] Confirm the actual quotation, acceptance, appointment confirmation, cancellation, deposit/payment, warranty, complaint, and emergency-contact processes. Update the Terms before using the site to conclude contracts.
- [ ] If distance or off-premises contracts will be concluded, obtain Cyprus legal advice on the exact pre-contract information, durable-medium confirmation, withdrawal period/exceptions, and any request to begin work early. The current form intentionally creates no contract.
- [ ] If prices are ever published, state clearly whether taxes and other charges are included. There are currently no prices and no payment collection.
- [ ] If marketing email/SMS/WhatsApp is introduced, build a separate compliant opt-in and suppression workflow. Appointment details are not marketing consent.

## Final verification and release gate

- [ ] Apply every required Supabase migration to the production project before deploying the current code. Migration `202608310002_bilingual_content_and_image_variants.sql` is still not confirmed live.
- [ ] Verify the selected Vercel build/runtime path supports every dynamic route, the private admin authentication cookies, middleware/proxy behavior, image processing, and the appointment API before pointing `apetrides.com` at it.
- [ ] Re-run lint, typecheck, unit tests, build, route smoke tests, anonymous/non-admin/admin-MFA RLS tests, and the clean-browser mobile cookie/storage test against the final candidate.
- [ ] Review both Greek and English policies on narrow mobile screens and verify every footer/form/legal link, canonical URL, hreflang alternate, robots rule, and sitemap entry.
- [ ] Record owner approval, lawyer review date, DPA versions, scan evidence, test output, and policy version in the release record.
- [ ] Only after every required checkbox is complete, change publication status from blocked and deploy.

The relevant supervisory authority is the [Office of the Commissioner for Personal Data Protection](https://www.dataprotection.gov.cy/), Kypranoros 15, 1061 Nicosia, Cyprus; commissioner@dataprotection.gov.cy; +357 22 818456.
