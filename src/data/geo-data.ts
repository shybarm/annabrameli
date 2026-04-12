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

export interface TopicCluster {
  id: string;
  nameHe: string;
  nameEn: string;
  pillarPath: string;
  satellites: string[];
  completeness: number;  // 0-100
  missingTopics: string[];
  color: string;
}

export interface EntitySignal {
  id: string;
  entity: string;
  type: 'physician' | 'organization' | 'condition' | 'procedure' | 'location';
  consistency: number; // 0-100
  pagesPresent: number;
  pagesTotal: number;
  issues: string[];
}

export interface SprintTask {
  id: string;
  title: string;
  description: string;
  pagePath: string;
  category: 'entity' | 'structure' | 'content' | 'schema' | 'linking' | 'answer-format';
  effort: 'small' | 'medium' | 'large';
  impact: 'high' | 'medium' | 'low';
  sprint: number;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
}

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

// ── Topic Clusters ─────────────────────────────────────────────────────

export const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    id: 'children-allergy',
    nameHe: 'אלרגיה בילדים',
    nameEn: 'Children Allergy',
    pillarPath: '/אלרגיה-בילדים-מדריך-מלא',
    satellites: ['/guides/טעימות-ראשונות-אלרגנים'],
    completeness: 75,
    missingTopics: ['אלרגיה לחלב — מדריך הורים', 'אלרגיה לביצה — מה עושים', 'אנפילקסיס בילדים — סימנים ותגובה'],
    color: 'hsl(205, 50%, 60%)',
  },
  {
    id: 'food-introduction',
    nameHe: 'החשפה למזונות אלרגניים',
    nameEn: 'Food Introduction',
    pillarPath: '/guides/טעימות-ראשונות-אלרגנים',
    satellites: [
      '/knowledge/פריחה-אחרי-במבה',
      '/knowledge/אודם-סביב-הפה-אחרי-אלרגן',
      '/knowledge/במבה-גיל-4-חודשים',
      '/knowledge/הקאה-אחרי-טחינה',
      '/knowledge/כמה-ימים-בין-אלרגנים',
    ],
    completeness: 85,
    missingTopics: ['אלרגנים נסתרים במזון תעשייתי', 'תזמון החשפה — לוח עדכני 2026'],
    color: 'hsl(140, 40%, 55%)',
  },
  {
    id: 'rights',
    nameHe: 'זכויות ילד אלרגי',
    nameEn: 'Allergy Child Rights',
    pillarPath: '/guides/זכויות-ילד-אלרגי-ישראל',
    satellites: [
      '/knowledge/גן-יכול-לסרב-לילד-אלרגי',
      '/knowledge/אפיפן-בגן-מי-אחראי',
      '/knowledge/סייעת-רפואית-לילד-אלרגי',
      '/knowledge/טיול-שנתי-ילד-אלרגי',
      '/knowledge/אישור-אלרגיה-למשרד-החינוך',
    ],
    completeness: 90,
    missingTopics: ['ביטוח בריאות וכיסוי אלרגיה'],
    color: 'hsl(330, 30%, 58%)',
  },
  {
    id: 'testing',
    nameHe: 'בדיקות אלרגיה',
    nameEn: 'Allergy Testing',
    pillarPath: '/guides/בדיקות-אלרגיה-ילדים-ישראל',
    satellites: [
      '/knowledge/תבחיני-עור-כואב-לילדים',
      '/knowledge/בדיקת-דם-לאלרגיה-ילדים',
      '/knowledge/תגר-מזון-איך-זה-נראה',
      '/knowledge/בדיקה-חיובית-בלי-תסמינים',
      '/knowledge/בדיקות-אלרגיה-פרטי-או-קופה',
    ],
    completeness: 88,
    missingTopics: ['בדיקות אלרגיה חדשות 2026', 'Component Resolved Diagnostics (CRD)'],
    color: 'hsl(45, 60%, 55%)',
  },
  {
    id: 'entity',
    nameHe: 'ישות רפואית',
    nameEn: 'Medical Entity',
    pillarPath: '/dr-anna-brameli',
    satellites: ['/whois', '/about'],
    completeness: 60,
    missingTopics: ['דף פרסומים מקצועיים', 'דף מדיה והופעות'],
    color: 'hsl(270, 35%, 60%)',
  },
];

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

// ── Sprint Tasks ───────────────────────────────────────────────────────

export const SPRINT_TASKS: SprintTask[] = [
  // Sprint 1 — Entity & Authority Foundation
  {
    id: 's1-1', title: 'Add citation-ready bio to /dr-anna-brameli', description: 'Write a 150-word professional bio paragraph that AI systems can directly quote.', pagePath: '/dr-anna-brameli', category: 'entity', effort: 'small', impact: 'high', sprint: 1, status: 'todo',
  },
  {
    id: 's1-2', title: 'Add At-a-Glance card to /dr-anna-brameli', description: 'Structured card: Name, Specialty, Board Cert, Location, Languages.', pagePath: '/dr-anna-brameli', category: 'entity', effort: 'small', impact: 'high', sprint: 1, status: 'todo',
  },
  {
    id: 's1-3', title: 'Standardize physician name across all pages', description: 'Ensure ד״ר אנה ברמלי / Dr. Anna Brameli is consistent everywhere.', pagePath: '*', category: 'entity', effort: 'medium', impact: 'high', sprint: 1, status: 'todo',
  },
  {
    id: 's1-4', title: 'Expand sameAs in Physician schema', description: 'Add medical registry, LinkedIn, and health portal links.', pagePath: '/dr-anna-brameli', category: 'schema', effort: 'small', impact: 'medium', sprint: 1, status: 'todo',
  },
  {
    id: 's1-5', title: 'Add author credentials to About page', description: 'List board certifications, fellowships, and institutional affiliations.', pagePath: '/about', category: 'entity', effort: 'small', impact: 'high', sprint: 1, status: 'todo',
  },
  // Sprint 2 — Answer Formatting
  {
    id: 's2-1', title: 'Add TL;DR answer boxes to all satellite articles', description: 'Add a highlighted 1-2 sentence answer at the top of each /knowledge/* page.', pagePath: '/knowledge/*', category: 'answer-format', effort: 'large', impact: 'high', sprint: 2, status: 'todo',
  },
  {
    id: 's2-2', title: 'Reformat homepage FAQ to answer-first', description: 'Each FAQ answer should start with a direct 1-sentence answer.', pagePath: '/', category: 'answer-format', effort: 'medium', impact: 'high', sprint: 2, status: 'todo',
  },
  {
    id: 's2-3', title: 'Add Key Takeaway boxes to pillar guide', description: 'Add highlighted summary boxes after each major section.', pagePath: '/אלרגיה-בילדים-מדריך-מלא', category: 'content', effort: 'medium', impact: 'medium', sprint: 2, status: 'todo',
  },
  {
    id: 's2-4', title: 'Add "Related Questions" to satellite articles', description: 'Add 2-3 related questions with FAQPage schema at the bottom.', pagePath: '/knowledge/*', category: 'schema', effort: 'large', impact: 'medium', sprint: 2, status: 'todo',
  },
  // Sprint 3 — Structure & Linking
  {
    id: 's3-1', title: 'Add MedicalProcedure schema to /services', description: 'Wrap each service in proper MedicalProcedure structured data.', pagePath: '/services', category: 'schema', effort: 'medium', impact: 'medium', sprint: 3, status: 'todo',
  },
  {
    id: 's3-2', title: 'Create missing satellite: אלרגיה לחלב — מדריך הורים', description: 'New article for the children-allergy cluster.', pagePath: '/knowledge/אלרגיה-לחלב-מדריך-הורים', category: 'content', effort: 'large', impact: 'high', sprint: 3, status: 'todo',
  },
  {
    id: 's3-3', title: 'Create missing satellite: אלרגיה לביצה — מה עושים', description: 'New article for the children-allergy cluster.', pagePath: '/knowledge/אלרגיה-לביצה', category: 'content', effort: 'large', impact: 'high', sprint: 3, status: 'todo',
  },
  {
    id: 's3-4', title: 'Strengthen internal links in pillar guide', description: 'Ensure every satellite article is linked from the pillar page with anchor text.', pagePath: '/אלרגיה-בילדים-מדריך-מלא', category: 'linking', effort: 'small', impact: 'medium', sprint: 3, status: 'todo',
  },
  {
    id: 's3-5', title: 'Add LocalBusiness schema to /contact', description: 'Structured data with address, phone, hours, geo coordinates.', pagePath: '/contact', category: 'schema', effort: 'small', impact: 'medium', sprint: 3, status: 'todo',
  },
  // Sprint 4 — Gap Closing
  {
    id: 's4-1', title: 'Create publications page', description: 'New page listing professional publications and conference talks for entity authority.', pagePath: '/publications', category: 'entity', effort: 'medium', impact: 'high', sprint: 4, status: 'todo',
  },
  {
    id: 's4-2', title: 'Add comparison table to testing guide', description: 'Table comparing skin prick, blood test, and food challenge.', pagePath: '/guides/בדיקות-אלרגיה-ילדים-ישראל', category: 'content', effort: 'medium', impact: 'medium', sprint: 4, status: 'todo',
  },
  {
    id: 's4-3', title: 'Create anaphylaxis emergency guide', description: 'High-impact missing content: אנפילקסיס בילדים — סימנים ותגובה.', pagePath: '/knowledge/אנפילקסיס-בילדים', category: 'content', effort: 'large', impact: 'high', sprint: 4, status: 'todo',
  },
];
