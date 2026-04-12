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
    logo: "https://ihaveallergy.com/og-logo.png",
    image: "https://ihaveallergy.com/og-logo.png",
    telephone: "054-580-8008",
    email: "info@drbrameli.co.il",
    address: {
      "@type": "PostalAddress",
      addressLocality: "הוד השרון",
      postalCode: "4501303",
      addressCountry: "IL",
    },
    sameAs: [],
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
