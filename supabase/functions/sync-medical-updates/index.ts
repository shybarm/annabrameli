import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// PubMed E-utilities base URL
const PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
const PUBMED_SUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface PubMedArticle {
  pmid: string;
  title: string;
  source: string;
  pubDate: string;
  abstract?: string;
}

async function searchPubMed(): Promise<string[]> {
  const query = encodeURIComponent(
    '("food allergy" OR "allergic rhinitis" OR "anaphylaxis" OR "atopic dermatitis" OR "urticaria" OR "drug allergy" OR "insect allergy" OR "allergen immunotherapy" OR "peanut allergy" OR "egg allergy" OR "milk allergy") AND ("children" OR "pediatric" OR "treatment" OR "diagnosis")'
  );
  const url = `${PUBMED_SEARCH_URL}?db=pubmed&term=${query}&retmax=10&sort=date&retmode=json&datetype=pdat&reldate=60`;

  console.log("Searching PubMed with query...");
  const response = await fetch(url);
  if (!response.ok) {
    console.error("PubMed search failed:", response.status);
    return [];
  }
  const data = await response.json();
  const ids: string[] = data?.esearchresult?.idlist || [];
  console.log(`Found ${ids.length} PubMed articles`);
  return ids;
}

async function fetchArticleSummaries(ids: string[]): Promise<PubMedArticle[]> {
  if (ids.length === 0) return [];

  const url = `${PUBMED_SUMMARY_URL}?db=pubmed&id=${ids.join(",")}&retmode=json`;
  console.log("Fetching article summaries...");

  const response = await fetch(url);
  if (!response.ok) {
    console.error("PubMed summary fetch failed:", response.status);
    return [];
  }

  const data = await response.json();
  const results = data?.result || {};
  const articles: PubMedArticle[] = [];

  for (const id of ids) {
    const article = results[id];
    if (!article || !article.title) continue;

    articles.push({
      pmid: id,
      title: article.title,
      source: article.source || article.fulljournalname || "PubMed",
      pubDate: article.pubdate || article.epubdate || new Date().toISOString().split("T")[0],
      abstract: article.title, // Summary endpoint doesn't return abstract
    });
  }

  console.log(`Parsed ${articles.length} articles`);
  return articles;
}

async function summarizeInHebrew(
  article: PubMedArticle,
  apiKey: string
): Promise<{ title_he: string; summary_he: string } | null> {
  try {
    console.log(`Summarizing article: ${article.pmid} - ${article.title.substring(0, 50)}...`);

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `אתה מתרגם ומסכם מאמרים רפואיים בתחום האלרגיה. 
תפקידך לתרגם כותרת מאמר רפואי לעברית ולכתוב תקציר קצר (2-3 משפטים) בעברית פשוטה שמובנת להורים.
החזר תשובה בפורמט JSON בלבד: {"title_he": "...", "summary_he": "..."}
אל תוסיף טקסט מחוץ ל-JSON.`,
          },
          {
            role: "user",
            content: `כותרת המאמר: ${article.title}\nמקור: ${article.source}\nתאריך: ${article.pubDate}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI gateway error for ${article.pmid}: ${response.status} ${errText}`);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`No JSON found in AI response for ${article.pmid}`);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title_he: parsed.title_he,
      summary_he: parsed.summary_he,
    };
  } catch (error) {
    console.error(`Error summarizing article ${article.pmid}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting medical updates sync...");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Search PubMed for recent allergy articles
    const pmids = await searchPubMed();
    if (pmids.length === 0) {
      console.log("No articles found");
      return new Response(
        JSON.stringify({ success: true, message: "No new articles found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check which articles we already have
    const { data: existing } = await supabase
      .from("medical_updates")
      .select("pubmed_id")
      .in("pubmed_id", pmids);

    const existingIds = new Set((existing || []).map((e: any) => e.pubmed_id));
    const newPmids = pmids.filter((id) => !existingIds.has(id));
    console.log(`${newPmids.length} new articles to process (${existingIds.size} already exist)`);

    if (newPmids.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All articles already synced", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch article details
    const articles = await fetchArticleSummaries(newPmids);

    // 4. Summarize each in Hebrew with AI (limit to 5 per run to stay within rate limits)
    const toProcess = articles.slice(0, 5);
    let insertedCount = 0;

    for (const article of toProcess) {
      const translation = await summarizeInHebrew(article, LOVABLE_API_KEY);
      if (!translation) continue;

      // Parse date
      let publishedDate: string;
      try {
        // PubMed dates can be "2024 Dec" or "2024 Dec 15" format
        const parts = article.pubDate.split(" ");
        const year = parts[0];
        const monthMap: Record<string, string> = {
          Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
          Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
        };
        const month = monthMap[parts[1]] || "01";
        const day = parts[2] || "01";
        publishedDate = `${year}-${month}-${day.padStart(2, "0")}`;
      } catch {
        publishedDate = new Date().toISOString().split("T")[0];
      }

      const { error } = await supabase.from("medical_updates").insert({
        title: article.title,
        title_he: translation.title_he,
        summary_he: translation.summary_he,
        source: article.source,
        source_url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
        pubmed_id: article.pmid,
        published_date: publishedDate,
        is_published: true,
      });

      if (error) {
        console.error(`Insert error for ${article.pmid}:`, error.message);
      } else {
        insertedCount++;
        console.log(`Inserted article ${article.pmid}: ${translation.title_he.substring(0, 40)}...`);
      }

      // Small delay between AI calls to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log(`Sync complete. Inserted ${insertedCount} new articles.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${insertedCount} new medical updates`,
        count: insertedCount,
        total_found: pmids.length,
        new_articles: newPmids.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
