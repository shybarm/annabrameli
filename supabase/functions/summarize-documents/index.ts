import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documents, patientName } = await req.json();
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: "No documents provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build document list for the AI
    const documentList = documents.map((doc: any, index: number) => 
      `${index + 1}. ${doc.title} (סוג: ${getDocumentTypeHebrew(doc.document_type)}, תאריך: ${new Date(doc.created_at).toLocaleDateString('he-IL')})`
    ).join('\n');

    const systemPrompt = `אתה עוזר רפואי מקצועי. תפקידך לסכם את רשימת המסמכים של המטופל בצורה ברורה ותמציתית בעברית.
עליך:
1. לזהות סוגי המסמכים השונים (הפניות, בדיקות מעבדה, צילומים, הסכמות וכו')
2. לסכם את מספר המסמכים לפי קטגוריה
3. לציין תאריכים חשובים אם רלוונטי
4. להציע המלצות לרופא לגבי מה כדאי לבדוק או לשים לב

הסיכום צריך להיות:
- ברור ומקצועי
- בעברית תקינה
- ממוקד במידע הרלוונטי לרופא`;

    const userPrompt = `${patientName ? `מטופל: ${patientName}\n\n` : ''}רשימת מסמכים:\n${documentList}\n\nאנא ספק סיכום של המסמכים הזמינים עבור המטופל.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "לא ניתן היה ליצור סיכום";

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in summarize-documents:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getDocumentTypeHebrew(type: string): string {
  const typeMap: Record<string, string> = {
    'id': 'תעודת זהות',
    'referral': 'הפניה',
    'lab_result': 'בדיקת מעבדה',
    'imaging': 'צילום/הדמיה',
    'consent': 'טופס הסכמה',
    'insurance': 'ביטוח',
    'other': 'אחר',
  };
  return typeMap[type] || type;
}
