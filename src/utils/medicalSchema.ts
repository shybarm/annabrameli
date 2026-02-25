/**
 * Shared JSON-LD schema builders for MedicalWebPage structured data.
 * Ensures consistent YMYL trust signals across all blog articles, guides, and knowledge pages.
 */

interface MedicalPageSchemaInput {
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  canonicalUrl: string;
  /** Optional "about" block for the MedicalCondition / MedicalProcedure */
  about?: Record<string, unknown>;
}

const PUBLISHER = {
  "@type": "Organization" as const,
  "@id": "https://ihaveallergy.com/#organization",
  name: "ihaveallergy.com",
  url: "https://ihaveallergy.com",
  logo: {
    "@type": "ImageObject" as const,
    url: "https://ihaveallergy.com/og-logo.png",
    width: 512,
    height: 512,
  },
};

const AUTHOR = {
  "@type": "Physician" as const,
  name: "ד״ר אנה ברמלי",
  alternateName: "Dr. Anna Brameli",
  medicalSpecialty: ["Allergy and Immunology", "Pediatrics"],
  url: "https://ihaveallergy.com/about",
};

export function buildMedicalPageSchema(input: MedicalPageSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": input.canonicalUrl,
    url: input.canonicalUrl,
    headline: input.headline,
    name: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    inLanguage: "he-IL",
    isPartOf: { "@id": "https://ihaveallergy.com/#website" },
    author: AUTHOR,
    publisher: PUBLISHER,
    specialty: "Allergy and Immunology",
    audience: { "@type": "MedicalAudience", audienceType: "Patient" },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.canonicalUrl,
    },
    ...(input.about ? { about: input.about } : {}),
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; item?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      name: entry.name,
      ...(entry.item ? { item: entry.item } : {}),
    })),
  };
}

export function buildFaqSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
