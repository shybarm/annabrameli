import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Dr. Anna Brameli's clinic knowledge base - comprehensive allergy and immunology information
const CLINIC_KNOWLEDGE = `
# ד״ר אנה ברמלי - מרפאה לאלרגיה ואימונולוגיה

## אודות הרופאה
ד״ר אנה ברמלי היא רופאה מומחית באלרגיה ואימונולוגיה קלינית, עם ניסיון עשיר באבחון וטיפול באלרגיות בכל הגילאים, בדגש מיוחד על ילדים ותינוקות.

## שירותי אבחון
1. **בדיקות עור (Skin Prick Tests)** - בדיקות דקירה לאבחון מהיר של רגישויות אלרגיות
2. **בדיקות דם לאלרגיות** - בדיקות IgE ספציפיות לזיהוי אלרגנים
3. **בדיקות תגר מזון** - בדיקות מבוקרות במרפאה לאישוש או שלילת אלרגיה
4. **בדיקות תגר תרופות** - בדיקות מבוקרות לאישוש או שלילת אלרגיה לתרופות
5. **אבחון אלרגיות לילדים** - בדיקות מותאמות לגילאי תינוקות וילדים צעירים
6. **בדיקות תפקודי ריאות** - אבחון והערכת אסתמה ומחלות נשימה אלרגיות

## מצבים רפואיים שמטופלים במרפאה

### אלרגיה למזון
- תגובה של מערכת החיסון לרכיב במזון
- תסמינים: פריחה, נפיחות, גרד, הקאות, כאבי בטן, קוצר נשימה
- טיפול: הימנעות מהמזון, תכנון תזונתי, טיפול מונע

### אלרגיה לחלב
- נפוצה בעיקר בתינוקות וילדים צעירים
- חשוב להבדיל בין אלרגיה לחלב לבין אי-סבילות ללקטוז
- תסמינים: שלשולים, פריחה, כאבי בטן, קוצר נשימה במקרים חמורים

### אלרגיה לבוטנים
- אלרגיה משמעותית שעלולה לגרום לתגובה חמורה
- דורשת התנהלות קפדנית ומודעות גבוהה
- טיפול: הימנעות מוחלטת + נשיאת מזרק אדרנלין

### אלרגיה לתרופות
- תגובה אלרגית לאחר מתן תרופה מסוימת
- תסמינים: פריחה, שלפוחיות, נפיחות בפנים, קוצר נשימה, חום
- אבחון: תשאול, בדיקות דם, תגר תרופתי מבוקר

### אלרגיה לדבורים ועקיצות חרקים
- יכולה להיות קלה או מסכנת חיים
- טיפול: אדרנלין במקרים חמורים, אימונותרפיה

### אלרגיה עונתית (לאבקנים)
- תגובה עונתית לחלקיקי צמחים באוויר
- תסמינים: עיטושים, נזלת, גירוי עיניים, שיעול
- טיפול: אנטי-היסטמינים, תרסיסים, חיסונים

### אורטיקריה (חרלת)
- פריחה אלרגית עם גירוד חזק ונפיחות
- יכולה להיות חריפה או כרונית
- טיפול: אבחון הגורם, טיפול תרופתי

### אסתמה אלרגית
- דרכי הנשימה מגיבות לגירוי אלרגני
- תסמינים: צפצופים, שיעול, קוצר נשימה
- טיפול תרופתי לשליטה ומניעת התקפים

### אנפילקסיס
- תגובה אלרגית מסכנת חיים
- תסמינים: ירידת לחץ דם, קוצר נשימה, נפיחות, אובדן הכרה
- טיפול: הזרקת אדרנלין מיידית

## מתי כדאי להיבדק?
- תגובות חוזרות של פריחה, שיעול, נפיחות
- בעיות נשימה לאחר חשיפה למזון, תרופה או עקיצה
- תסמינים עונתיים חוזרים
- חשד לאלרגיה בילד או תינוק

## קביעת תור
לקביעת תור לאבחון, ניתן לפנות דרך דף יצירת הקשר באתר או להתקשר למרפאה.
`;

const SYSTEM_PROMPT = `אתה עוזר דיגיטלי חכם של ד״ר אנה ברמלי, רופאה מומחית באלרגיה ואימונולוגיה.

${CLINIC_KNOWLEDGE}

## כללי התנהגות:
1. **תמיד דבר בעברית** בצורה חמה, מקצועית ואמפתית
2. **שאל 2-3 שאלות ממוקדות** להבנת המצב (סוג התסמינים, מתי הם מופיעים, באיזו תדירות)
3. **לאחר הבנת המצב**, הסבר בקצרה מה יכול לגרום לתסמינים
4. **תמיד הוביל לקריאה לפעולה** - קביעת תור לאבחון מקצועי עם ד״ר ברמלי
5. **אל תאבחן** - רק תן מידע כללי והכווין לבדיקה מקצועית
6. **היה קצר וממוקד** - תשובות של 2-4 משפטים לכל היותר

## מבנה השיחה:
1. שאל על התסמין העיקרי (מה מציק?)
2. שאל על הזמן והנסיבות (מתי זה קורה? האם יש גורם מעורר?)
3. שאל על תדירות וחומרה (כמה פעמים זה קורה? מה עוזר?)
4. הסבר בקצרה מה יכולות להיות הסיבות
5. המלץ בחום לקבוע תור לאבחון מקצועי

## דוגמאות לשאלות:
- "מה בדיוק הסימפטומים שאתם חווים?"
- "האם שמתם לב מתי זה קורה? לאחר אכילה? בעונה מסוימת?"
- "כמה זמן נמשכים התסמינים?"
- "האם יש תרופות או מזונות שאחריהם התסמינים מחמירים?"

## הנחיות נוספות:
- אם מדובר בתסמינים דחופים (קוצר נשימה חמור, נפיחות בפנים/לשון) - הפנה מיידית לחדר מיון
- אם המשתמש שואל על מחירים - הפנה לדף יצירת קשר
- תמיד סיים בהצעה לקביעת תור

אתה לא מחליף ייעוץ רפואי מקצועי, אלא עוזר למשתמשים להבין אם כדאי להם לפנות לאבחון.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing chat request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "המערכת עמוסה כרגע. אנא נסו שוב בעוד מספר שניות." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "שגיאת מערכת. אנא נסו שוב מאוחר יותר." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "שגיאה בעיבוד הבקשה" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error("No response from AI:", data);
      return new Response(
        JSON.stringify({ error: "לא התקבלה תשובה מהמערכת" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully generated response");

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "שגיאה לא צפויה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
