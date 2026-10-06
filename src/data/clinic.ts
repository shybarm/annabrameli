/** Clinic details confirmed by the owner on 2026-09-30 and 2026-10-06.
 * Reception hours are not appointment availability.
 */
export const CLINIC = {
  name: "מרפאת ד״ר אנה ברמלי",
  street: "הטווס 5",
  city: "הוד השרון",
  address: "הטווס 5, הוד השרון",
  phone: "052-591-6393",
  phoneE164: "+972525916393",
  hoursLabel: "ראשון, שני וחמישי, 16:30–21:00",
  accessLabel: "כניסה ושירותים נגישים; חניה זמינה",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("הטווס 5 הוד השרון"),
  mapsEmbedUrl: "https://www.google.com/maps?q=" + encodeURIComponent("הטווס 5 הוד השרון") + "&output=embed",
} as const;

export const CLINIC_SERVICES = [
  "ייעוץ לכל סוגי האלרגיה",
  "תבחיני עור",
  "בדיקות תפקודי ריאות",
  "תגרי מזון",
  "תגרי תרופות",
  "טיפול חיסוני לאלרגיה",
  "הפחתת רגישות למזון — אימונותרפיה פומית (OIT)",
] as const;

export const CLINIC_SERVICES_TEXT = CLINIC_SERVICES.join("; ") + ". הבדיקות והטיפול מותאמים לאחר הערכה רפואית ובתיאום מראש.";
export const CLINIC_POSTAL_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: CLINIC.street,
  addressLocality: CLINIC.city,
  addressCountry: "IL",
};
export const CLINIC_OPENING_HOURS = [{
  "@type": "OpeningHoursSpecification",
  dayOfWeek: ["https://schema.org/Sunday", "https://schema.org/Monday", "https://schema.org/Thursday"],
  opens: "16:30",
  closes: "21:00",
}];
