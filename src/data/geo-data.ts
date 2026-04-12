/**
 * GEO (Generative Engine Optimization) data models and site audit data
 * for ihaveallergy.com — a physician-led allergy clinic site.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface GeoPage {
  id: string;
  path: string;
  titleHe: string;
  titleEn: string;
  type: 'pillar' | 'guide' | 'satellite' | 'profile' | 'service' | 'landing' | 'legal';
  cluster: string;
  geoScore: number;          // 0-100
  entitySignalScore: number; // 0-100
  answerReadiness: number;   // 0-100
  structureScore: number;    // 0-100
  trustScore: number;        // 0-100
  status: 'optimized' | 'needs-work' | 'critical' | 'draft';
  priority: 'high' | 'medium' | 'low';
  issues: string[];
  opportunities: string[];
  lastAudited: string;
}

export interface EntitySignal {
  id: string;
  entity: string;
  type: 'physician' | 'organization' | 'condition' | 'procedure' | 'location';
  consistency: number;
  pagesPresent: number;
  pagesTotal: number;
  issues: string[];
}

// TopicCluster and SprintTask types moved to geo-sprint4-data.ts and geo-sprint6-data.ts

export interface PageTemplate {
  id: string;
  nameHe: string;
  nameEn: string;
  description: string;
  sections: string[];
  schemaType: string;
  answerFormat: string;
  usedBy: string[];
}

// ── Scoring Weights ────────────────────────────────────────────────────

export const GEO_WEIGHTS = {
  entitySignal: 0.20,
  answerReadiness: 0.25,
  structureClarity: 0.20,
  trustAuthority: 0.20,
  internalLinking: 0.15,
} as const;

export function computeGeoScore(page: Pick<GeoPage, 'entitySignalScore' | 'answerReadiness' | 'structureScore' | 'trustScore'>): number {
  const linking = Math.min(page.structureScore, page.trustScore); // proxy
  return Math.round(
    page.entitySignalScore * GEO_WEIGHTS.entitySignal +
    page.answerReadiness * GEO_WEIGHTS.answerReadiness +
    page.structureScore * GEO_WEIGHTS.structureClarity +
    page.trustScore * GEO_WEIGHTS.trustAuthority +
    linking * GEO_WEIGHTS.internalLinking
  );
}

// ── Site Pages Audit Data ──────────────────────────────────────────────

export const GEO_PAGES: GeoPage[] = [
  {
    id: 'home',
    path: '/',
    titleHe: 'דף הבית',
    titleEn: 'Homepage',
    type: 'landing',
    cluster: 'brand',
    geoScore: 62,
    entitySignalScore: 70,
    answerReadiness: 45,
    structureScore: 65,
    trustScore: 75,
    status: 'needs-work',
    priority: 'high',
    issues: [
      'FAQ section lacks direct one-sentence answers before elaboration',
      'No explicit "What is ihaveallergy.com" answer block',
      'Physician entity not linked to structured author block',
    ],
    opportunities: [
      'Add hero answer block: "מרפאה פרטית לאלרגיה ואימונולוגיה בהוד השרון"',
      'Restructure FAQ with answer-first format',
      'Add "Why choose us" section with citation-ready claims',
    ],
    lastAudited: '2026-04-12',
  },
  {
    id: 'about',
    path: '/about',
    titleHe: 'אודות',
    titleEn: 'About',
    type: 'profile',
    cluster: 'brand',
    geoScore: 55,
    entitySignalScore: 60,
    answerReadiness: 40,
    structureScore: 55,
    trustScore: 70,
    status: 'needs-work',
    priority: 'high',
    issues: [
      'H1 is generic — not entity-focused',
      'No explicit credentials list (board certifications, fellowships)',
      'Missing "About the Doctor" answer snippet at top',
    ],
    opportunities: [
      'Lead with citation-ready bio paragraph',
      'Add structured credentials section',
      'Include "Areas of Expertise" with schema markup',
    ],
    lastAudited: '2026-04-12',
  },
  {
    id: 'dr-anna',
    path: '/dr-anna-brameli',
    titleHe: 'ד״ר אנה ברמלי',
    titleEn: 'Dr. Anna Brameli',
    type: 'profile',
    cluster: 'entity',
    geoScore: 68,
    entitySignalScore: 80,
    answerReadiness: 55,
    structureScore: 70,
    trustScore: 82,
    status: 'needs-work',
    priority: 'high',
    issues: [
      'Raw HTML not unique (SPA shell limitation)',
      'No featured snippet-ready summary paragraph',
      'sameAs links could be expanded',
    ],
    opportunities: [
      'Add "At a Glance" card with key facts',
      'Include publication list / conference appearances',
      'Strengthen sameAs with medical registry links',
    ],
    lastAudited: '2026-04-12',
  },
  {
    id: 'whois',
    path: '/whois',
    titleHe: 'מי זה',
    titleEn: 'Who Is',
    type: 'profile',
    cluster: 'entity',
    geoScore: 58,
    entitySignalScore: 65,
    answerReadiness: 60,
    structureScore: 50,
    trustScore: 65,
    status: 'needs-work',
    priority: 'medium',
    issues: [
      'FAQ answers are too long for AI citation',
      'Missing direct answer format',
    ],
    opportunities: [
      'Shorten FAQ answers to 1-2 sentences + elaboration',
      'Add "Quick Facts" card',
    ],
    lastAudited: '2026-04-12',
  },
  {
    id: 'services',
    path: '/services',
    titleHe: 'שירותים',
    titleEn: 'Services',
    type: 'service',
    cluster: 'brand',
    geoScore: 50,
    entitySignalScore: 45,
    answerReadiness: 35,
    structureScore: 55,
    trustScore: 60,
    status: 'needs-work',
    priority: 'medium',
    issues: [
      'Services not individually addressable',
      'No procedure schema per service',
      'Missing "What to expect" answer blocks',
    ],
    opportunities: [
      'Add MedicalProcedure schema per service',
      'Create answer-first descriptions for each service',
      'Link each service to relevant knowledge articles',
    ],
    lastAudited: '2026-04-12',
  },
  {
    id: 'pillar-allergy',
    path: '/אלרגיה-בילדים-מדריך-מלא',
    titleHe: 'אלרגיה בילדים — מדריך מלא',
    titleEn: 'Children Allergy Complete Guide',
    type: 'pillar',
    cluster: 'children-allergy',
    geoScore: 75,
    entitySignalScore: 72,
    answerReadiness: 70,
    structureScore: 80,
    trustScore: 85,
    status: 'optimized',
    priority: 'medium',
    issues: [
      'Some sections lack direct answer opening',
      'Table of contents could be more granular',
    ],
    opportunities: [
      'Add "Key Takeaway" boxes per section',
      'Include data tables for age-based recommendations',
      'Strengthen internal links to satellite articles',
    ],
    lastAudited: '2026-04-12',
  },
  {
    id: 'guide-first-tastes',
    path: '/guides/טעימות-ראשונות-אלרגנים',
    titleHe: 'טעימות ראשונות — אלרגנים',
    titleEn: 'First Tastes — Allergens Guide',
    type: 'guide',
    cluster: 'food-introduction',
    geoScore: 72,
    entitySignalScore: 68,
    answerReadiness: 65,
    structureScore: 78,
    trustScore: 80,
    status: 'optimized',
    priority: 'low',
    issues: ['Could add age-specific timelines'],
    opportunities: ['Add visual timeline / infographic section'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'guide-rights',
    path: '/guides/זכויות-ילד-אלרגי-ישראל',
    titleHe: 'זכויות ילד אלרגי בישראל',
    titleEn: 'Allergy Child Rights in Israel',
    type: 'guide',
    cluster: 'rights',
    geoScore: 70,
    entitySignalScore: 65,
    answerReadiness: 68,
    structureScore: 75,
    trustScore: 78,
    status: 'optimized',
    priority: 'low',
    issues: ['Legal references could be more specific'],
    opportunities: ['Add law citation numbers', 'Link to official government sources'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'guide-testing',
    path: '/guides/בדיקות-אלרגיה-ילדים-ישראל',
    titleHe: 'בדיקות אלרגיה לילדים בישראל',
    titleEn: 'Allergy Testing for Children in Israel',
    type: 'guide',
    cluster: 'testing',
    geoScore: 71,
    entitySignalScore: 66,
    answerReadiness: 70,
    structureScore: 74,
    trustScore: 78,
    status: 'optimized',
    priority: 'low',
    issues: ['Could benefit from comparison table'],
    opportunities: ['Add test type comparison table', 'Add cost ranges'],
    lastAudited: '2026-04-12',
  },
  // Satellite articles
  ...([
    { id: 'k-rash-bamba', path: '/knowledge/פריחה-אחרי-במבה', titleHe: 'פריחה אחרי במבה', cluster: 'food-introduction' },
    { id: 'k-redness-mouth', path: '/knowledge/אודם-סביב-הפה-אחרי-אלרגן', titleHe: 'אודם סביב הפה', cluster: 'food-introduction' },
    { id: 'k-bamba-4months', path: '/knowledge/במבה-גיל-4-חודשים', titleHe: 'במבה בגיל 4 חודשים', cluster: 'food-introduction' },
    { id: 'k-vomiting-tahini', path: '/knowledge/הקאה-אחרי-טחינה', titleHe: 'הקאה אחרי טחינה', cluster: 'food-introduction' },
    { id: 'k-days-allergens', path: '/knowledge/כמה-ימים-בין-אלרגנים', titleHe: 'כמה ימים בין אלרגנים', cluster: 'food-introduction' },
    { id: 'k-garden-refuse', path: '/knowledge/גן-יכול-לסרב-לילד-אלרגי', titleHe: 'גן מסרב לקבל ילד אלרגי', cluster: 'rights' },
    { id: 'k-epipen', path: '/knowledge/אפיפן-בגן-מי-אחראי', titleHe: 'אפיפן בגן — מי אחראי', cluster: 'rights' },
    { id: 'k-medical-aide', path: '/knowledge/סייעת-רפואית-לילד-אלרגי', titleHe: 'סייעת רפואית לילד אלרגי', cluster: 'rights' },
    { id: 'k-school-trip', path: '/knowledge/טיול-שנתי-ילד-אלרגי', titleHe: 'טיול שנתי — ילד אלרגי', cluster: 'rights' },
    { id: 'k-allergy-cert', path: '/knowledge/אישור-אלרגיה-למשרד-החינוך', titleHe: 'אישור אלרגיה למשרד החינוך', cluster: 'rights' },
    { id: 'k-skin-prick', path: '/knowledge/תבחיני-עור-כואב-לילדים', titleHe: 'תבחיני עור — כואב לילדים?', cluster: 'testing' },
    { id: 'k-blood-test', path: '/knowledge/בדיקת-דם-לאלרגיה-ילדים', titleHe: 'בדיקת דם לאלרגיה', cluster: 'testing' },
    { id: 'k-food-challenge', path: '/knowledge/תגר-מזון-איך-זה-נראה', titleHe: 'תגר מזון — איך זה נראה', cluster: 'testing' },
    { id: 'k-positive-no-symptoms', path: '/knowledge/בדיקה-חיובית-בלי-תסמינים', titleHe: 'בדיקה חיובית בלי תסמינים', cluster: 'testing' },
    { id: 'k-private-vs-public', path: '/knowledge/בדיקות-אלרגיה-פרטי-או-קופה', titleHe: 'פרטי או קופת חולים', cluster: 'testing' },
  ] as const).map(a => ({
    id: a.id,
    path: a.path,
    titleHe: a.titleHe,
    titleEn: a.id.replace('k-', '').replace(/-/g, ' '),
    type: 'satellite' as const,
    cluster: a.cluster,
    geoScore: 55 + Math.floor(Math.random() * 20),
    entitySignalScore: 50 + Math.floor(Math.random() * 25),
    answerReadiness: 45 + Math.floor(Math.random() * 30),
    structureScore: 60 + Math.floor(Math.random() * 20),
    trustScore: 70 + Math.floor(Math.random() * 15),
    status: ('needs-work') as const,
    priority: 'medium' as const,
    issues: [
      'Answer paragraph could be more citation-ready',
      'Missing direct answer in first 50 words',
    ],
    opportunities: [
      'Add TL;DR answer box at top',
      'Strengthen author attribution',
      'Add "Related Questions" section',
    ],
    lastAudited: '2026-04-12',
  })),
];

// Topic clusters moved to geo-sprint4-data.ts (richer model with intent mapping)

// ── Entity Signals ─────────────────────────────────────────────────────

export const ENTITY_SIGNALS: EntitySignal[] = [
  {
    id: 'physician',
    entity: 'ד״ר אנה ברמלי / Dr. Anna Brameli',
    type: 'physician',
    consistency: 72,
    pagesPresent: 18,
    pagesTotal: 28,
    issues: [
      'Name spelling varies across pages (ברמלי vs. Brameli)',
      'Credentials not listed on all medical pages',
      'Missing on 10 satellite articles',
    ],
  },
  {
    id: 'clinic',
    entity: 'ihaveallergy.com — מרפאת אלרגיה',
    type: 'organization',
    consistency: 65,
    pagesPresent: 12,
    pagesTotal: 28,
    issues: [
      'Organization schema only on homepage',
      'No consistent clinic name across pages',
      'Missing LocalBusiness schema on contact page',
    ],
  },
  {
    id: 'location',
    entity: 'הוד השרון, ישראל',
    type: 'location',
    consistency: 55,
    pagesPresent: 8,
    pagesTotal: 28,
    issues: [
      'Location mentioned inconsistently',
      'Missing GeoCoordinates on most pages',
      'Footer city list not schema-linked',
    ],
  },
  {
    id: 'specialty',
    entity: 'אלרגיה ואימונולוגיה קלינית',
    type: 'condition',
    consistency: 80,
    pagesPresent: 24,
    pagesTotal: 28,
    issues: [
      'Specialty phrasing varies (אלרגיה / אלרגולוגיה / אימונולוגיה)',
    ],
  },
];

// ── Page Templates ─────────────────────────────────────────────────────

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'satellite-article',
    nameHe: 'מאמר לווייני',
    nameEn: 'Satellite Article',
    description: 'Answer-first knowledge article linked to a pillar guide. Optimized for AI citation.',
    sections: [
      'TL;DR Answer Box (1-2 sentences)',
      'Full Medical Answer (300-500 words)',
      'When to See a Doctor',
      'What Parents Should Know',
      'Related Questions (FAQ schema)',
      'Author Badge + Medical Disclaimer',
      'Related Articles (3 links)',
      'CTA — WhatsApp consultation',
    ],
    schemaType: 'MedicalWebPage + FAQPage',
    answerFormat: 'Direct answer → Elaboration → Action',
    usedBy: ['/knowledge/*'],
  },
  {
    id: 'pillar-guide',
    nameHe: 'מדריך עמוד (Pillar)',
    nameEn: 'Pillar Guide',
    description: 'Comprehensive 2000+ word guide serving as the hub for a topic cluster.',
    sections: [
      'Hero + Key Takeaway Box',
      'Table of Contents (auto-linked)',
      'Section 1-6 with H2 headers',
      'Key Takeaway Box per section',
      'Data Table / Comparison (if applicable)',
      'FAQ Section (3-5 questions)',
      'Author Badge',
      'Satellite Article Links Grid',
      'Single CTA at bottom',
    ],
    schemaType: 'MedicalWebPage + FAQPage + BreadcrumbList',
    answerFormat: 'Overview → Deep sections → FAQ → Links',
    usedBy: ['/אלרגיה-בילדים-מדריך-מלא', '/guides/*'],
  },
  {
    id: 'physician-profile',
    nameHe: 'פרופיל רופא',
    nameEn: 'Physician Profile',
    description: 'Entity-focused page for E-E-A-T and Knowledge Panel eligibility.',
    sections: [
      'At-a-Glance Card (name, specialty, location, credentials)',
      'Professional Bio (citation-ready, 150 words)',
      'Areas of Expertise',
      'Education & Certifications',
      'Publications & Media',
      'Clinic Information',
      'sameAs Links (external authority)',
    ],
    schemaType: 'Physician + MedicalBusiness',
    answerFormat: 'Structured facts → Bio → Credentials',
    usedBy: ['/dr-anna-brameli', '/about'],
  },
  {
    id: 'service-page',
    nameHe: 'דף שירות',
    nameEn: 'Service Page',
    description: 'Individual medical service with procedure schema and patient-ready information.',
    sections: [
      'Service Name + 1-line Answer',
      'What Is This Procedure?',
      'Who Needs It?',
      'What to Expect',
      'Duration & Preparation',
      'FAQ (2-3 questions)',
      'Booking CTA',
    ],
    schemaType: 'MedicalProcedure + FAQPage',
    answerFormat: 'Definition → Patient guide → FAQ → CTA',
    usedBy: ['/services'],
  },
];

// Sprint tasks moved to geo-sprint6-data.ts (90-day execution planner)