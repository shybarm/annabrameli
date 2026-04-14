/**
 * Registry of all public routes that exist in App.tsx.
 * Used by the GEO system to distinguish real pages from draft-only content.
 */
export const KNOWN_PUBLIC_ROUTES: string[] = [
  '/',
  '/about',
  '/services',
  '/updates',
  '/faq',
  '/contact',
  '/privacy',
  '/accessibility',
  '/security',
  '/dr-anna-brameli',
  '/whois',
  '/blog',
  '/guides/טעימות-ראשונות-אלרגנים',
  '/guides/זכויות-ילד-אלרגי-ישראל',
  '/guides/בדיקות-אלרגיה-ילדים-ישראל',
  '/guides/אלרגיה-מדריך-מקיף',
  '/אלרגיה-בילדים-מדריך-מלא',
  '/knowledge/פריחה-אחרי-במבה',
  '/knowledge/אודם-סביב-הפה-אחרי-אלרגן',
  '/knowledge/במבה-גיל-4-חודשים',
  '/knowledge/הקאה-אחרי-טחינה',
  '/knowledge/כמה-ימים-בין-אלרגנים',
  '/knowledge/גן-יכול-לסרב-לילד-אלרגי',
  '/knowledge/אפיפן-בגן-מי-אחראי',
  '/knowledge/סייעת-רפואית-לילד-אלרגי',
  '/knowledge/טיול-שנתי-ילד-אלרגי',
  '/knowledge/אישור-אלרגיה-למשרד-החינוך',
  '/knowledge/תבחיני-עור-כואב-לילדים',
  '/knowledge/בדיקת-דם-לאלרגיה-ילדים',
  '/knowledge/תגר-מזון-איך-זה-נראה',
  '/knowledge/בדיקה-חיובית-בלי-תסמינים',
  '/knowledge/בדיקות-אלרגיה-פרטי-או-קופה',
  '/join-team',
];

/**
 * Check if a given path has a real route in the application.
 */
export function isRouteRegistered(pagePath: string): boolean {
  if (!pagePath) return false;
  const normalised = pagePath.replace(/\/+$/, '') || '/';
  return KNOWN_PUBLIC_ROUTES.includes(normalised);
}
