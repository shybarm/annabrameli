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
    address: {
      "@type": "PostalAddress",
      addressLocality: "הוד השרון",
      addressCountry: "IL",
    },

    sameAs: [
      "https://www.schneider.org.il/?ArticleID=2506&CategoryID=839",
      "https://medicine.vumc.org/department-directory/Anna-Brameli",
      "https://orcid.org/0009-0005-6489-6525",
      "https://pubmed.ncbi.nlm.nih.gov/?term=Brameli+A",
    ],
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
