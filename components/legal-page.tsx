import type { Metadata } from 'next';
import { legalConfig, type LegalDocumentKind } from '@/config/legal';
import { PublicPage } from '@/components/public-page';
import type { Locale } from '@/lib/i18n';

const titles: Record<LegalDocumentKind, { el: string; en: string }> = {
  privacy: { el: 'Πολιτική Απορρήτου', en: 'Privacy Policy' },
  cookies: { el: 'Πολιτική Cookies και Αποθήκευσης', en: 'Cookie and Storage Policy' },
  legal: { el: 'Νομική Ενημέρωση', en: 'Legal Notice' },
  terms: { el: 'Όροι Χρήσης και Αιτημάτων', en: 'Website and Enquiry Terms' },
};

const descriptions: Record<LegalDocumentKind, { el: string; en: string }> = {
  privacy: {
    el: 'Πώς ο Άντης Πετρίδης συλλέγει, χρησιμοποιεί και προστατεύει τα στοιχεία που υποβάλλονται μέσω της ιστοσελίδας.',
    en: 'How Antis Petrides collects, uses, and protects information submitted through this website.',
  },
  cookies: {
    el: 'Πώς χρησιμοποιούνται cookies και άλλες μορφές αποθήκευσης στη δημόσια ιστοσελίδα και την ιδιωτική διαχείριση.',
    en: 'How cookies and browser storage are used on the public website and private administration.',
  },
  legal: {
    el: 'Ταυτότητα, στοιχεία επικοινωνίας και επαγγελματικές πληροφορίες του παρόχου της ιστοσελίδας.',
    en: 'Identity, contact, and professional information for the provider of this website.',
  },
  terms: {
    el: 'Οι όροι που διέπουν τη χρήση της ιστοσελίδας και την αποστολή αιτήματος επικοινωνίας.',
    en: 'Terms governing use of the website and submission of a contact request.',
  },
};

function policyDate(locale: Locale) {
  const [year, month, day] = legalConfig.policyVersion.split('-');
  if (locale === 'el') return `${day}/${month}/${year}`;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}

export function getLegalMetadata(locale: Locale, kind: LegalDocumentKind): Metadata {
  return {
    title: titles[kind][locale],
    description: descriptions[kind][locale],
    alternates: {
      canonical: `/${locale}/${kind}`,
      languages: { el: `/el/${kind}`, en: `/en/${kind}`, 'x-default': `/el/${kind}` },
    },
    openGraph: {
      title: `${titles[kind][locale]} | AP Electrical Services`,
      description: descriptions[kind][locale],
      locale: locale === 'el' ? 'el_CY' : 'en_CY',
    },
  };
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function PrivacyPolicy({ locale }: { locale: Locale }) {
  const c = legalConfig;
  if (locale === 'el') return <>
    <h2>1. Υπεύθυνος επεξεργασίας</h2>
    <p>Υπεύθυνος επεξεργασίας είναι ο <strong>{c.identity.providerNameEl}</strong>, φυσικό πρόσωπο και ατομικός πάροχος υπηρεσιών που χρησιμοποιεί την εμπορική ονομασία «{c.identity.tradingName}». Η ονομασία αυτή δεν αποτελεί εταιρεία ή ξεχωριστό νομικό πρόσωπο.</p>
	    <p>Επικοινωνία: <a href={`tel:${c.identity.phone.replace(/\s/g, '')}`}>{c.identity.phone}</a> · <a href={`mailto:${c.identity.email}`}>{c.identity.email}</a>. Επαφή απορρήτου: <a href={`mailto:${c.privacy.privacyContactEmail}`}>{c.privacy.privacyContactEmail}</a>. Τοποθεσία: {c.identity.establishmentLocalityEl}.</p>

    <h2>2. Ποια δεδομένα συλλέγονται</h2>
    <p>Η φόρμα αιτήματος συλλέγει: όνομα, τηλέφωνο, προαιρετικό email, είδος εργασίας, περιοχή, προαιρετική προτιμώμενη ημερομηνία και ώρα, μήνυμα, καθώς και την ημερομηνία/ώρα δημιουργίας και την εσωτερική κατάσταση του αιτήματος («νέο», «έγινε επικοινωνία», «ολοκληρώθηκε»).</p>
    <p>Για περιορισμό κατάχρησης, η διεύθυνση IP επεξεργάζεται προσωρινά στη μνήμη του διακομιστή για παράθυρο 10 λεπτών. Οι πάροχοι hosting και βάσης δεδομένων ενδέχεται επίσης να επεξεργάζονται τεχνικά δεδομένα αιτημάτων, όπως IP, χρόνος, διαδρομή, user agent και διαγνωστικά σφάλματα, σύμφωνα με τις ρυθμίσεις και τους δικούς τους όρους. Η εφαρμογή δεν δημιουργεί προφίλ επισκέπτη.</p>

    <h2>3. Σκοποί και νομικές βάσεις</h2>
    <ul>
      <li><strong>Απάντηση και αξιολόγηση εθελοντικού αιτήματος:</strong> ενέργειες κατόπιν αιτήματός σας πριν από ενδεχόμενη σύμβαση, άρθρο 6(1)(β) ΓΚΠΔ.</li>
      <li><strong>Ασφάλεια, πρόληψη κατάχρησης και υπεράσπιση νομικών αξιώσεων:</strong> έννομο συμφέρον για ασφαλή και αξιόπιστη λειτουργία, άρθρο 6(1)(στ). Μπορείτε να αντιταχθείτε για λόγους που σχετίζονται με την ιδιαίτερη κατάστασή σας.</li>
      <li><strong>Τήρηση αρχείων όταν ένα αίτημα οδηγήσει σε εργασία:</strong> μόνο στον βαθμό που απαιτείται από φορολογικές, λογιστικές ή άλλες νομικές υποχρεώσεις, άρθρο 6(1)(γ).</li>
    </ul>
    <p>Δεν βασιζόμαστε σε συγκατάθεση για να χειριστούμε ένα αίτημα που εσείς ζητήσατε και δεν χρησιμοποιούμε τα στοιχεία για marketing.</p>

    <h2>4. Αναγκαιότητα και πηγές</h2>
    <p>Το όνομα, τηλέφωνο, είδος εργασίας, περιοχή και μήνυμα είναι απαραίτητα για την αξιολόγηση και απάντηση. Το email, η ημερομηνία και η ώρα είναι προαιρετικά. Αν δεν δοθούν τα απαραίτητα στοιχεία, η φόρμα δεν μπορεί να σταλεί· μπορείτε αντί αυτής να τηλεφωνήσετε. Τα στοιχεία λαμβάνονται απευθείας από εσάς.</p>

    <h2>5. Αποδέκτες και εκτελούντες</h2>
    <p>Πρόσβαση στα αιτήματα έχει μόνο ο υπεύθυνος/εξουσιοδοτημένος διαχειριστής μέσω ιδιωτικής σύνδεσης με MFA. Η εφαρμογή χρησιμοποιεί <strong>{c.infrastructure.applicationHost}</strong> με υποδομή <strong>{c.infrastructure.edgeInfrastructure}</strong> για φιλοξενία και <strong>{c.infrastructure.databaseAndAuthentication}</strong> για βάση δεδομένων, αποθήκευση και διαχειριστική ταυτοποίηση. Στοιχεία μπορούν επίσης να γνωστοποιηθούν σε επαγγελματικούς συμβούλους ή δημόσιες αρχές μόνο όταν είναι αναγκαίο ή επιβάλλεται από τον νόμο.</p>

    <h2>6. Διεθνείς διαβιβάσεις</h2>
    <p>Το Vercel, το Supabase και οι εγκεκριμένοι υπο-εκτελούντες τους μπορεί να επεξεργάζονται δεδομένα στον Ευρωπαϊκό Οικονομικό Χώρο και σε άλλες χώρες, περιλαμβανομένων των Ηνωμένων Πολιτειών. Όταν δεδομένα διαβιβάζονται εκτός ΕΟΧ χωρίς απόφαση επάρκειας, χρησιμοποιούνται κατάλληλες εγγυήσεις, όπως οι Τυποποιημένες Συμβατικές Ρήτρες της Ευρωπαϊκής Επιτροπής και, όπου χρειάζεται, συμπληρωματικά μέτρα.</p>

    <h2>7. Διατήρηση</h2>
    <p>Τα στοιχεία αιτημάτων διατηρούνται μόνο όσο είναι αναγκαίο για την αξιολόγηση, την επικοινωνία και την εξυπηρέτηση του αιτήματος. Αιτήματα που ολοκληρώθηκαν ή δεν οδήγησαν σε εργασία επανεξετάζονται περιοδικά και διαγράφονται όταν δεν χρειάζονται πλέον. Αν ένα αίτημα οδηγήσει σε εργασία, σχετικά στοιχεία μπορεί να διατηρηθούν για όσο απαιτούν φορολογικές, λογιστικές ή άλλες νομικές υποχρεώσεις ή για τη θεμελίωση, άσκηση ή υπεράσπιση νομικών αξιώσεων. Τα τεχνικά δεδομένα ασφάλειας διατηρούνται μόνο για το αναγκαίο διάστημα και στη συνέχεια διαγράφονται ή ανωνυμοποιούνται.</p>

    <h2>8. Δικαιώματά σας</h2>
	    <p>Ανάλογα με την περίπτωση, έχετε δικαίωμα ενημέρωσης και πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, φορητότητας και εναντίωσης σε επεξεργασία βάσει έννομου συμφέροντος. Όπου τυχόν χρησιμοποιηθεί συγκατάθεση στο μέλλον, μπορείτε να την ανακαλέσετε χωρίς να επηρεάζεται η προηγούμενη νομιμότητα. Μπορεί να ζητηθούν εύλογες πληροφορίες για επιβεβαίωση ταυτότητας. Στείλτε αίτημα στο <a href={`mailto:${c.privacy.privacyContactEmail}`}>{c.privacy.privacyContactEmail}</a>.</p>
    <p>Μπορείτε επίσης να υποβάλετε παράπονο στο <ExternalLink href={c.contacts.cyprusAuthorityUrl}>{c.contacts.cyprusAuthorityNameEl}</ExternalLink>, {c.contacts.cyprusAuthorityAddress}, <a href={`mailto:${c.contacts.cyprusAuthorityEmail}`}>{c.contacts.cyprusAuthorityEmail}</a>, {c.contacts.cyprusAuthorityPhone}.</p>

    <h2>9. Αυτοματοποιημένες αποφάσεις και ασφάλεια</h2>
    <p>Δεν γίνεται αυτοματοποιημένη λήψη αποφάσεων ή κατάρτιση προφίλ. Χρησιμοποιούνται επικύρωση εισόδου, Row Level Security στη βάση, ιδιωτική αποθήκευση, ελάχιστα δικαιώματα και MFA για τη διαχειριστική ανάγνωση. Κανένα μέτρο δεν παρέχει απόλυτη ασφάλεια· περιστατικά θα αξιολογούνται και θα γνωστοποιούνται όπως απαιτεί ο νόμος.</p>

    <h2>10. Cookies, αλλαγές και νομοθεσία</h2>
    <p>Η δημόσια ιστοσελίδα δεν χρησιμοποιεί analytics ή διαφημιστικά cookies. Η πλήρης απογραφή βρίσκεται στην <a href="/el/cookies">Πολιτική Cookies και Αποθήκευσης</a>. Η πολιτική θα ενημερώνεται όταν αλλάζουν οι πραγματικές ροές ή οι πάροχοι. Έκδοση: {c.policyVersion}. Βασίζεται στον <ExternalLink href={c.sources.gdpr}>Γενικό Κανονισμό Προστασίας Δεδομένων</ExternalLink> και στην εφαρμοστέα κυπριακή νομοθεσία.</p>
  </>;

  return <>
    <h2>1. Controller</h2>
    <p>The controller is <strong>{c.identity.providerNameEn}</strong>, a natural person and individual service provider trading as “{c.identity.tradingName}”. That trading name is not a company or a separate legal entity.</p>
	    <p>Contact: <a href={`tel:${c.identity.phone.replace(/\s/g, '')}`}>{c.identity.phone}</a> · <a href={`mailto:${c.identity.email}`}>{c.identity.email}</a>. Privacy contact: <a href={`mailto:${c.privacy.privacyContactEmail}`}>{c.privacy.privacyContactEmail}</a>. Location: {c.identity.establishmentLocalityEn}.</p>

    <h2>2. Data collected</h2>
    <p>The enquiry form collects your name, phone number, optional email, type of work, area, optional preferred date and time, and message. The system also records creation date/time and the internal request status (“new”, “contacted”, or “completed”).</p>
    <p>To limit abuse, the requesting IP address is processed temporarily in server memory for a 10-minute window. Hosting and database providers may also process technical request data such as IP address, time, route, user agent, and error diagnostics under the configured service and their terms. The application does not build visitor profiles.</p>

    <h2>3. Purposes and legal bases</h2>
    <ul>
      <li><strong>Responding to and assessing a voluntary enquiry:</strong> steps requested by you before a possible contract, GDPR Article 6(1)(b).</li>
      <li><strong>Security, abuse prevention, and legal claims:</strong> legitimate interests in operating a safe and reliable service, Article 6(1)(f). You may object for reasons relating to your particular situation.</li>
      <li><strong>Recordkeeping if an enquiry becomes work:</strong> only to the extent tax, accounting, or other laws require it, Article 6(1)(c).</li>
    </ul>
    <p>We do not rely on consent to handle an enquiry you asked us to process, and we do not use enquiry details for marketing.</p>

    <h2>4. Necessity and source</h2>
    <p>Name, phone, work type, area, and message are needed to assess and answer the enquiry. Email, preferred date, and preferred time are optional. Without the required fields the form cannot be sent; you may call instead. The information comes directly from you.</p>

    <h2>5. Recipients and processors</h2>
    <p>Only the controller/authorised administrator can read enquiries, through a private MFA-protected login. The application uses <strong>{c.infrastructure.applicationHost}</strong> with <strong>{c.infrastructure.edgeInfrastructure}</strong> infrastructure for hosting, and <strong>{c.infrastructure.databaseAndAuthentication}</strong> for database, storage, and administrator authentication. Information may also be disclosed to professional advisers or public authorities only where necessary or legally required.</p>

    <h2>6. International transfers</h2>
    <p>Vercel, Supabase, and their approved subprocessors may process data in the European Economic Area and other countries, including the United States. When data is transferred outside the EEA without an adequacy decision, appropriate safeguards are used, such as the European Commission’s Standard Contractual Clauses and, where needed, supplementary measures.</p>

    <h2>7. Retention</h2>
    <p>Enquiry details are kept only as long as necessary to assess, respond to, and handle the request. Completed enquiries and enquiries that do not lead to work are periodically reviewed and deleted when no longer needed. If an enquiry leads to work, relevant information may be retained for tax, accounting, or other legal obligations, or to establish, exercise, or defend legal claims. Technical security data is kept only for the necessary period and is then deleted or anonymised.</p>

    <h2>8. Your rights</h2>
	    <p>Depending on the circumstances, you have rights to information and access, rectification, erasure, restriction, portability, and objection to processing based on legitimate interests. If consent is introduced for a future purpose, it may be withdrawn without affecting earlier lawful processing. Reasonable information may be requested to verify identity. Send requests to <a href={`mailto:${c.privacy.privacyContactEmail}`}>{c.privacy.privacyContactEmail}</a>.</p>
    <p>You may also complain to the <ExternalLink href={c.contacts.cyprusAuthorityUrl}>{c.contacts.cyprusAuthorityName}</ExternalLink>, {c.contacts.cyprusAuthorityAddress}, <a href={`mailto:${c.contacts.cyprusAuthorityEmail}`}>{c.contacts.cyprusAuthorityEmail}</a>, {c.contacts.cyprusAuthorityPhone}.</p>

    <h2>9. Automated decisions and security</h2>
    <p>No automated decision-making or profiling is performed. Controls include input validation, database Row Level Security, private file storage, least-privilege access, and MFA for administrative reads. No measure provides absolute security; incidents will be assessed and notified where the law requires.</p>

    <h2>10. Cookies, changes, and law</h2>
    <p>The public website does not use analytics or advertising cookies. The full inventory is in the <a href="/en/cookies">Cookie and Storage Policy</a>. This policy will be updated when actual flows or providers change. Version: {c.policyVersion}. It is based on the <ExternalLink href={c.sources.gdpr}>General Data Protection Regulation</ExternalLink> and applicable Cyprus law.</p>
  </>;
}

function CookiePolicy({ locale }: { locale: Locale }) {
  const c = legalConfig;
  const isEl = locale === 'el';
  return <>
    <h2>{isEl ? '1. Τρέχουσα χρήση' : '1. Current use'}</h2>
    <p>{isEl
      ? 'Η δημόσια ιστοσελίδα δεν χρησιμοποιεί cookies, localStorage, sessionStorage ή IndexedDB και δεν φορτώνει analytics, διαφημίσεις, pixels, χάρτες, βίντεο, CAPTCHA ή άλλα ενσωματωμένα στοιχεία τρίτων. Η επιλογή γλώσσας αποτελεί μέρος της διεύθυνσης URL και δεν αποθηκεύεται στη συσκευή.'
      : 'The public website does not use cookies, localStorage, sessionStorage, or IndexedDB and does not load analytics, advertising, pixels, maps, video, CAPTCHA, or other third-party embeds. The language choice is part of the URL and is not stored on the device.'}</p>

    <h2>{isEl ? '2. Απογραφή cookies και αποθήκευσης' : '2. Cookie and storage inventory'}</h2>
    <div className="legal-table-wrap"><table className="legal-table">
      <thead><tr><th>{isEl ? 'Όνομα / κλειδί' : 'Name / key'}</th><th>{isEl ? 'Πάροχος / μέρος' : 'Provider / party'}</th><th>{isEl ? 'Πού' : 'Where'}</th><th>{isEl ? 'Σκοπός' : 'Purpose'}</th><th>{isEl ? 'Διάρκεια' : 'Duration'}</th><th>{isEl ? 'Αναγκαιότητα / συγκατάθεση' : 'Necessity / consent'}</th></tr></thead>
      <tbody>
        <tr><td>{isEl ? 'Κανένα' : 'None'}</td><td>—</td><td>{isEl ? 'Δημόσιες διαδρομές' : 'Public routes'}</td><td>{isEl ? 'Δεν χρησιμοποιείται αποθήκευση browser' : 'No browser storage is used'}</td><td>—</td><td>{isEl ? 'Δεν εφαρμόζεται / δεν ζητείται συγκατάθεση' : 'Not applicable / no consent requested'}</td></tr>
        <tr><td><code>sb-&lt;project-ref&gt;-auth-token</code>{isEl ? ' (και αριθμημένα τμήματα .0, .1 κ.λπ. όταν χρειάζονται)' : ' (and numbered .0, .1, etc. chunks when needed)'}</td><td>Supabase Auth · {isEl ? 'cookie πρώτου μέρους' : 'first-party cookie'}</td><td>{isEl ? 'Μόνο ιδιωτική σύνδεση διαχειριστή' : 'Private administrator login only'}</td><td>{isEl ? 'Διατήρηση ασφαλούς συνεδρίας Supabase και κατάστασης MFA' : 'Maintaining the Supabase session and MFA assurance state'}</td><td>{isEl ? 'έως 400 ημέρες· μπορεί να ανανεώνεται με τη συνεδρία και αφαιρείται κατά την αποσύνδεση ή την εκκαθάριση του browser' : 'up to 400 days; it may be refreshed with the session and is removed on sign-out or browser clearance'}</td><td>{isEl ? 'Απολύτως απαραίτητο για τον διαχειριστή · δεν απαιτείται συγκατάθεση' : 'Strictly necessary for the administrator · consent not required'}</td></tr>
      </tbody>
    </table></div>
    <p>{isEl ? 'Το project reference στο όνομα του cookie είναι αναγνωριστικό της υπηρεσίας και μπορεί να διαφέρει. Τα cookies σύνδεσης δεν δημιουργούνται για έναν απλό δημόσιο επισκέπτη.' : 'The project reference in the cookie name identifies the service and may differ. Login cookies are not created for an ordinary public visitor.'}</p>

    <h2>{isEl ? '3. Γιατί δεν εμφανίζεται banner' : '3. Why no banner is shown'}</h2>
    <p>{isEl
      ? 'Δεν υπάρχει μη απαραίτητη αποθήκευση για την οποία να ζητείται συγκατάθεση. Το admin cookie είναι αναγκαίο για υπηρεσία σύνδεσης που ζητά ρητά ο διαχειριστής. Συνεπώς, ένα banner «Αποδοχή όλων» δεν θα είχε πραγματική επιλογή ή λειτουργικό σκοπό. Η προσέγγιση ακολουθεί το άρθρο 99(5) του Ν. 112(I)/2004 και την επίσημη καθοδήγηση της Επιτρόπου.'
      : 'There is no non-essential storage requiring consent. The admin cookie is necessary for the login service expressly requested by the administrator. An “Accept all” banner would therefore have no genuine choice or functional purpose. This approach follows section 99(5) of Law 112(I)/2004 and the Commissioner’s official guidance.'}</p>
    <p><ExternalLink href={c.sources.cyprusCookies}>{isEl ? 'Επίσημη κυπριακή καθοδήγηση για cookies' : 'Official Cyprus cookie guidance'}</ExternalLink></p>

    <h2>{isEl ? '4. Έλεγχοι του browser' : '4. Browser controls'}</h2>
    <p>{isEl
      ? 'Μπορείτε να δείτε, να αποκλείσετε ή να διαγράψετε cookies από τις ρυθμίσεις απορρήτου του browser σας. Η διαγραφή δεν επηρεάζει τη δημόσια περιήγηση, αλλά ο αποκλεισμός του απαραίτητου authentication cookie εμποδίζει ή τερματίζει την ιδιωτική συνεδρία διαχειριστή. Επειδή δεν υπάρχει προαιρετική αποθήκευση, δεν υπάρχει επιλογή συγκατάθεσης προς αλλαγή μέσα στην ιστοσελίδα.'
      : 'You can view, block, or delete cookies in your browser privacy settings. Deletion does not affect public browsing, but blocking the necessary authentication cookie prevents or ends the private administrator session. Because there is no optional storage, there is no consent choice to change within the website.'}</p>

    <h2>{isEl ? '5. Υποδομή και μελλοντικές αλλαγές' : '5. Infrastructure and future changes'}</h2>
    <p>{isEl
      ? 'Το Vercel ή οι πάροχοι δικτύου του μπορεί να χρησιμοποιούν απολύτως αναγκαίους μηχανισμούς ή cookies ασφάλειας, όταν απαιτούνται για την ασφαλή παροχή της ιστοσελίδας. Αν προστεθούν analytics, marketing, ενσωματωμένα στοιχεία ή άλλη μη απαραίτητη αποθήκευση, θα αποκλείονται πριν από τη συγκατάθεση, θα παρέχονται ισότιμες επιλογές αποδοχής, απόρριψης και ανάκλησης και η παρούσα απογραφή θα ενημερώνεται πριν ενεργοποιηθούν.'
      : 'Vercel or its network providers may use strictly necessary security mechanisms or cookies when required to deliver the website securely. If analytics, marketing, embeds, or other non-essential storage is introduced, it will be blocked before consent, equal accept, reject, and withdrawal choices will be provided, and this inventory will be updated before activation.'}</p>
    <p>{isEl ? 'Δεν υπάρχει σύνδεσμος «Ρυθμίσεις Cookies», επειδή δεν υπάρχει consent manager ή προαιρετική κατηγορία προς ρύθμιση.' : 'There is no “Cookie Settings” link because there is no consent manager or optional category to configure.'}</p>
    <p>{isEl ? 'Έκδοση' : 'Version'}: {c.policyVersion}</p>
  </>;
}

function LegalNotice({ locale }: { locale: Locale }) {
  const c = legalConfig;
  const isEl = locale === 'el';
  return <>
    <h2>{isEl ? '1. Πάροχος της ιστοσελίδας' : '1. Website provider'}</h2>
    <dl className="legal-details">
      <div><dt>{isEl ? 'Ονοματεπώνυμο' : 'Name'}</dt><dd>{isEl ? c.identity.providerNameEl : c.identity.providerNameEn}</dd></div>
      <div><dt>{isEl ? 'Εμπορική ονομασία' : 'Trading name'}</dt><dd>{c.identity.tradingName}</dd></div>
      <div><dt>{isEl ? 'Νομική μορφή' : 'Legal form'}</dt><dd>{isEl ? 'Φυσικό πρόσωπο / ατομικός πάροχος υπηρεσιών — όχι εταιρεία ή Ltd' : 'Natural person / individual service provider — not a company or Ltd'}</dd></div>
      <div><dt>{isEl ? 'Επάγγελμα' : 'Profession'}</dt><dd>{isEl ? c.identity.professionalTitleEl : c.identity.professionalTitleEn}</dd></div>
      <div><dt>{isEl ? 'Επαγγελματική εμπειρία' : 'Professional experience'}</dt><dd>{c.identity.experienceYears} {isEl ? 'έτη' : 'years'}</dd></div>
      <div><dt>{isEl ? 'Περιοχή εξυπηρέτησης' : 'Service area'}</dt><dd>{isEl ? c.identity.serviceAreaEl : c.identity.serviceAreaEn}</dd></div>
      <div><dt>{isEl ? 'Τοποθεσία εγκατάστασης' : 'Establishment locality'}</dt><dd>{isEl ? c.identity.establishmentLocalityEl : c.identity.establishmentLocalityEn}</dd></div>
      <div><dt>{isEl ? 'Τηλέφωνο' : 'Phone'}</dt><dd><a href={`tel:${c.identity.phone.replace(/\s/g, '')}`}>{c.identity.phone}</a></dd></div>
      <div><dt>Email</dt><dd><a href={`mailto:${c.identity.email}`}>{c.identity.email}</a></dd></div>
	      <div><dt>{isEl ? 'Αρμόδια αρχή' : 'Competent authority'}</dt><dd>{isEl ? <>{c.identity.competentAuthorityDepartmentEl}<br />{c.identity.competentAuthorityMinistryEl}</> : <>{c.identity.competentAuthorityDepartmentEn}<br />{c.identity.competentAuthorityMinistryEn}</>}</dd></div>
    </dl>

    <h2>{isEl ? '2. Επαγγελματική ιδιότητα' : '2. Professional status'}</h2>
    <p>{isEl
	      ? `Ο ${c.identity.providerNameEl} παρέχει υπηρεσίες ως «${c.identity.professionalTitleEl}» και διαθέτει 25 χρόνια επαγγελματικής εμπειρίας. Αρμόδιο είναι το ${c.identity.competentAuthorityDepartmentEl}, ${c.identity.competentAuthorityMinistryEl}. Η επίσημη κυπριακή ενημέρωση περιγράφει τις απαιτήσεις εγγραφής και πιστοποίησης για την άσκηση ηλεκτρολογικών επαγγελμάτων.`
	      : `${c.identity.providerNameEn} provides services as an “${c.identity.professionalTitleEn}” and has 25 years of professional experience. The competent authority is the ${c.identity.competentAuthorityDepartmentEn}, ${c.identity.competentAuthorityMinistryEn}. Official Cyprus guidance describes the registration and certification requirements for practising electrical professions.`}</p>
    <p><ExternalLink href={c.sources.electricianRequirements}>{isEl ? 'Επίσημες απαιτήσεις ηλεκτρολογικών επαγγελμάτων' : 'Official electrical-profession requirements'}</ExternalLink></p>

	    <h2>{isEl ? '3. Υποχρεώσεις ηλεκτρονικού εμπορίου' : '3. Electronic-commerce disclosures'}</h2>
	    <p>{isEl
	      ? 'Η παρούσα ενημέρωση παρέχει με εύκολο και άμεσα προσβάσιμο τρόπο την ταυτότητα, τα στοιχεία επικοινωνίας, την τοποθεσία, την επαγγελματική ιδιότητα και την αρμόδια αρχή του παρόχου, σύμφωνα με τις εφαρμοστέες υποχρεώσεις ηλεκτρονικού εμπορίου.'
	      : 'This notice provides easy and direct access to the provider’s identity, contact details, location, professional status, and competent authority in accordance with applicable electronic-commerce disclosure duties.'}</p>
    <p><ExternalLink href={c.sources.cyprusEcommerceLaw}>{isEl ? 'Ν. 156(I)/2004, άρθρα 7–11' : 'Law 156(I)/2004, sections 7–11'}</ExternalLink></p>

    <h2>{isEl ? '4. Περιεχόμενο και ευθύνη' : '4. Content and responsibility'}</h2>
    <p>{isEl
      ? 'Η ιστοσελίδα παρέχει γενικές πληροφορίες και δυνατότητα αποστολής αιτήματος. Δεν παρέχει διάγνωση από απόσταση, τεχνική μελέτη, δεσμευτική προσφορά ή εγγύηση διαθεσιμότητας. Οι πληροφορίες μπορεί να ενημερώνονται. Δεν αποκλείεται ευθύνη που δεν μπορεί νόμιμα να αποκλειστεί, ούτε επηρεάζονται υποχρεωτικά δικαιώματα καταναλωτή.'
      : 'The website provides general information and a way to send an enquiry. It does not provide remote diagnosis, an electrical design, a binding quotation, or a guarantee of availability. Information may be updated. Liability that cannot lawfully be excluded is not excluded, and mandatory consumer rights are unaffected.'}</p>

    <h2>{isEl ? '5. Πνευματική ιδιοκτησία και δίκαιο' : '5. Intellectual property and law'}</h2>
    <p>{isEl
      ? 'Εκτός αν αναφέρεται διαφορετικά, το πρωτότυπο κείμενο, η εμπορική παρουσίαση και οι εικόνες της ιστοσελίδας δεν επιτρέπεται να αναπαραχθούν για εμπορική χρήση χωρίς άδεια. Η ιστοσελίδα διέπεται από το δίκαιο της Κυπριακής Δημοκρατίας, με την επιφύλαξη αναγκαστικών κανόνων που προστατεύουν τον καταναλωτή.'
      : 'Unless stated otherwise, original text, trade presentation, and site images may not be reproduced commercially without permission. The website is governed by the law of the Republic of Cyprus, subject to mandatory consumer-protection rules.'}</p>
    <p>{isEl ? 'Έκδοση' : 'Version'}: {c.policyVersion}</p>
  </>;
}

function Terms({ locale }: { locale: Locale }) {
  const c = legalConfig;
  const isEl = locale === 'el';
  return <>
    <h2>{isEl ? '1. Πεδίο' : '1. Scope'}</h2>
    <p>{isEl
      ? `Οι όροι διέπουν τη χρήση της ιστοσελίδας ${c.identity.tradingName} και την αποστολή αιτήματος στον ${c.identity.providerNameEl}, φυσικό πρόσωπο/ατομικό πάροχο. Δεν αποτελούν από μόνοι τους σύμβαση εκτέλεσης ηλεκτρολογικών εργασιών.`
      : `These terms govern use of the ${c.identity.tradingName} website and submission of an enquiry to ${c.identity.providerNameEn}, a natural person/individual provider. They do not themselves form a contract for electrical work.`}</p>

    <h2>{isEl ? '2. Αιτήματα και ραντεβού' : '2. Enquiries and appointments'}</h2>
    <p>{isEl
      ? 'Η αποστολή φόρμας είναι πρόσκληση για επικοινωνία. Δεν επιβεβαιώνει ραντεβού, επίσκεψη, διαθεσιμότητα, τιμή, προσφορά, αποδοχή εργασίας ή σύμβαση. Ραντεβού ισχύει μόνο αφού επιβεβαιωθεί ρητά με τον πάροχο. Μην χρησιμοποιείτε τη φόρμα για επείγον κίνδυνο.'
      : 'Submitting the form is a request to be contacted. It does not confirm an appointment, visit, availability, price, quotation, acceptance of work, or contract. An appointment exists only after express confirmation with the provider. Do not use the form for an immediate danger.'}</p>

    <h2>{isEl ? '3. Αξιολόγηση, προσφορά και σύμβαση' : '3. Assessment, quotation, and contract'}</h2>
    <p>{isEl
      ? 'Το εύρος, η τεχνική λύση, οι εξαιρέσεις, η τιμή, οι φόροι, τα υλικά, το χρονοδιάγραμμα, η πρόσβαση και οι όροι πληρωμής καθορίζονται μόνο μετά από επαρκή αξιολόγηση και στην πραγματική προσφορά/συμφωνία. Δεν εμφανίζονται τιμές στην ιστοσελίδα. Σύμβαση δημιουργείται μόνο όταν συμφωνηθούν οι ουσιώδεις όροι και υπάρξει σαφής αποδοχή από τα μέρη.'
      : 'Scope, technical solution, exclusions, price, tax, materials, timetable, access, and payment terms are determined only after sufficient assessment and in the actual quotation/agreement. No prices are displayed on this website. A contract arises only when essential terms are agreed and both parties clearly accept.'}</p>
    <p>{isEl
      ? 'Όπου συνάπτεται σύμβαση εξ αποστάσεως ή εκτός εμπορικού καταστήματος, παρέχονται πριν δεσμευτεί ο καταναλωτής οι ειδικές προσυμβατικές πληροφορίες και οδηγίες υπαναχώρησης που απαιτεί η εφαρμοστέα νομοθεσία.'
      : 'Where a contract is concluded at a distance or off premises, the specific pre-contract information and withdrawal instructions required by applicable law are provided before the consumer is bound.'}</p>

    <h2>{isEl ? '4. Υποχρεώσεις πελάτη και ασφάλεια' : '4. Customer responsibilities and safety'}</h2>
    <p>{isEl
      ? 'Παρέχετε ακριβείς πληροφορίες, γνωστοποιείτε γνωστούς κινδύνους και εξασφαλίζετε νόμιμη και ασφαλή πρόσβαση στον χώρο. Μην επιχειρείτε ηλεκτρολογικές εργασίες βάσει γενικού περιεχομένου της ιστοσελίδας. Σε άμεσο κίνδυνο καλέστε τις αρμόδιες υπηρεσίες έκτακτης ανάγκης και μην αγγίζετε εκτεθειμένο ή ύποπτο ηλεκτρολογικό εξοπλισμό.'
      : 'Provide accurate information, disclose known hazards, and ensure lawful, safe access to the property. Do not attempt electrical work based on general website content. In immediate danger, contact the appropriate emergency service and do not touch exposed or suspect electrical equipment.'}</p>

    <h2>{isEl ? '5. Αλλαγές, ακυρώσεις και πληρωμές' : '5. Changes, cancellations, and payment'}</h2>
    <p>{isEl
      ? 'Οι πρακτικοί όροι αλλαγής ή ακύρωσης ραντεβού και οποιαδήποτε προκαταβολή, στάδια πληρωμής ή εγγύηση πρέπει να συμφωνούνται στην πραγματική επιβεβαίωση ή προσφορά. Η ιστοσελίδα δεν εισπράττει πληρωμές και δεν δημοσιεύει πολιτική ακύρωσης ή τιμοκατάλογο.'
      : 'Practical appointment-change or cancellation terms and any deposit, payment stages, or warranty must be agreed in the actual confirmation or quotation. The website takes no payments and publishes no cancellation policy or price list.'}</p>

    <h2>{isEl ? '6. Επιτρεπτή χρήση και περιεχόμενο' : '6. Permitted use and content'}</h2>
    <p>{isEl
      ? 'Χρησιμοποιείτε την ιστοσελίδα νόμιμα και μόνο για πραγματικά αιτήματα. Απαγορεύεται η απόπειρα μη εξουσιοδοτημένης πρόσβασης, η παρεμβολή στη λειτουργία ή στην ασφάλεια, η αυτοματοποιημένη μαζική υποβολή, η αποστολή κακόβουλου υλικού και η χρήση περιεχομένου ή φωτογραφιών έργων ως δικών σας. Εκτός αν αναφέρεται διαφορετικά, το πρωτότυπο περιεχόμενο και οι φωτογραφίες δεν επιτρέπεται να αναπαραχθούν εμπορικά χωρίς άδεια.'
      : 'Use the website lawfully and only for genuine enquiries. Attempted unauthorised access, interference with operation or security, automated bulk submissions, malicious material, and presenting site content or project photographs as your own are prohibited. Unless stated otherwise, original content and photographs may not be reproduced commercially without permission.'}</p>

    <h2>{isEl ? '7. Διαθεσιμότητα ιστοσελίδας και σύνδεσμοι' : '7. Website availability and links'}</h2>
    <p>{isEl
      ? 'Δεν εγγυάται αδιάλειπτη ή χωρίς σφάλματα λειτουργία. Εξωτερικοί σύνδεσμοι παρέχονται για ενημέρωση και δεν σημαίνουν έλεγχο ή έγκριση όλου του περιεχομένου τρίτων.'
      : 'Uninterrupted or error-free operation is not guaranteed. External links are provided for information and do not imply control or endorsement of all third-party content.'}</p>

    <h2>{isEl ? '8. Προσωπικά δεδομένα και ευθύνη' : '8. Personal data and liability'}</h2>
    <p>{isEl
      ? 'Η επεξεργασία της φόρμας περιγράφεται στην Πολιτική Απορρήτου. Τίποτε στους παρόντες όρους δεν περιορίζει ευθύνη ή δικαίωμα που δεν μπορεί νόμιμα να περιοριστεί, συμπεριλαμβανομένων υποχρεωτικών δικαιωμάτων καταναλωτή.'
      : 'Form processing is described in the Privacy Policy. Nothing in these terms limits liability or a right that cannot lawfully be limited, including mandatory consumer rights.'} <a href={`/${locale}/privacy`}>{isEl ? 'Πολιτική Απορρήτου' : 'Privacy Policy'}</a>.</p>

    <h2>{isEl ? '9. Δίκαιο, διαφορές και αλλαγές' : '9. Law, disputes, and changes'}</h2>
    <p>{isEl
      ? 'Εφαρμόζεται το δίκαιο της Κυπριακής Δημοκρατίας. Η συμφωνία αυτή δεν στερεί από καταναλωτή προστασία ή αρμόδιο δικαστήριο που του παρέχει αναγκαστικό δίκαιο. Πριν από δικαστική ενέργεια, τα μέρη ενθαρρύνονται να επιχειρήσουν άμεση καλόπιστη επίλυση. Οι όροι μπορεί να αλλάξουν για μελλοντική χρήση· η έκδοση που ίσχυε όταν στάλθηκε ένα αίτημα παραμένει διαθέσιμη κατόπιν αιτήματος.'
      : 'The law of the Republic of Cyprus applies. This does not deprive a consumer of protection or a competent court granted by mandatory law. Before court action, the parties are encouraged to try direct, good-faith resolution. Terms may change for future use; the version in force when an enquiry was sent can be supplied on request.'}</p>
    <p>{isEl ? 'Επικοινωνία' : 'Contact'}: <a href={`mailto:${c.identity.email}`}>{c.identity.email}</a> · {isEl ? 'Έκδοση' : 'Version'}: {c.policyVersion}</p>
  </>;
}

export function LegalPage({ locale, kind }: { locale: Locale; kind: LegalDocumentKind }) {
  return <PublicPage locale={locale} languagePath={kind}>
    <section className="legal-hero">
      <p className="section-kicker">AP Electrical Services</p>
      <h1>{titles[kind][locale]}</h1>
      <p>{descriptions[kind][locale]}</p>
      <span>{locale === 'el' ? 'Τελευταία ενημέρωση' : 'Last updated'}: {policyDate(locale)}</span>
    </section>
    <article className="legal-content">
      {kind === 'privacy' && <PrivacyPolicy locale={locale} />}
      {kind === 'cookies' && <CookiePolicy locale={locale} />}
      {kind === 'legal' && <LegalNotice locale={locale} />}
      {kind === 'terms' && <Terms locale={locale} />}
    </article>
  </PublicPage>;
}
