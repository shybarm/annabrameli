import { Helmet } from "react-helmet-async";

interface SchemaMarkupProps {
  type?: "physician" | "medicalWebPage";
}

export const SchemaMarkup = ({ type = "physician" }: SchemaMarkupProps) => {
  const physicianSchema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: "ד״ר אנה ברמלי",
    alternateName: "Dr. Anna Brameli",
    description: "מומחית לאלרגיה ואימונולוגיה עם ניסיון רב באבחון וטיפול באלרגיות בילדים ומבוגרים",
    medicalSpecialty: ["Allergy and Immunology", "Pediatrics"],
    availableService: [
      {
        "@type": "MedicalProcedure",
        name: "אבחון אלרגיות",
      },
      {
        "@type": "MedicalProcedure",
        name: "בדיקות עור",
      },
      {
        "@type": "MedicalProcedure",
        name: "טיפול באסתמה אלרגית",
      },
    ],
    telephone: "+972-54-580-8008",
    address: {
      "@type": "PostalAddress",
      streetAddress: "טבס 3",
      addressLocality: "הוד השרון",
      addressCountry: "IL",
    },
    image: "/dr-anna-brameli.jpeg",
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
