import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hashContent(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pageId, sections, pageTitle, pagePath } = await req.json();

    if (!pageId || !Array.isArray(sections)) {
      return respond({ error: "pageId and sections are required", diagnostics: { error_stage: "validation" } }, 400);
    }

    // --- Environment checks ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return respond({ error: "LOVABLE_API_KEY not configured", diagnostics: { error_stage: "config_missing" } }, 500);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return respond({ error: "Supabase credentials not configured", diagnostics: { error_stage: "config_missing" } }, 500);
    }

    // --- Fetch latest saved content from DB for accurate analysis ---
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let contentSections = sections;
    try {
      const { data: override } = await supabaseAdmin
        .from("page_content_overrides")
        .select("sections")
        .eq("page_id", pageId)
        .eq("version_label", "applied")
        .maybeSingle();

      if (override?.sections && Array.isArray(override.sections) && override.sections.length > 0) {
        contentSections = override.sections;
        console.log(`[geo-rescan] Using persisted content for ${pageId} (${override.sections.length} sections)`);
      } else {
        console.log(`[geo-rescan] No persisted content for ${pageId}, using provided sections`);
      }
    } catch (e) {
      console.warn("[geo-rescan] Failed to fetch persisted content, using provided sections:", e.message);
    }

    const contentText = contentSections.map((s: any) =>
      `[${s.tag || 'section'}] ${s.heading || ''}\n${s.content || s.body || ''}`
    ).join('\n\n');

    const contentHash = await hashContent(contentText);

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

IMPORTANT: Only include recommendations for things that are NOT already present in the current content. Do not recommend adding content that already exists on the page.

Respond in valid JSON only. No markdown.`;

    // --- Call AI Gateway ---
    let aiResponse: Response;
    try {
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    } catch (fetchErr) {
      console.error("[geo-rescan] AI Gateway fetch failed:", fetchErr);
      return respond({
        error: "AI Gateway unreachable",
        diagnostics: { error_stage: "ai_gateway_fetch", details: fetchErr.message },
      }, 502);
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`[geo-rescan] AI Gateway error [${aiResponse.status}]:`, errText);
      return respond({
        error: `AI Gateway error: ${aiResponse.status}`,
        diagnostics: { error_stage: "ai_gateway_status", status: aiResponse.status, details: errText.substring(0, 500) },
      }, 502);
    }

    const aiData = await aiResponse.json();
    let analysisText = aiData.choices?.[0]?.message?.content || '';
    analysisText = analysisText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      console.error("[geo-rescan] Failed to parse AI response:", analysisText.substring(0, 200));
      return respond({
        error: "Failed to parse AI analysis response",
        diagnostics: { error_stage: "json_parse_failed", preview: analysisText.substring(0, 200) },
      }, 500);
    }

    const scannedAt = new Date().toISOString();

    // --- Filter recommendations that match existing content ---
    const rawRecommendations = analysis.recommendations || [];
    const filteredRecommendations = rawRecommendations.filter((r: any) => {
      if (!r.text) return false;
      // Check if the recommendation text closely matches existing content
      const recWords = (r.text || '').split(/\s+/).filter((w: string) => w.length > 3);
      const matchingWords = recWords.filter((w: string) => contentText.includes(w));
      // If >70% of significant words are already in content, skip
      return recWords.length === 0 || (matchingWords.length / recWords.length) < 0.7;
    });

    const recommendationsFilteredCount = rawRecommendations.length - filteredRecommendations.length;

    const scanResult = {
      pageId,
      scannedAt,
      dimensions: analysis.dimensions || analysis,
      overallScore: analysis.overallScore ?? 0,
      blockers: analysis.blockers || [],
      recommendations: filteredRecommendations,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      contentHash,
      persisted: false,
      dataSource: 'ai_scan',
      recommendationsFilteredCount,
    };

    // --- Persist: UPSERT on page_id ---
    const { error: dbError } = await supabaseAdmin
      .from("geo_scan_results")
      .upsert(
        {
          page_id: pageId,
          overall_score: scanResult.overallScore,
          dimensions: scanResult.dimensions,
          blockers: scanResult.blockers,
          recommendations: scanResult.recommendations,
          strengths: scanResult.strengths,
          weaknesses: scanResult.weaknesses,
          scanned_at: scannedAt,
          content_hash: contentHash,
        },
        { onConflict: "page_id" }
      );

    if (dbError) {
      console.error("[geo-rescan] DB upsert failed:", dbError);
      scanResult.persisted = false;
    } else {
      scanResult.persisted = true;
      console.log(`[geo-rescan] Scan persisted for ${pageId}, score: ${scanResult.overallScore}`);
    }

    return respond(scanResult);
  } catch (error) {
    console.error("[geo-rescan] Unhandled error:", error);
    return respond(
      { error: error.message || "Failed to run GEO scan", diagnostics: { error_stage: "unhandled", details: error.message } },
      500
    );
  }
});
