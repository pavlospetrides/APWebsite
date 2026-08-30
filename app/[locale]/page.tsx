import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowUpRight, ClipboardCheck, Hammer, HousePlug, Phone, SearchCheck, ShieldCheck, Wrench } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PublicPage } from '@/components/public-page';
import { ExampleNote } from '@/components/example-note';
import { CtaBand } from '@/components/cta-band';
import { contactHref, siteConfig } from '@/config/site';
import { categoryLabel, exampleProjects } from '@/lib/projects.seed';
import { isLocale, messages, type Locale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string }> };
const copy = {
  el: {
    eyebrow: 'Ηλεκτρολογικές εργασίες κατοικιών', title: <>Σωστή εγκατάσταση.<br /><em>Καθαρό αποτέλεσμα.</em></>, lead: 'Νέες κατασκευές, ανακαινίσεις και επισκευές με προσεκτική εκτέλεση και ξεκάθαρη επικοινωνία.',
    aboutKicker: 'Σχετικά', aboutTitle: 'Η εργασία οργανώνεται από την αρχή έως τον τελικό έλεγχο.', aboutText: 'Ο Άντης Πετρίδης αναλαμβάνει ηλεκτρολογικές εγκαταστάσεις σε νέες κατοικίες, εργασίες ανακαίνισης, επισκευές και αναβαθμίσεις οικιακών εγκαταστάσεων. Κάθε αίτημα εξετάζεται με βάση τον χώρο και τις πραγματικές ανάγκες του.',
    servicesTitle: 'Εργασίες για κάθε στάδιο της κατοικίας', servicesLead: 'Από την πρώτη σωλήνωση μέχρι τη διάγνωση μιας βλάβης.',
    services: [
      ['Ανακαινίσεις', 'Αντικατάσταση καλωδίωσης, νέα σημεία φωτισμού, πρίζες, διακόπτες και αναβάθμιση πίνακα.', '/el/renovations'],
      ['Νέες κατασκευές', 'Πλήρης εγκατάσταση από τη μελέτη απαιτήσεων και τις σωληνώσεις έως τον έλεγχο και την παράδοση.', '/el/new-builds'],
      ['Επισκευές & βλάβες', 'Διάγνωση προβλημάτων σε πίνακες, κυκλώματα, φωτισμό, πρίζες και διακόπτες.', '/el/repairs'],
    ],
    processKicker: 'Διαδικασία', processTitle: 'Τέσσερα καθαρά βήματα', process: [['01','Επικοινωνία','Περιγράφετε το έργο ή το πρόβλημα.'],['02','Επίσκεψη & εκτίμηση','Ελέγχεται ο χώρος και αποσαφηνίζεται η εργασία.'],['03','Εκτέλεση','Η εργασία γίνεται οργανωμένα και με προσοχή στον χώρο.'],['04','Τελικός έλεγχος','Ελέγχονται τα σημεία της εγκατάστασης πριν την ολοκλήρωση.']],
    projectsKicker: 'Ενδεικτικές εργασίες', projectsTitle: 'Μια σαφής εικόνα του αντικειμένου', areaText: 'Συμπληρώστε την πραγματική περιοχή εξυπηρέτησης στο κεντρικό αρχείο ρυθμίσεων.', finalTitle: 'Έχετε μια εργασία στο μυαλό σας;', finalText: 'Περιγράψτε την ανάγκη σας για να οργανωθεί το επόμενο βήμα.',
  },
  en: {
    eyebrow: 'Residential electrical work', title: <>Correct installation.<br /><em>Clean result.</em></>, lead: 'New builds, renovations and repairs delivered with careful workmanship and clear communication.',
    aboutKicker: 'About', aboutTitle: 'The work is organised from the first discussion to the final check.', aboutText: 'Antis Petridis undertakes electrical installations in new homes, renovation work, repairs and residential upgrades. Each request is considered around the space and its actual requirements.',
    servicesTitle: 'Electrical work for every stage of a home', servicesLead: 'From the first conduit to methodical fault diagnosis.',
    services: [
      ['Renovations', 'Cable replacement, new lighting points, sockets, switches and distribution-board upgrades.', '/en/renovations'],
      ['New builds', 'A complete installation from requirements and conduits through testing and handover.', '/en/new-builds'],
      ['Repairs & faults', 'Diagnosis of issues affecting boards, circuits, lighting, sockets and switches.', '/en/repairs'],
    ],
    processKicker: 'Process', processTitle: 'Four clear steps', process: [['01','Contact','Describe the project or problem.'],['02','Visit & assessment','The space is checked and the scope clarified.'],['03','Execution','Work is carried out methodically and with care for the property.'],['04','Final check','The relevant parts of the installation are checked before completion.']],
    projectsKicker: 'Example services', projectsTitle: 'A clear view of the work', areaText: 'Replace the placeholder with the actual service area in the central configuration file.', finalTitle: 'Have a job in mind?', finalText: 'Tell us what you need so the next step can be organised.',
  },
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params; if (!isLocale(locale)) return {};
  const el = locale === 'el';
  return { title: el ? 'Ηλεκτρολόγος για κατοικίες | AP Electrical Services' : 'Residential electrician | AP Electrical Services', description: el ? 'Ηλεκτρολογικές εγκαταστάσεις, ανακαινίσεις, επισκευές και εντοπισμός βλαβών σε κατοικίες.' : 'Residential electrical installations, renovations, repairs and fault finding.', alternates: { canonical: `/${locale}`, languages: { el: '/el', en: '/en' } } };
}

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params; if (!isLocale(raw)) notFound(); const locale: Locale = raw; const c = copy[locale]; const m = messages[locale];
  const icons = [Hammer, HousePlug, Wrench];
  return <PublicPage locale={locale} active="home">
    <section className="hero-shell">
      <Image className="hero-image" src="/images/hero-new-build.webp" alt={locale === 'el' ? 'Ενδεικτική εγκατάσταση καλωδίωσης σε νέα κατοικία' : 'Example wiring installation in a new home'} fill priority sizes="100vw" />
      <div className="hero-shade" /><div className="circuit-grid" aria-hidden="true" />
      <div className="hero-copy"><p className="eyebrow"><span />{c.eyebrow}</p><h1>{c.title}</h1><p className="hero-lead">{c.lead}</p><div className="hero-actions"><a className="button button-primary" href={contactHref.phone}><Phone />{m.call}</a><a className="button button-secondary" href={`/${locale}/contact`}>{m.appointment}<ArrowUpRight /></a></div></div>
      <div className="hero-index" aria-hidden="true"><span>01</span><i /></div>
    </section>

    <section className="section split-intro"><div><p className="section-kicker">{c.aboutKicker}</p><h2>{c.aboutTitle}</h2></div><div><p className="section-lead">{c.aboutText}</p><div className="trust-line"><ShieldCheck /><span>{locale === 'el' ? 'Εργασία προσαρμοσμένη στην πραγματική εγκατάσταση του χώρου.' : 'Work shaped around the property’s actual installation.'}</span></div></div></section>

    <section className="section services-section"><div className="section-heading"><div><p className="section-kicker">{locale === 'el' ? 'Υπηρεσίες' : 'Services'}</p><h2>{c.servicesTitle}</h2></div><p>{c.servicesLead}</p></div><div className="service-grid">{c.services.map(([title, text, href], i) => { const Icon = icons[i]; return <article className="service-card" key={title}><span className="service-number">0{i+1}</span><Icon /><h3>{title}</h3><p>{text}</p><a href={href}>{m.learn}<ArrowUpRight /></a></article>; })}</div></section>

    <section className="process-section"><div className="section"><p className="section-kicker light">{c.processKicker}</p><h2>{c.processTitle}</h2><div className="process-grid">{c.process.map(([no,title,text], i) => { const Icon = [Phone, SearchCheck, ClipboardCheck, ShieldCheck][i]; return <article key={no}><span>{no}</span><Icon /><h3>{title}</h3><p>{text}</p></article>; })}</div></div></section>

    <section className="section projects-preview"><div className="section-heading"><div><p className="section-kicker">{c.projectsKicker}</p><h2>{c.projectsTitle}</h2></div><a className="text-link" href={`/${locale}/projects`}>{m.nav.projects}<ArrowUpRight /></a></div><ExampleNote locale={locale} /><div className="project-grid">{exampleProjects.filter(p=>p.featured).slice(0,3).map(project => <a className="project-card" href={`/${locale}/projects/${project.slug}`} key={project.slug}><div className="project-image"><Image src={project.cover} alt={project.alt[locale]} fill sizes="(max-width: 800px) 100vw, 33vw" /></div><div><span>{categoryLabel[project.category][locale]}</span><h3>{project.title[locale]}</h3><p>{project.description[locale]}</p></div></a>)}</div></section>

    <section className="area-band"><div><p className="section-kicker light">{m.area}</p><h2>{siteConfig.serviceArea}</h2></div><p>{c.areaText}</p></section>
    <CtaBand locale={locale} title={c.finalTitle} text={c.finalText} />
  </PublicPage>;
}
