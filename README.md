# Anna Brameli Allergy

i want to make a prompot for lovable of the promot below so it build me a site with a backend that works, however i dont want it to stay on thier site, when lovable is done i want to download the file and use github and vercl to build it therefor it is important that the app it build can do that. it is critical for me i will add anna cv + her image to the promot

I want you to build a complete, production-ready website for Dr. Anna Brameli, an Allergy and Immunology Specialist.

### Tech Stack & Frameworks
* **Framework:** Next.js 14 (App Router) using TypeScript.
* **Styling:** Tailwind CSS (for modern, minimalist design).
* **Icons:** Lucide-react.
* **Animations:** Framer Motion (subtle, professional animations).
* **Language:** The site must be completely in Hebrew (RTL direction).

### Core Design Requirements
* **Aesthetic:** Medical, minimalistic, trustworthy, and high-end. Use a palette of soft teals, whites, and warm sand colors.
* **Typography:** Use "Heebo" or "Assistant" from Google Fonts.
* **Mobile-First:** The layout must be fully responsive.
* **Navigation:** Sticky header with links: About, Services, Latest Updates, Q&A, Contact.

### SEO Requirements (Critical)
* Implement a `Metadata` configuration for proper SEO titles and descriptions in Hebrew.
* Create a reusable `SchemaMarkup` component that injects JSON-LD for "Physician" and "MedicalWebPage".
* Ensure semantic HTML tags (<article>, <section>, <h1>, etc.) are used correctly.

### Page Structure & Features

1.  **Hero Section:** High-quality background, photo of Dr. Anna (use a placeholder), and a clear value proposition in Hebrew.
2.  **Service Cards:** Grid layout for "Food Allergy", "Asthma", "Skin Conditions", etc.
3.  **"Latest Updates" Section (API Ready):**
    * Create a UI component that displays allergy news cards.
    * For now, use mock data (dummy JSON) representing articles.
    * Write a clear comment/TODO in the code where I should connect the external medical API later.
4.  **The AI Triage Bot (Widget):**
    * Create a floating action button (FAB) in the bottom-right corner.
    * When clicked, it opens a chat window.
    * Build the UI for the chat interface (bubbles, input field).
    * *Note:* I will implement the backend logic later, just build the frontend component and state management for the conversation UI.
5.  **Booking/Contact:** A clean form and a section for clinic details (Map, Phone, Address).

### Specific Content Context
* **Doctor Name:** Dr. Anna Brameli (ד"ר אנה ברמלי).
* **Key Phrase to Target:** "Pediatric and Adult Allergy Specialist".
* **Tone:** Empathetic, professional, authoritative.

Please scaffold the project, install dependencies, and build the initial pages.


1. SEO Metadata for All Pages (Hebrew)

Metadata is optimized for high-intent search queries and structured for rich-snippet eligibility.

Homepage – ד״ר אנה ברמלי | מומחית לאלרגיה ואימונולוגיה

Title: ד״ר אנה ברמלי – מומחית לאלרגיה ואימונולוגיה | אבחון וטיפול בילדים ובמבוגרים
Description: מומחית לאלרגיה ואימונולוגיה עם ניסיון רב באבחון וטיפול באלרגיות בילדים ומבוגרים. קביעת תור מהירה, מידע מקצועי, ומדריכים שיעזרו לכם להבין ולנהל אלרגיות בצורה בטוחה.
Keywords: אלרגיה, רופא אלרגיה, מומחה אלרגיה לילדים, אבחון אלרגיות, אימונולוגיה, טיפול באלרגיה
Schema: Physician, MedicalWebPage, FAQ, BreadcrumbList

עמוד אודות – ד״ר אנה ברמלי

Title: ד״ר אנה ברמלי – רופאה מומחית לאלרגיה ואימונולוגיה
Description: היכרות עם ד״ר אנה ברמלי, רופאה מומחית לאלרגיה ואימונולוגיה בעלת ניסיון קליני רחב. מידע על השכלה, ניסיון מקצועי, והגישה הטיפולית.
Keywords: ד״ר אנה ברמלי, רופאת אלרגיה, אימונולוגית, מומחית אלרגיות

מדריך עדכונים אחרונים – חדשות וסקירות אלרגיה

Title: עדכונים אחרונים באלרגיה – מחקרים, חדשות וסקירות רפואיות
Description: סקירות עדכניות של מחקרים בתחום האלרגיה והאימונולוגיה, מסוכמות בשפה פשוטה וברורה להורים ולמטופלים.
Keywords: חדשות אלרגיה, מחקרים אלרגיה, עדכונים רפואיים, אלרגיות ילדים

AI עוזר אלרגיה – כלי אבחון ראשוני

Title: העוזר הדיגיטלי לאלרגיה – שאלון קצר וקבלת המלצה
Description: כלי עזר חדשני לבדיקת תסמינים ראשונית. ענו על מספר שאלות קצרות וקבלו המלצה האם לפנות לרופא מומחה.
Keywords: בוט אלרגיה, בדיקת אלרגיה אונליין, שאלון אלרגיות

דפי מצבים רפואיים – Conditions Pages

Below are SEO metadata for all existing + additional allergy types.

אלרגיה למזון

Title: אלרגיה למזון – סימפטומים, אבחון וטיפול
Description: מדריך מקיף לאלרגיה למזון בילדים ומבוגרים: תסמינים, גורמים, בדיקות וטיפול. מתי חייבים לפנות לרופא?
Keywords: אלרגיה למזון, אלרגיה לבוטנים, אנפילקסיס, אלרגיות ילדים

אלרגיה לחלב

Title: אלרגיה לחלב – כל מה שהורים צריכים לדעת
Description: סקירה פשוטה וברורה על אלרגיה לחלב: תסמינים, אבחון והתמודדות יומיומית.
Keywords: אלרגיה לחלב, תינוקות אלרגיה לחלבון חלב

אלרגיה לבוטנים

Title: אלרגיה לבוטנים – תסמינים וטיפול מונע
Description: הסבר מלא על אלרגיה לבוטנים, גורמי סיכון, התאמה תזונתית, וטיפול בהתראה מוקדמת.
Keywords: אלרגיה לבוטנים, אנפילקסיס בוטנים

אלרגיה לתרופות

Title: אלרגיה לתרופות – איך מזהים ומתי להיבדק?
Description: מידע ברור על תגובות אלרגיות לתרופות: סוגי תגובה, תסמינים שכיחים, בדיקות אלרגיה ואפשרויות טיפול.
Keywords: אלרגיה לתרופות, רגישות לפניצילין, תגובה אלרגית לתרופה

אלרגיה לדבורים ועקיצות חרקים

Title: אלרגיה לדבורים – תסמינים מסכני חיים ואפשרויות טיפול
Description: מדריך להורים על אלרגיה לדבורים וחרקים עוקצים: סימנים ראשוניים, עזרה ראשונה, טיפול מונע ואבחון.
Keywords: אלרגיה לדבורים, תגובה אנפילקטית, עקיצת דבורה

אלרגיה לאבקנים

Title: אלרגיה לאבקנים – אלרגיות עונתיות וסימפטומים
Description: מידע על אלרגיות עונתיות: נזלת, עיטושים, גירוי עיניים וטיפול תרופתי מתקדם.
Keywords: אלרגיה לאבקנים, קדחת השחת, אלרגיות עונתיות

אורטיקריה (חרלת)

Title: אורטיקריה – פריחה אלרגית חריפה וכרונית
Description: כל מה שצריך לדעת על חרלת: גורמים, אבחון, טיפול והבדלה מאלרגיות אחרות.
Keywords: אורטיקריה, חרלת, פריחה אלרגית

אסתמה אלרגית

Title: אסתמה אלרגית – אבחון וטיפול בילדים ומבוגרים
Description: הסבר בהיר על אסתמה שמקורה באלרגיות: תסמינים, בדיקות תפקודי ריאות וטיפול מתקדם.
Keywords: אסתמה אלרגית, קשיי נשימה, אלרגיה בדרכי הנשימה

אנפילקסיס – מצב חירום אלרגי

Title: אנפילקסיס – איך מזהים ומתי לקרוא לעזרה
Description: מדריך חובה להורים על תגובה אנפילקטית: תסמינים מסכני חיים, טיפול מיידי ומשאפי אדרנלין.
Keywords: אנפילקסיס, תגובה אלרגית חמורה, אדרנלין

בדיקות אלרגיה לילדים

Title: בדיקות אלרגיה לילדים – איך מתבצע האבחון?
Description: מידע על בדיקות דקירה, בדיקות דם, ובדיקות תגר בשיטה בטוחה ומותאמת לילדים.
Keywords: בדיקות אלרגיה, אבחון אלרגיה ילדים


1. דף הבית – Home Page
כותרת ראשית (Hero):
ד״ר אנה ברמלי – מומחית לאלרגיה ואימונולוגיה
 אבחון וטיפול לילדים ולמבוגרים, בגישה מקצועית, רגישה ומבוססת ידע רפואי עדכני.
כפתורי פעולה:
קביעת תור


שאל את העוזר הדיגיטלי


מידע להורים על אלרגיות



מדוע לבחור בד״ר אנה ברמלי?
ד״ר אנה ברמלי היא רופאה מומחית לאלרגיה ואימונולוגיה, בעלת ניסיון רב בליווי מטופלים במצבים חריפים וכרוניים.
 הגישה הטיפולית משלבת מקצועיות רפואית ללא פשרות, זמינות גבוהה ושפה פשוטה שמאפשרת להורים להבין את התמונה המלאה.
✔ אבחון מדויק ורגיש לילדים
 ✔ טיפול מותאם אישית
 ✔ ניסיון במגוון רחב של סוגי אלרגיות
 ✔ תורים מהירים וקשר ישיר עם הרופאה

העוזר הדיגיטלי לאלרגיה – האם כדאי לפנות לבדיקה?
ענו על כמה שאלות קצרות ותוכלו לקבל כיוון ראשוני — האם מדובר באלרגיה, מה כדאי לבדוק, והאם מומלץ לקבוע תור.
הכלי אינו תחליף לאבחון רפואי, אלא לסיוע ראשוני בלבד.
 → התחילו את השאלון

שירותים ואבחונים
אבחון אלרגיות לילדים


בדיקות עור (Skin Tests)


בדיקות דם לאלרגיות


בדיקות תגר מזון / תרופות


טיפול באסתמה אלרגית


טיפול באורטיקריה כרונית


טיפול באלרגיות מסכנות חיים (אנפילקסיס)


→ לכל המצבים והטיפולים

עדכונים אחרונים באלרגיה
ריכוז מאמרים חדשים בעולם האלרגיה, מסוכמים בשפה ברורה להורים.
 המידע מתעדכן אוטומטית ושומר אתכם בחזית הידע.
→ לעדכונים האחרונים

קריאה לפעולה – CTA תחתון:
מרגישים שהילד מגיב למזון, עקיצה או תרופה?
 אל תחכו – קבעו תור לאבחון מקצועי.

🟦 2. עמוד אודות – About
ד״ר אנה ברמלי – מומחית לאלרגיה ואימונולוגיה
ד״ר ברמלי היא רופאה בכירה לאלרגיה ואימונולוגיה, בעלת ניסיון של שנים באבחון, טיפול ומניעה של מגוון רחב של אלרגיות בילדים ובמבוגרים. עבודתה משלבת מחקר קליני, גישה אנושית והבנה עמוקה של מערכת החיסון.
השכלה והתמחות
בוגרת לימודי רפואה MD


התמחות ברפואת ילדים


תת־התמחות באלרגיה ואימונולוגיה


ניסיון בבתי חולים מובילים


השתתפות במחקרים קליניים בתחום האלרגיות וניהולן


הגישה המקצועית
טיפול באלרגיה מתחיל בהקשבה. כל מטופל מביא איתו סיפור רפואי אחר, ולכן האבחון והטיפול מותאמים אישית בהתאם לתסמינים, ההיסטוריה והצרכים של המשפחה.
קביעת תור
נשמח לעזור — פנו אלינו לקביעת תור לאבחון מקצועי.

🟦 3. העוזר הדיגיטלי לאלרגיה – AI Assistant Page
בדיקה ראשונית קצרה – האם מדובר באלרגיה?
העוזר הדיגיטלי ישאל כמה שאלות פשוטות, ויעזור לכם להבין:
האם התסמינים מתאימים לאלרגיה?


מה כדאי לבדוק?


האם מומלץ לקבוע תור דחוף או רגיל?


הכלי אינו מהווה ייעוץ רפואי ואינו מחליף בדיקה מקצועית.
→ התחלת השאלון

🟦 4. עדכונים אחרונים באלרגיה – Updates
עדכונים אחרונים וחידושים בעולם האלרגיה
מדענים ורופאים חוקרים מדי שנה אלרגיות חדשות, טיפולים מתקדמים ושיטות אבחון משופרות. בדף זה תמצאו תקצירים ברורים, אמינים ונגישים לכל הורה.
כל מאמר כולל:
תאריך פרסום


מקור רפואי מוסמך


תקציר בשפה פשוטה


המלצות פרקטיות


→ לכל העדכונים

🟦 5. ספריית מידע – דפי אלרגיות (כל הדפים הבאים)
הטקסטים בנויים בצורה אחידה לנוחות האתר ו־SEO.

אלרגיה למזון
מהי אלרגיה למזון?
אלרגיה למזון היא תגובה של מערכת החיסון לרכיב במזון הנחשב לגוף כ“איום”. התגובה יכולה להופיע בדקות או שעות לאחר האכילה.
תסמינים נפוצים:
פריחה, נפיחות, גרד


הקאות או כאבי בטן


קוצר נשימה


ירידת לחץ דם (במצבים קשים)


איך מאבחנים?
בדיקות עור, בדיקות דם ובדיקות תגר מבוקרות.
טיפול:
הימנעות מהמזון, תכנון תזונתי, ולעיתים טיפול מונע.
→ קביעת תור לאבחון

אלרגיה לחלב
מהי אלרגיה לחלב?
תגובה חיסונית לחלבון חלב, נפוצה בעיקר בתינוקות וילדים צעירים.
תסמינים:
שלשולים, פריחה, כאבי בטן, ולעיתים קוצר נשימה.
טיפול:
הימנעות מוחלטת מחלב ומוצריו, מעקב תזונתי, בדיקות תקופתיות.

אלרגיה לבוטנים
מידע כללי:
אלרגיה משמעותית שעלולה לגרום לתגובה חמורה. דורשת התנהלות קפדנית.
תסמינים:
נפיחות, הקאות, שיעול, ירידת לחץ דם.
טיפול:
הימנעות מוחלטת + נשיאת מזרק אדרנלין לפי הצורך.

אלרגיה לתרופות
מהי אלרגיה לתרופה?
תגובה אלרגית המופיעה לאחר מתן תרופה מסוימת, לעיתים גם לאחר שנים של שימוש.
תסמינים אפשריים:
פריחה או שלפוחיות


נפיחות בפנים


קוצר נשימה


חום


תגובה אנפילקטית


אבחון:
כולל תשאול מדויק, בדיקות דם, ולעיתים תגר תרופתי מבוקר.

אלרגיה לדבורים ועקיצות חרקים
מה חשוב לדעת?
אלרגיה לעקיצת דבורה או צרעה יכולה להיות קלה — או מסכנת חיים.
תסמינים:
נפיחות משמעותית


גרד מפושט


סחרחורת


קשיי נשימה


טיפול:
אדרנלין במקרים חמורים


טיפול מונע (אימונותרפיה)



אלרגיה לאבקנים (אלרגיות עונתיות)
מהי אלרגיה לאבקנים?
תגובה עונתית לחלקיקי צמחים באוויר.
תסמינים:
עיטושים, נזלת, גירוי עיניים, שיעול.
טיפול:
תרופות אנטי־היסטמיניות, תרסיסים, ולעיתים חיסונים.

אורטיקריה (חרלת)
תיאור מצב:
פריחה אלרגית המתבטאת בגירוד חזק ונפיחות מקומית.
סוגים:
חרלת חריפה


חרלת כרונית



אסתמה אלרגית
מהי אסתמה אלרגית?
מצב בו דרכי הנשימה מגיבות לגירוי אלרגני.
תסמינים:
צפצופים, שיעול, קוצר נשימה, התקפים חוזרים.

אנפילקסיס – תגובה אלרגית מסכנת חיים
תסמינים:
ירידת לחץ דם, קוצר נשימה, נפיחות בלשון או בפנים.
התמודדות:
הזרקת אדרנלין + פינוי למיון.

בדיקות אלרגיה לילדים
איך מתבצע האבחון?
בדיקות עור, בדיקות דם, בדיקות תגר — כולן מבוצעות באופן בטוח ומותאם לילדים.
מתי כדאי להיבדק?
כאשר יש תסמינים חוזרים לאחר אכילה, עקיצה או חשיפה לאבקנים.

🟦 6. עמוד קביעת תור – Contact
קביעת תור לד״ר אנה ...


1. FAQ ארוך ומלא לכל מצב רפואי

אלרגיה למזון – FAQ
האם אלרגיה למזון יכולה להופיע בפתאומיות?
כן. גם אם הילד אכל מזון מסוים בעבר ללא תגובה, אלרגיה יכולה להתפתח בהמשך החיים. מערכת החיסון משתנה, ולעיתים החשיפה דווקא מחזקת את הרגישות.
איך אדע אם מדובר בהרעלה ולא באלרגיה?
אלרגיה מופיעה לרוב תוך דקות ועד שעתיים מחשיפה, ומלווה בפריחה, נפיחות, גרד או קוצר נשימה.
 הרעלה כוללת לרוב חום, כאבי בטן והקאות ממושכות — ומתחילה רק אחרי שעות.
האם אלרגיה למזון יכולה לעבור עם הזמן?
כן — חלק מאלרגיות, בעיקר לחלב, ביצים וחיטה, עשויות לחלוף עם הגדילה. אלרגיות לבוטנים, אגוזים ודגים לרוב נשארות לאורך שנים.
מה לעשות במקרה של תגובה ראשונית?
להפסיק מיד את האכילה, לתעד תמונות של הפריחה או הנפיחות, ולהתייעץ עם מומחה לאלרגיות.
האם צריך להחזיק מזרק אדרנלין בבית?
רק לאחר הנחיה מרופא. במצבים מסכני חיים — זו תרופת החירום הראשונה.

אלרגיה לחלב – FAQ
איך מבדילים בין אלרגיה לחלב לבין אי־סבילות ללקטוז?
אלרגיה מערבת מערכת חיסון — עם פריחה, נפיחות או קשיי נשימה.
 אי־סבילות ללקטוז גורמת בעיקר לגזים ושלשולים.
האם ניתן להחליף פורמולה לתינוק אלרגי?
כן — קיימות פורמולות מפורקות או צמחיות. המערכת החיסונית אינה מגיבה לחלבון שעבר פירוק.
האם ילד אלרגי לחלב יכול לצרוך מוצרי חלב אפויים?
בחלק מהמקרים זה אפשרי, אך רק לאחר בדיקה מסודרת במרפאת אלרגיה.

אלרגיה לבוטנים – FAQ
מה ההבדל בין אלרגיה לבוטנים לבין אלרגיה לאגוזים?
בוטנים אינם אגוזים — ולכן התגובה שונה. אך מי שאלרגי לבוטנים עלול להיות רגיש גם לאגוזים אחרים.
האם יש טיפול שמפחית את האלרגיה?
במקרים מסוימים ניתן לבצע טיפול חשיפה מבוקר במרפאה מיוחדת.
האם הילדים חייבים לשאת אדרנלין?
אם מדובר באלרגיה מוכחת — כן. זה מציל חיים.

אלרגיה לתרופות – FAQ
האם רגישות לפניצילין פירושה שאסור לקחת את כל משפחת האנטיביוטיקות?
לא. לרוב יש תרופות חלופיות בטוחות לחלוטין — והרופא יתאים אותן למטופל.
איך מאבחנים אלרגיה לתרופות?
באמצעות בדיקות עור, בדיקות דם, או תגר תרופתי במרפאה — תחת השגחה מלאה.
האם ניתן לבטל “אלרגיה” לתרופה שנרשמה לפני שנים?
בוודאי. פעמים רבות אלרגיה שאובחנה בילדות אינה קיימת בבגרות.

אלרגיה לדבורים ולעקיצות חרקים – FAQ
האם כל נפיחות אחרי עקיצה היא אלרגיה?
לא. נפיחות מקומית גדולה היא תגובה נפוצה ולא מעידה בהכרח על אלרגיה מסכנת חיים.
מתי העקיצה מסוכנת?
כאשר מופיעים:
קוצר נשימה


סחרחורת


נפיחות בפנים


ירידת לחץ דם


האם יש טיפול שמעלים את האלרגיה?
כן — טיפול חיסוני (אימונותרפיה) שמפחית את הסיכון לתגובה חמורה.

אלרגיה לאבקנים – FAQ
למה האלרגיה מופיעה רק בעונות מסוימות?
בגלל ריכוז גבוה של אבקנים של צמחים באוויר — לרוב באביב ובסתיו.
האם מסכות עוזרות?
כן — מסכה איכותית מפחיתה משמעותית חשיפה לאבקנים.
האם טיפול תרופתי ממושך מסוכן?
לא. מרבית תרופות האלרגיה בטוחות ונמצאות בשימוש שנים רבות.

אורטיקריה (חרלת) – FAQ
האם אורטיקריה היא אלרגיה?
לא תמיד. ברוב המקרים זו תגובה של העור שאינה קשורה לאלרגיה אמיתית.
מה מעורר חרלת?
לחץ נפשי, מזון מסוים, חום/קור, זיהומים ותרופות — תלוי בסוג.
האם זה עובר מעצמו?
ברוב המקרים כן. מצבים כרוניים דורשים מעקב וטיפול מתאים.

אסתמה אלרגית – FAQ
האם ילד עם אלרגיה נמצא בסיכון מוגבר לאסתמה?
כן — יש קשר ברור בין אלרגיות לבין הופעת אסתמה בילדים.
מה ההבדל בין אסתמה “רגילה” לאסתמה אלרגית?
אסתמה אלרגית מופעלת על ידי חשיפה לאבקנים, פרוות בעלי חיים, מזון מסוים ועוד.
האם הטיפול מרפא אסתמה?
לא, אך ניתן לשלוט היטב בתסמינים ולהפחית התקפים.

אנפילקסיס – FAQ
איך יודעים שמדובר באנפילקסיס ולא רק אלרגיה רגילה?
אנפילקסיס כולל לפחות שניים מהבאים:
קוצר נשימה


נפיחות לשון/שפתיים


פריחה מפושטת


ירידת לחץ דם


האם לתת אדרנלין גם אם לא בטוחים?
כן. עיכוב במתן אדרנלין מסוכן הרבה יותר ממתן שלא לצורך.

בדיקות אלרגיה לילדים – FAQ
האם הבדיקה כואבת?
בדיקות עור מציקות מעט אך אינן כואבות. ילדים מתמודדים איתן היטב.
מתי נכון לבצע בדיקות?
כאשר יש תגובות חוזרות: פריחה, שיעול, נפיחות או בעיות נשימה לאחר חשיפה.
האם אפשר לאבחן אלרגיה מגיל צעיר?
כן — חלק מהבדיקות מתאימות כבר מגיל מספר חודשים.

🟦 2. קופי ממוקד להורים מודאגים (פסיכולוגיית UX)

בלוק 1 – “אתם לא לבד”
כשילד מראה סימני אלרגיה — זה טבעי להרגיש לחץ. התגובות יכולות להיות מבלבלות ומהירות, והחשש מפני אירוע נוסף מלווה כמעט כל הורה.
 המטרה שלנו היא לעזור לכם להבין מה באמת קורה, ולהחזיר אליכם את תחושת השליטה.

בלוק 2 – “מתי צריך לדאוג?”
רוב התגובות האלרגיות — גם כשהן מרשימות — אינן מסכנות חיים.
 התפקיד שלנו הוא לזהות נכון את סוג האלרגיה, להבין את רמת הסיכון, ובמידת הצורך לבנות יחד תוכנית שמגנה על הילד באופן מלא.

בלוק 3 – “אבחון מקצועי מונע הפתעות”
אלרגיה שאינה מאובחנת היטב עלולה לגרום לבלבול, הימנעויות מיותרות או טיפול חסר.
 אבחון מדויק מאפשר:
 ✔ להבין מהו הטריגר האמיתי
 ✔ להימנע ממצבים מסוכנים
 ✔ לתת לילד חיים רגילים ובטוחים

בלוק 4 – “רגע לפני שאתם נכנסים ללחץ…”
ברוב המקרים — אפשר להרגיע את התסמינים, למנוע החמרה ולהמשיך בשגרה.
 אנחנו כאן כדי לעבור איתכם שלב-שלב, בקצב שמתאים לכם ולילד.

בלוק 5 – CTA רגוע ומניע לפעולה
החשש שלכם מובן וטבעי — ודווקא בגלל זה חשוב לבדוק את הדברים בצורה מסודרת.
 פגישה קצרה עם מומחית אלרגיה יכולה לשנות מהיסוד את הביטחון וההתנהלות היומיומית בבית.
→ לקביעת תור לאבחון מקצועי


TECH STACK
- Framework: Next.js 14 with App Router and TypeScript.
- Styling: Tailwind CSS (set up and configured).
- Icons: lucide-react.
- Animations: framer-motion (gentle, professional).
- Fonts: Google Fonts "Heebo" or "Assistant".
- Direction: Entire UI in Hebrew, RTL (html dir="rtl", appropriate Tailwind/Next setup).

GLOBAL DESIGN & UX
- Aesthetic: Medical, minimalistic, trustworthy, high-end.
- Color palette: soft teals, whites and warm sand tones.
- Mobile-first, fully responsive layout.
- Sticky header with navigation links (in Hebrew) that scroll or route to:
  - אודות (About)
  - שירותים (Services)
  - עדכונים אחרונים (Latest Updates)
  - שאלות ותשובות (Q&A)
  - יצירת קשר (Contact)
- Footer with clinic info and a short legal/medical disclaimer.

SEO & SCHEMA (CRITICAL)
- Implement proper Next.js `Metadata` for each main route with Hebrew titles and descriptions for:
  - Home
  - About
  - Services / Conditions
  - Latest Updates
  - Q&A
  - Contact
- Create a reusable React component `<SchemaMarkup />` that injects JSON-LD using `<script type="application/ld+json">` for:
  - `"@type": "Physician"`
  - `"@type": "MedicalWebPage"`
- Use semantic HTML (`<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`, correct `<h1>`–`<h3>` levels).

CONTENT CONTEXT (USE THIS IN STRUCTURE & COPY PLACEHOLDERS)
- Doctor: Dr. Anna Brameli (ד"ר אנה ברמלי), Allergy and Immunology Specialist.
- Key phrase to reflect in Hebrew copy: “מומחית לאלרגיה בילדים ובמבוגרים”.
- Tone: Empathetic, professional, authoritative, aimed at worried parents.
- Assume I already have full Hebrew copy for:
  - Homepage sections (hero, why choose, services, latest updates teaser, CTA).
  - About page (education, subspecialty in Allergy & Immunology, philosophy of care).
  - Detailed condition pages/sections for:
    - אלרגיה למזון
    - אלרגיה לחלב
    - אלרגיה לבוטנים
    - אלרגיה לתרופות
    - אלרגיה לדבורים ועקיצות חרקים
    - אלרגיה לאבקנים (אלרגיות עונתיות)
    - אורטיקריה (חרלת)
    - אסתמה אלרגית
    - אנפילקסיס
    - בדיקות אלרגיה לילדים
  - Long FAQ blocks for each of the above conditions.
- IMPORTANT: For all text content, create clear placeholders or short sample Hebrew sentences and comments like:
  `// TODO: insert full Hebrew FAQ for אלרגיה למזון here`.

PAGE & COMPONENT STRUCTURE

1) Root Layout & Global Setup
- Configure RTL direction and Hebrew `lang` attribute.
- Configure Tailwind and a base layout with max-width container, background colors, and typography.
- Load Google Font (Heebo or Assistant) globally.

2) Home Page (`app/page.tsx`)
Sections (all headings and visible text in Hebrew, RTL):
- Hero section:
  - Placeholder doctor photo (e.g. rounded card with image).
  - Main headline with ד"ר אנה ברמלי and mention “מומחית לאלרגיה ואימונולוגיה”.
  - Subheadline about “מומחית לאלרגיה בילדים ובמבוגרים”.
  - Primary CTA button: “קביעת תור”.
  - Secondary CTA button: “שאל את העוזר הדיגיטלי”.
  - Use framer-motion for subtle fade/slide-in.
- Services/Conditions grid:
  - Responsive cards (Tailwind grid) for:
    - אלרגיה למזון
    - אסתמה אלרגית
    - מצבי עור ואלרגיה (e.g. אורטיקריה)
    - אלרגיה לתרופות
    - אלרגיה לדבורים
    - אלרגיה לאבקנים
  - Each card: icon from lucide-react, short Hebrew description, and link or button.
- “Latest Updates in Allergy” section:
  - Use a reusable `<UpdatesList />` component (see below).
- “Why parents choose ד"ר אנה ברמלי” section:
  - 3–4 bullet points for trust, expertise, and child-friendly approach.
- CTA band near bottom:
  - Calm, reassuring text in Hebrew and a “קביעת תור” button.

3) Services / Conditions Page (or section)
- Page or route showing cards or sections for each medical condition, with links to dedicated sub-sections or anchored sections.
- Use `<article>` elements per condition with:
  - Heading (Hebrew condition name).
  - Short intro paragraph.
  - Placeholder where full medical explanation will be inserted.
  - Placeholder for FAQ list (use `<details>` / `<summary>` or a custom accordion component).

4) Latest Updates (API-Ready Component)
- Create a reusable component, e.g. `components/updates/UpdatesList.tsx`.
- Use mock JSON array (title, date, source, short summary in Hebrew).
- Render as cards with:
  - Title
  - Date
  - Short summary
- Add a clear `// TODO: Replace mock data with external medical API integration` comment and keep data loading isolated for easy future wiring.
- Optionally, expose a dedicated route: `/updates`.

5) Q&A / FAQ Page
- Render grouped FAQ accordions per condition (אלרגיה למזון, אלרגיה לתרופות, אלרגיה לדבורים, וכו').
- Use a reusable `FAQItem` or `FAQAccordion` component with:
  - Question (Hebrew)
  - Answer (Hebrew)
- Use placeholde...

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://annabrameli.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/83cf0b11-e11c-4b78-8a48-bb87f2a52db3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
