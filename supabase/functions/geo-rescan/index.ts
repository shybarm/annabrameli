import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pageId, sections, pageTitle, pagePath } = await req.json();

    if (!pageId || !Array.isArray(sections)) {
      return new Response(JSON.stringify({ error: "pageId and sections are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const contentText = sections.map((s: any) =>
      `[${s.tag}] ${s.heading}\n${s.content || ''}`
    ).join('\n\n');

    const prompt = `You are a GEO (Generative Engine Optimization) expert analyzing a medical clinic website page for AI search engine visibility.

Page: "${pageTitle || pageId}" at path "${pagePath || '/'}"

Current content:
${contentText.substring(0, 4000)}

Analyze this page across these 10 GEO dimensions. For each dimension, provide:
- score (1-10)
- working: what's done well (array of short strings in Hebrew)
- missing: what's missing (array of short strings in Hebrew)
- fixes: specific fixes needed (array of short strings in Hebrew)
- impact: why this matters (short string in Hebrew)

Dimensions:
1. answerClarity - Does the page answer a clear question directly?
2. topicalSpecificity - Is the page focused on one specific topic?
3. medicalTrust - Does it demonstrate medical credibility?
4. expertVisibility - Is the expert/doctor clearly identified?
5. extractability - Can AI systems easily extract structured info?
6. internalLinking - Are there relevant internal links?
7. snippetUniqueness - Is the content unique and snippet-worthy?
8. conversionClarity - Is there a clear CTA?
9. entityConsistency - Are brand/entity names consistent?
10. updateReadiness - Is the page fresh and up-to-date?

Also provide:
- overallScore: weighted average (1-10, one decimal)
- blockers: array of critical issues preventing AI citation (Hebrew)
- recommendations: array of {label: "quick-win"|"structural-change"|"authority-project"|"rewrite-required", text: string in Hebrew}
- strengths: array of what's working well (Hebrew)
- weaknesses: array of what needs improvement (Hebrew)

Respond in valid JSON only. No markdown.`;

    const aiResponse = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Gateway error [${aiResponse.status}]: ${errText}`);
    }

    const aiData = await aiResponse.json();
    let analysisText = aiData.choices?.[0]?.message?.content || '';
    analysisText = analysisText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      throw new Error("Failed to parse AI analysis response");
    }

    const scannedAt = new Date().toISOString();

    const scanResult = {
      pageId,
      scannedAt,
      dimensions: analysis.dimensions || analysis,
      overallScore: analysis.overallScore ?? 0,
      blockers: analysis.blockers || [],
      recommendations: analysis.recommendations || [],
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      persisted: false,
    };

    // Persist scan result to geo_scan_results table
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { error: dbError } = await supabaseAdmin
      .from("geo_scan_results")
      .insert({
        page_id: pageId,
        overall_score: scanResult.overallScore,
        dimensions: scanResult.dimensions,
        blockers: scanResult.blockers,
        recommendations: scanResult.recommendations,
        strengths: scanResult.strengths,
        weaknesses: scanResult.weaknesses,
        scanned_at: scannedAt,
      });

    if (dbError) {
      console.error("Failed to persist scan result:", dbError);
    } else {
      scanResult.persisted = true;
    }

    return new Response(JSON.stringify(scanResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in geo-rescan:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to run GEO scan" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
