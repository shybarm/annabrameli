import { CLINIC_POSTAL_ADDRESS, CLINIC_OPENING_HOURS } from "@/data/clinic";
import { Helmet } from "react-helmet-async";

/**
 * Organization + WebSite schema injected once site-wide.
 * Helps Google understand the entity behind the site and enables sitelinks search.
 */
export const SiteWideSchema = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "@id": "https://ihaveallergy.com/#organization",
    name: "ד״ר אנה ברמלי – מומחית לאלרגיה ואימונולוגיה",
    url: "https://ihaveallergy.com",
    logo: "https://ihaveallergy.com/og-logo.png?v=6",
    image: "https://ihaveallergy.com/og-logo.png?v=6",
    email: "info@drbrameli.co.il",
    telephone: "+972-52-591-6393",
    address: CLINIC_POSTAL_ADDRESS,
    openingHoursSpecification: CLINIC_OPENING_HOURS,
    // External institute and author profiles describe the physician, not this clinic.
    employee: {
      "@type": "Physician",
      "@id": "https://ihaveallergy.com/dr-anna-brameli#physician",
      name: "ד״ר אנה ברמלי",
    },
    medicalSpecialty: "AllergyAndImmunology",
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://ihaveallergy.com/#website",
    url: "https://ihaveallergy.com",
    name: "iHaveAllergy – ד״ר אנה ברמלי",
    publisher: { "@id": "https://ihaveallergy.com/#organization" },
    inLanguage: "he-IL",
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(webSiteSchema)}</script>
    </Helmet>
  );
};
