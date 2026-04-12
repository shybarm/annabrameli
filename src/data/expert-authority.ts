/**
 * Expert Authority data for Dr. Anna Brameli.
 * Structured for entity trust, GEO citation readiness, and topic-level research mapping.
 * Sources: Vanderbilt VUMC profile, PubMed, IJMS.
 */

export interface ExpertCredential {
  type: 'affiliation' | 'license' | 'certification' | 'membership';
  label: string;
  institution: string;
  detail?: string;
}

export interface Publication {
  id: string;
  title: string;
  titleHe: string;
  journal: string;
  year: number;
  authors: string;
  doi?: string;
  pubmedId?: string;
  url: string;
  topicRelevance: string;
  topicRelevanceHe: string;
  relatedPages: { path: string; label: string }[];
  whyItMatters: string;
  whyItMattersHe: string;
}

export interface TrainingRecord {
  period: string;
  role: string;
  institution: string;
  institutionEn: string;
  country: 'IL' | 'US';
}

export const EXPERT_PROFILE = {
  name: 'Dr. Anna Brameli',
  nameHe: 'ד״ר אנה ברמלי',
  title: 'Allergy & Immunology Specialist | Pediatrician',
  titleHe: 'מומחית לאלרגיה ואימונולוגיה | רופאת ילדים',
  affiliations: [
    {
      type: 'affiliation' as const,
      label: 'Clinical Fellow',
      institution: 'Vanderbilt University Medical Center',
      detail: 'Division of Allergy, Pulmonary and Critical Care Medicine',
    },
    {
      type: 'affiliation' as const,
      label: 'התמחות ברפואת ילדים',
      institution: 'מרכז שניידר לרפואת ילדים',
      detail: 'פתח תקווה, ישראל',
    },
  ] satisfies ExpertCredential[],

  credentials: [
    { type: 'license' as const, label: 'רישיון רפואה ישראלי', institution: 'משרד הבריאות', detail: '132226' },
    { type: 'certification' as const, label: 'ECFMG Certification', institution: 'ECFMG', detail: '0-829-897-8' },
    { type: 'certification' as const, label: 'מומחית ברפואת ילדים', institution: 'משרד הבריאות', },
  ] satisfies ExpertCredential[],

  training: [
    { period: '2024-2025', role: 'תת-התמחות במחלות זיהומיות ילדים', institution: 'Vanderbilt University Medical Center', institutionEn: 'Vanderbilt University Medical Center', country: 'US' as const },
    { period: '2022-2024', role: 'תת-התמחות באלרגיה ואימונולוגיה', institution: 'Vanderbilt University Medical Center', institutionEn: 'Vanderbilt University Medical Center', country: 'US' as const },
    { period: '2020-2022', role: 'רופאה בכירה במכון לאלרגיה ואימונולוגיה קלינית', institution: 'מרכז שניידר לרפואת ילדים', institutionEn: 'Schneider Children\'s Medical Center', country: 'IL' as const },
    { period: '2015-2020', role: 'התמחות ברפואת ילדים', institution: 'מרכז שניידר לרפואת ילדים', institutionEn: 'Schneider Children\'s Medical Center', country: 'IL' as const },
    { period: '2006-2013', role: 'M.D.', institution: 'אוניברסיטת בן גוריון בנגב', institutionEn: 'Ben-Gurion University of the Negev', country: 'IL' as const },
  ] satisfies TrainingRecord[],

  vanderbiltProfileUrl: 'https://medicine.vumc.org/department-directory/Anna-Brameli',
};

export const PUBLICATIONS: Publication[] = [
  {
    id: 'inpatient-consults-2024',
    title: 'Evolving Patterns in Inpatient Pediatric Consultations to Allergy/Immunology at an Academic Medical Center',
    titleHe: 'מגמות מתפתחות בייעוץ אלרגיה/אימונולוגיה למחלקות ילדים במרכז רפואי אקדמי',
    journal: 'International Journal of Medical Students (IJMS)',
    year: 2024,
    authors: 'Wurst M, Brameli A, Krantz M, Peebles RS Jr, Khan Y, Stone CA Jr',
    doi: '10.5195/ijms.2024.2541',
    url: 'https://ijms.pitt.edu/IJMS/article/view/2541',
    topicRelevance: 'Patterns of inpatient pediatric allergy consultations - drug allergy, food allergy, and immunodeficiency evaluation',
    topicRelevanceHe: 'דפוסי ייעוץ אלרגיה לילדים מאושפזים - אלרגיה לתרופות, אלרגיה למזון, והערכת כשל חיסוני',
    relatedPages: [
      { path: '/services', label: 'שירותי אבחון אלרגיה' },
      { path: '/אלרגיה-בילדים-מדריך-מלא', label: 'מדריך אלרגיה בילדים' },
      { path: '/allergy-testing', label: 'בדיקות אלרגיה' },
    ],
    whyItMatters: 'Demonstrates direct clinical experience with the full spectrum of pediatric allergy consultations, from drug reactions to food allergy and immunodeficiency.',
    whyItMattersHe: 'מעיד על ניסיון קליני ישיר עם כל מגוון הייעוצים באלרגיה בילדים - מתגובות לתרופות, דרך אלרגיות מזון ועד הערכת מצבי כשל חיסוני.',
  },
  {
    id: 'cephalosporin-survey-2024',
    title: 'Evaluation of Cephalosporin Allergy: Survey of Drug Allergy Experts',
    titleHe: 'הערכת אלרגיה לצפלוספורינים: סקר בקרב מומחי אלרגיה לתרופות',
    journal: 'The Journal of Allergy and Clinical Immunology: In Practice',
    year: 2024,
    authors: 'Brameli A, Stone CA Jr, et al.',
    pubmedId: '39624180',
    url: 'https://pubmed.ncbi.nlm.nih.gov/39624180/',
    topicRelevance: 'Cephalosporin allergy evaluation practices among drug allergy experts, post-2022 DAPP guidelines',
    topicRelevanceHe: 'פרקטיקות הערכת אלרגיה לצפלוספורינים בקרב מומחים, בעקבות הנחיות 2022',
    relatedPages: [
      { path: '/services', label: 'אבחון אלרגיה לתרופות' },
      { path: '/faq', label: 'שאלות על אלרגיה לתרופות' },
    ],
    whyItMatters: 'Positions Dr. Brameli at the forefront of drug allergy evaluation research, contributing to expert consensus on safe antibiotic prescribing for patients with suspected allergy.',
    whyItMattersHe: 'ממקם את ד״ר ברמלי בחזית המחקר בהערכת אלרגיה לתרופות, עם תרומה לקונצנזוס מומחים בנושא מתן אנטיביוטיקה בטוחה למטופלים עם חשד לאלרגיה.',
  },
];

/**
 * Mapping: which publications reinforce which site page topics.
 * Used by the GEO system to show research-backed trust signals per page.
 */
export const RESEARCH_PAGE_MAP: Record<string, {
  publicationIds: string[];
  trustStatement: string;
}> = {
  '/services': {
    publicationIds: ['inpatient-consults-2024', 'cephalosporin-survey-2024'],
    trustStatement: 'השירותים בקליניקה מבוססים על ניסיון קליני ומחקרי ממרכזים רפואיים מובילים, כולל Vanderbilt University Medical Center.',
  },
  '/אלרגיה-בילדים-מדריך-מלא': {
    publicationIds: ['inpatient-consults-2024'],
    trustStatement: 'תוכן מדריך זה מבוסס על ניסיון בייעוץ אלרגיה בילדים מאושפזים ועל מחקר שפורסם בכתב עת רפואי בינלאומי.',
  },
  '/allergy-testing': {
    publicationIds: ['inpatient-consults-2024', 'cephalosporin-survey-2024'],
    trustStatement: 'גישת האבחון בקליניקה משלבת ידע מחקרי עדכני בהערכת אלרגיה למזון ולתרופות.',
  },
  '/faq': {
    publicationIds: ['cephalosporin-survey-2024'],
    trustStatement: 'התשובות בעמוד זה מבוססות על ניסיון קליני ומחקר בהערכת אלרגיה לתרופות.',
  },
};
