import { Helmet } from "react-helmet-async";

interface SchemaMarkupProps {
  type?: "physician" | "medicalWebPage";
}

export const SchemaMarkup = ({ type = "physician" }: SchemaMarkupProps) => {
  const physicianSchema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": "ד״ר אנה ברמלי - מומחית לאלרגיה ואימונולוגיה",
    "image": "https://annabrameli.lovable.app/og-logo.png",
    "@id": "https://ihaveallergy.com",
    "url": "https://ihaveallergy.com",
    "telephone": "054-580-8008",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "טבס 3",
      "addressLocality": "הוד השרון",
      "postalCode": "4501303",
      "addressCountry": "IL",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 32.1524,
      "longitude": 34.8947,
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

  const schema = type === "physician" ? physicianSchema : medicalWebPageSchema;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
