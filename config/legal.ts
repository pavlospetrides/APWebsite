/**
 * Single source of truth for verified facts rendered on the public legal pages.
 * Unresolved owner/legal/deployment work belongs in LEGAL-COMPLIANCE-CHECKLIST.md.
 */
export const legalConfig = {
  policyVersion: '2026-08-31',
  identity: {
    tradingName: 'AP Electrical Services',
    legalForm: 'individual service provider',
    providerNameEl: 'Άντης Πετρίδης',
    providerNameEn: 'Antis Petrides',
    professionalTitleEl: 'Εργολήπτης Ηλεκτρικών Εγκαταστάσεων',
    professionalTitleEn: 'Electrical Installations Contractor',
    memberState: 'Republic of Cyprus',
    experienceYears: 25,
    phone: '+357 96 680304',
    email: 'pavlospetrides741@gmail.com',
    serviceAreaEl: 'Παγκύπρια',
    serviceAreaEn: 'Cyprus-wide',
    establishmentLocalityEl: 'Κάτω Πολεμίδια, Λεμεσός, Κύπρος',
    establishmentLocalityEn: 'Kato Polemidia, Limassol, Cyprus',
    competentAuthorityDepartmentEl: 'Τμήμα Ηλεκτρομηχανολογικών Υπηρεσιών (Τ.ΗΜΥ)',
    competentAuthorityDepartmentEn: 'Department of Electrical and Mechanical Services (EMS)',
    competentAuthorityMinistryEl: 'Υπουργείο Μεταφορών, Επικοινωνιών και Έργων',
    competentAuthorityMinistryEn: 'Ministry of Transport, Communications and Works',
  },
  privacy: {
    privacyContactEmail: 'pavlospetrides741@gmail.com',
  },
  infrastructure: {
    applicationHost: 'Vercel',
    edgeInfrastructure: 'Vercel Edge Network / CDN',
    databaseAndAuthentication: 'Supabase',
    productionDomain: 'https://apetrides.com',
  },
  features: {
    analytics: false,
    advertising: false,
    marketingMessages: false,
    publicAccounts: false,
    automatedDecisionMaking: false,
    publicNonEssentialStorage: false,
  },
  contacts: {
    cyprusAuthorityName: 'Office of the Commissioner for Personal Data Protection',
    cyprusAuthorityNameEl: 'Γραφείο Επιτρόπου Προστασίας Δεδομένων Προσωπικού Χαρακτήρα',
    cyprusAuthorityEmail: 'commissioner@dataprotection.gov.cy',
    cyprusAuthorityPhone: '+357 22 818456',
    cyprusAuthorityAddress: 'Kypranoros 15, 1061 Nicosia, Cyprus',
    cyprusAuthorityUrl: 'https://www.dataprotection.gov.cy/',
  },
  sources: {
    gdpr: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
    cyprusCookies: 'https://www.gov.cy/dataprotection/documents/cookies/',
    cyprusEcommerceLaw:
      'https://cylaw.org/nomoi/enop/non-ind/2004_1_156/division-ddb446f2e4-4121-425b-b740-151f2e17c54e.html',
    electricianRequirements:
      'https://www.businessincyprus.gov.cy/business-sectors/electrical-services-professionals/',
  },
} as const;

export type LegalDocumentKind = 'privacy' | 'cookies' | 'legal' | 'terms';
