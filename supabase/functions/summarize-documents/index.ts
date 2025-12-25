import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documents, patientName, patientId } = await req.json();
    
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing ${documents.length} documents for patient: ${patientName || patientId}`);

    // Extract content from each document
    const documentContents: string[] = [];
    
    for (const doc of documents) {
      try {
        console.log(`Processing document: ${doc.title} (${doc.mime_type})`);
        
        // Download the file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('patient-documents')
          .download(doc.file_path);

        if (downloadError) {
          console.error(`Error downloading ${doc.title}:`, downloadError);
          documentContents.push(`[${doc.title}] - לא ניתן להוריד את הקובץ`);
          continue;
        }

        let extractedText = "";
        
        // Handle different file types
        if (doc.mime_type?.startsWith('image/')) {
          // For images, use Gemini's vision capability
          const base64Image = await blobToBase64(fileData);
          extractedText = await extractTextFromImage(base64Image, doc.mime_type, LOVABLE_API_KEY);
        } else if (doc.mime_type === 'application/pdf') {
          // For PDFs, try to extract text
          // Since we can't parse PDFs directly in Deno easily, we'll use vision model on the assumption
          // that medical PDFs often contain scanned content
          const base64Pdf = await blobToBase64(fileData);
          extractedText = await extractTextFromPdf(base64Pdf, LOVABLE_API_KEY);
        } else {
          // For other files (like Word docs), just note the file type
          extractedText = `[קובץ מסוג ${doc.mime_type} - לא ניתן לקרוא תוכן אוטומטית]`;
        }

        const docInfo = `
=== מסמך: ${doc.title} ===
סוג: ${getDocumentTypeHebrew(doc.document_type)}
תאריך העלאה: ${new Date(doc.created_at).toLocaleDateString('he-IL')}
${extractedText ? `תוכן:\n${extractedText}` : '[לא ניתן לחלץ תוכן]'}
`;
        documentContents.push(docInfo);
        
      } catch (docError) {
        console.error(`Error processing ${doc.title}:`, docError);
        documentContents.push(`[${doc.title}] - שגיאה בעיבוד המסמך`);
      }
    }

    const allDocumentsContent = documentContents.join('\n\n---\n\n');
    
    console.log("Sending to AI for summarization...");

    const systemPrompt = `אתה רופא מומחה שמנתח מסמכים רפואיים. תפקידך לקרוא את תוכן המסמכים ולספק סיכום רפואי מקצועי.

עליך:
1. לסכם את הממצאים העיקריים מכל מסמך
2. לזהות ערכים חריגים בבדיקות מעבדה או ממצאים משמעותיים בהדמיות
3. לציין אבחנות או תלונות עיקריות שעולות מהמסמכים
4. להמליץ על מה הרופא צריך לשים לב בביקור הקרוב

כתוב בעברית מקצועית וברורה. אם לא ניתן לקרוא תוכן של מסמך מסוים, ציין זאת.`;

    const userPrompt = `${patientName ? `מטופל: ${patientName}\n\n` : ''}מסמכים לסיכום:\n\n${allDocumentsContent}

אנא ספק סיכום רפואי מקיף של המסמכים.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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

    console.log("Summary generated successfully");

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

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

async function extractTextFromImage(base64Image: string, mimeType: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "קרא וחלץ את כל הטקסט מהתמונה הזו. אם זו בדיקת מעבדה, ציין את הערכים והיחידות. אם זה מסמך רפואי, חלץ את כל המידע החשוב. כתוב בעברית."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("Vision API error:", response.status);
      return "[לא ניתן לקרוא את התמונה]";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "[לא נמצא טקסט בתמונה]";
  } catch (error) {
    console.error("Error extracting text from image:", error);
    return "[שגיאה בחילוץ טקסט מהתמונה]";
  }
}

async function extractTextFromPdf(base64Pdf: string, apiKey: string): Promise<string> {
  try {
    // Use Gemini to analyze PDF content - it can process PDFs natively
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "קרא וחלץ את כל הטקסט מקובץ ה-PDF הזה. אם זו בדיקת מעבדה, ציין את הערכים והיחידות. אם זה מסמך רפואי, חלץ את כל המידע החשוב כולל אבחנות, תוצאות, והמלצות. כתוב בעברית."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("PDF extraction error:", response.status);
      return "[לא ניתן לקרוא את ה-PDF]";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "[לא נמצא טקסט ב-PDF]";
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "[שגיאה בחילוץ טקסט מה-PDF]";
  }
}

function getDocumentTypeHebrew(type: string): string {
  const typeMap: Record<string, string> = {
    'id': 'תעודת זהות',
    'referral': 'הפניה',
    'lab_result': 'בדיקת מעבדה',
    'imaging': 'צילום/הדמיה',
    'consent': 'טופס הסכמה',
    'insurance': 'ביטוח',
    'report': 'דוח רפואי',
    'prescription': 'מרשם',
    'other': 'אחר',
  };
  return typeMap[type] || type;
}
