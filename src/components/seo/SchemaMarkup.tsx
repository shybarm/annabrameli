import { Helmet } from "react-helmet-async";

interface SchemaMarkupProps {
  type?: "physician" | "medicalWebPage" | "contactPage";
}

export const SchemaMarkup = ({ type = "physician" }: SchemaMarkupProps) => {
  const physicianSchema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": "ד״ר אנה ברמלי - מומחית לאלרגיה ואימונולוגיה",
    "image": "https://ihaveallergy.com/og-logo.png?v=6",
    "@id": "https://ihaveallergy.com/dr-anna-brameli#physician",
    "url": "https://ihaveallergy.com",
    "telephone": "+972-52-591-6393",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "הוד השרון",
      "addressCountry": "IL",

    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
        "opens": "08:00",
        "closes": "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Friday",
        "opens": "08:00",
        "closes": "13:00",
      },
    ],
    "medicalSpecialty": "AllergyAndImmunology",
    "knowsLanguage": ["he", "en"],
    "sameAs": [
      "https://medicine.vumc.org/department-directory/Anna-Brameli",
      "https://www.schneider.org.il/?ArticleID=2506&CategoryID=839",
      "https://orcid.org/0009-0005-6489-6525",
      "https://pubmed.ncbi.nlm.nih.gov/?term=Brameli+A",
    ],
    "worksFor": {
      "@type": "MedicalOrganization",
      "name": "Schneider Children's Medical Center of Israel",
      "url": "https://www.schneider.org.il/",
    },
    "description": "מומחית לאלרגיה ואימונולוגיה לילדים ומבוגרים בהוד השרון. אבחון וטיפול באלרגיות למזון, אסתמה, ואלרגיה לתרופות.",
  };

  const medicalWebPageSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "ד״ר אנה ברמלי | מומחית לאלרגיה ואימונולוגיה",
    description: "אתר רשמי של ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה",
    mainEntity: {
      "@type": "Physician",
      name: "ד״ר אנה ברמלי",
    },
    specialty: "Allergy and Immunology",
    audience: {
      "@type": "MedicalAudience",
      audienceType: "Patient",
    },
  };

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "יצירת קשר וקביעת תור | ד״ר אנה ברמלי",
    description: "קביעת תור במרפאת אלרגיה של ד״ר אנה ברמלי בהוד השרון.",
    url: "https://ihaveallergy.com/contact",
    mainEntity: {
      "@type": "Physician",
      name: "ד״ר אנה ברמלי",
      address: {
        "@type": "PostalAddress",
        addressLocality: "הוד השרון",
        addressCountry: "IL",
      },

    },
  };

  const schemas: Record<string, object> = {
    physician: physicianSchema,
    medicalWebPage: medicalWebPageSchema,
    contactPage: contactPageSchema,
  };

  const schema = schemas[type] || physicianSchema;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
