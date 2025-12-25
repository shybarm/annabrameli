import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOCUMENT_CATEGORIES = [
  "בדיקת דם",
  "בדיקת שתן",
  "בדיקת מעבדה",
  "MRI",
  "CT",
  "רנטגן",
  "אולטרסאונד",
  "אק\"ג",
  "הפניה רפואית",
  "מכתב שחרור",
  "סיכום ביקור",
  "מרשם תרופות",
  "אישור מחלה",
  "טופס הסכמה",
  "תעודת זהות",
  "אישור ביטוח",
  "דוח פתולוגי",
  "תוצאות ביופסיה",
  "בדיקת ראייה",
  "בדיקת שמיעה",
  "אחר"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, filePath, mimeType, title } = await req.json();
    
    if (!documentId || !filePath) {
      return new Response(
        JSON.stringify({ error: "Missing documentId or filePath" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Tagging document: ${title} (${documentId})`);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('patient-documents')
      .download(filePath);

    if (downloadError) {
      console.error(`Error downloading document:`, downloadError);
      throw new Error("Failed to download document");
    }

    // Convert file to base64
    const base64Content = await blobToBase64(fileData);
    
    // Determine content type for AI request
    let contentForAI: any[];
    
    if (mimeType?.startsWith('image/') || mimeType === 'application/pdf') {
      contentForAI = [
        {
          type: "text",
          text: `נתח את המסמך הרפואי הזה וקבע אילו קטגוריות מתאימות לו מתוך הרשימה הבאה:
${DOCUMENT_CATEGORIES.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

החזר רק את שמות הקטגוריות המתאימות (1-3 קטגוריות), מופרדות בפסיקים.
לדוגמה: "בדיקת דם, בדיקת מעבדה"

אם לא ניתן לזהות את סוג המסמך, החזר "אחר".`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Content}`
          }
        }
      ];
    } else {
      // For non-image files, use title and metadata to guess category
      contentForAI = [
        {
          type: "text",
          text: `בהתבסס על שם הקובץ וסוג הקובץ, קבע אילו קטגוריות מתאימות למסמך רפואי זה:

שם הקובץ: ${title}
סוג קובץ: ${mimeType}

קטגוריות אפשריות:
${DOCUMENT_CATEGORIES.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

החזר רק את שמות הקטגוריות המתאימות (1-3 קטגוריות), מופרדות בפסיקים.`
        }
      ];
    }

    console.log("Sending to AI for tagging...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "אתה מערכת לסיווג מסמכים רפואיים. תפקידך לזהות את סוג המסמך ולהחזיר קטגוריות מתאימות בלבד."
          },
          {
            role: "user",
            content: contentForAI
          }
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
    const aiResponse = data.choices?.[0]?.message?.content || "אחר";
    
    // Parse the AI response to extract tags
    const tags = aiResponse
      .split(/[,،]/)
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag && DOCUMENT_CATEGORIES.some(cat => 
        cat.toLowerCase() === tag.toLowerCase() || 
        tag.includes(cat) || 
        cat.includes(tag)
      ))
      .slice(0, 3);

    // If no valid tags found, default to "אחר"
    const finalTags = tags.length > 0 ? tags : ["אחר"];

    console.log(`Detected tags for ${title}:`, finalTags);

    // Update the document with the detected tags
    const { error: updateError } = await supabase
      .from('patient_documents')
      .update({ ai_tags: finalTags })
      .eq('id', documentId);

    if (updateError) {
      console.error("Error updating document tags:", updateError);
      throw new Error("Failed to save tags");
    }

    return new Response(
      JSON.stringify({ success: true, tags: finalTags }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in tag-document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}
