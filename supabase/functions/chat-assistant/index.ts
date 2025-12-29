import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, sanitizeAIOutput, detectPHI, createAuditLog } from "../_shared/security-utils.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "../_shared/rate-limiter.ts";

// Dr. Anna Brameli's clinic knowledge base
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
- אלרגיה למזון, חלב, בוטנים
- אלרגיה לתרופות
- אלרגיה לדבורים ועקיצות חרקים
- אלרגיה עונתית (לאבקנים)
- אורטיקריה (חרלת)
- אסתמה אלרגית
- אנפילקסיס

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
7. **אל תבקש מידע אישי מזהה** - אין לבקש שמות, מספרי זהות, כתובות או מידע רפואי רגיש

## הנחיות אבטחה:
- אם המשתמש מספק מידע אישי מזהה (שם מלא, ת.ז., כתובת, טלפון) - התעלם ממנו והמשך בשיחה כללית
- אל תחזור על מידע אישי שהמשתמש שיתף
- אם מדובר בתסמינים דחופים (קוצר נשימה חמור, נפיחות בפנים/לשון) - הפנה מיידית לחדר מיון
- אם המשתמש שואל על מחירים - הפנה לדף יצירת קשר

אתה לא מחליף ייעוץ רפואי מקצועי, אלא עוזר למשתמשים להבין אם כדאי להם לפנות לאבחון.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const clientId = getClientIdentifier(req);
    const rateLimit = await checkRateLimit(supabase, clientId, 'chat-assistant');
    
    if (!rateLimit.allowed) {
      createAuditLog('chat-assistant', 'rate_limit_exceeded', undefined, { clientId: clientId.substring(0, 20) });
      return createRateLimitResponse(rateLimit.resetIn);
    }

    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Check for PHI in user messages and reject if found
    for (const msg of messages) {
      if (msg.role === 'user' && msg.content) {
        const { hasPHI, types } = detectPHI(msg.content);
        if (hasPHI) {
          createAuditLog('chat-assistant', 'phi_detected_in_input', undefined, { types });
          // Don't reject, but don't process the PHI - let the AI handle it according to its instructions
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    createAuditLog('chat-assistant', 'request', undefined, { messageCount: messages.length });

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
      
      return new Response(
        JSON.stringify({ error: "שגיאה בעיבוד הבקשה" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error("No response from AI:", data);
      return new Response(
        JSON.stringify({ error: "לא התקבלה תשובה מהמערכת" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Sanitize AI output - remove any PHI and add disclaimers
    const { sanitized, hadPHI, hadMedicalAdvice } = sanitizeAIOutput(assistantMessage);
    
    if (hadPHI || hadMedicalAdvice) {
      createAuditLog('chat-assistant', 'output_sanitized', undefined, { hadPHI, hadMedicalAdvice });
    }

    createAuditLog('chat-assistant', 'response_generated');

    return new Response(
      JSON.stringify({ message: sanitized }),
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