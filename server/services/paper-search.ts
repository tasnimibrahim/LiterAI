import axios from "axios";
import { parseStringPromise } from "xml2js";

export interface PaperResult {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  pdfUrl?: string;
  year?: number;
  source: "arxiv" | "pubmed" | "semantic_scholar" | "ieee" | "springer" | "sciencedirect" | "google_scholar" | "core" | "doaj" | "plos" | "europe_pmc";
  citationCount?: number;
}

// ─── arXiv Search ────────────────────────────────────────────────────────────
export async function searchArxiv(query: string, limit = 5): Promise<PaperResult[]> {
  try {
    const response = await axios.get(`http://export.arxiv.org/api/query`, {
      params: {
        search_query: `all:${query}`,
        start: 0,
        max_results: limit,
        sortBy: "relevance",
        sortOrder: "descending",
      },
      timeout: 10000,
    });

    const parsed = await parseStringPromise(response.data);
    const entries = parsed.feed?.entry || [];

    return entries.map((entry: any) => {
      const id = entry.id?.[0] || "";
      const pdfLink = entry.link?.find((l: any) => l.$?.title === "pdf")?.$?.href;
      
      return {
        id: id.split("/abs/").pop() || id,
        title: entry.title?.[0]?.replace(/\n/g, " ").trim() || "",
        authors: (entry.author || []).map((a: any) => a.name?.[0] || ""),
        abstract: entry.summary?.[0]?.replace(/\n/g, " ").trim() || "",
        url: id,
        pdfUrl: pdfLink,
        year: entry.published?.[0] ? new Date(entry.published[0]).getFullYear() : undefined,
        source: "arxiv" as const,
      };
    });
  } catch (error) {
    console.error("[arXiv Search Error]", error);
    return [];
  }
}

// ─── Semantic Scholar Search ─────────────────────────────────────────────────
export async function searchSemanticScholar(query: string, limit = 5): Promise<PaperResult[]> {
  try {
    const response = await axios.get(`https://api.semanticscholar.org/graph/v1/paper/search`, {
      params: {
        query,
        limit,
        fields: "paperId,title,abstract,authors,year,url,citationCount,openAccessPdf",
      },
      timeout: 10000,
    });

    const data = response.data?.data || [];

    return data.map((paper: any) => ({
      id: paper.paperId,
      title: paper.title || "",
      authors: (paper.authors || []).map((a: any) => a.name || ""),
      abstract: paper.abstract || "No abstract available.",
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      pdfUrl: paper.openAccessPdf?.url,
      year: paper.year,
      citationCount: paper.citationCount,
      source: "semantic_scholar" as const,
    }));
  } catch (error) {
    console.error("[Semantic Scholar Search Error]", error);
    return [];
  }
}

// ─── PubMed Search ───────────────────────────────────────────────────────────
export async function searchPubMed(query: string, limit = 5): Promise<PaperResult[]> {
  try {
    const searchRes = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`, {
      params: { db: "pubmed", term: query, retmode: "json", retmax: limit },
      timeout: 10000,
    });

    const ids = searchRes.data?.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    const summaryRes = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi`, {
      params: { db: "pubmed", id: ids.join(","), retmode: "json" },
      timeout: 10000,
    });

    const result = summaryRes.data?.result || {};

    return ids.map((id: string) => {
      const data = result[id];
      if (!data) return null;

      return {
        id,
        title: data.title || "",
        authors: (data.authors || []).map((a: any) => a.name || ""),
        abstract: "Abstract available on PubMed. Click link to view.",
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        year: data.pubdate ? parseInt(data.pubdate.substring(0, 4)) : undefined,
        source: "pubmed" as const,
      };
    }).filter(Boolean) as PaperResult[];
  } catch (error) {
    console.error("[PubMed Search Error]", error);
    return [];
  }
}

// ─── Europe PMC Search ────────────────────────────────────────────────────────
export async function searchEuropePMC(query: string, limit = 5): Promise<PaperResult[]> {
  try {
    const response = await axios.get(`https://www.ebi.ac.uk/europepmc/webservices/rest/search`, {
      params: { query, resultType: "core", format: "json", pageSize: limit },
      timeout: 10000,
    });
    const results = response.data?.resultList?.result || [];
    return results.map((paper: any) => ({
      id: paper.id,
      title: paper.title || "",
      authors: (paper.authorList?.author || []).map((a: any) => a.fullName || ""),
      abstract: paper.abstractText || "No abstract available.",
      url: `https://europepmc.org/article/MED/${paper.id}`,
      year: paper.pubYear ? parseInt(paper.pubYear) : undefined,
      source: "europe_pmc" as const,
    }));
  } catch (error) { return []; }
}

// ─── PLOS Search ──────────────────────────────────────────────────────────────
export async function searchPLOS(query: string, limit = 5): Promise<PaperResult[]> {
  try {
    const response = await axios.get(`https://api.plos.org/search`, {
      params: { q: query, fl: "id,title_display,author_display,abstract,publication_date", rows: limit },
      timeout: 10000,
    });
    const docs = response.data?.response?.docs || [];
    return docs.map((paper: any) => ({
      id: paper.id,
      title: paper.title_display || "",
      authors: paper.author_display || [],
      abstract: (paper.abstract || []).join(" ") || "No abstract available.",
      url: `https://journals.plos.org/plosone/article?id=${paper.id}`,
      year: paper.publication_date ? parseInt(paper.publication_date.substring(0, 4)) : undefined,
      source: "plos" as const,
    }));
  } catch (error) { return []; }
}

// ─── DOAJ Search ──────────────────────────────────────────────────────────────
export async function searchDOAJ(query: string, limit = 5): Promise<PaperResult[]> {
  try {
    const response = await axios.get(`https://doaj.org/api/search/articles/${encodeURIComponent(query)}`, {
      params: { pageSize: limit },
      timeout: 10000,
    });
    const results = response.data?.results || [];
    return results.map((paper: any) => ({
      id: paper.id,
      title: paper.bibjson?.title || "",
      authors: (paper.bibjson?.author || []).map((a: any) => a.name || ""),
      abstract: paper.bibjson?.abstract || "No abstract available.",
      url: paper.bibjson?.link?.[0]?.url || `https://doaj.org/article/${paper.id}`,
      year: paper.bibjson?.year ? parseInt(paper.bibjson.year) : undefined,
      source: "doaj" as const,
    }));
  } catch (error) { return []; }
}

// ─── Unified Search ──────────────────────────────────────────────────────────
export async function searchPapersMultiSource(query: string, sources: string[] = ["arxiv", "semantic_scholar", "pubmed"], limitPerSource = 3): Promise<PaperResult[]> {
  const promises: Promise<PaperResult[]>[] = [];

  if (sources.includes("arxiv")) promises.push(searchArxiv(query, limitPerSource));
  if (sources.includes("semantic_scholar")) promises.push(searchSemanticScholar(query, limitPerSource));
  if (sources.includes("pubmed")) promises.push(searchPubMed(query, limitPerSource));
  if (sources.includes("europe_pmc")) promises.push(searchEuropePMC(query, limitPerSource));
  if (sources.includes("plos")) promises.push(searchPLOS(query, limitPerSource));
  if (sources.includes("doaj")) promises.push(searchDOAJ(query, limitPerSource));

  // Fallbacks for simulated/unsupported sources to Semantic Scholar
  if (sources.includes("google_scholar") || sources.includes("core") || sources.includes("ieee") || sources.includes("springer") || sources.includes("sciencedirect")) {
    promises.push(searchSemanticScholar(query, limitPerSource));
  }

  const results = await Promise.allSettled(promises);
  
  const allPapers = results
    .filter((r): r is PromiseFulfilledResult<PaperResult[]> => r.status === "fulfilled")
    .flatMap(r => r.value);

  // Deduplicate by title (simple heuristic)
  const uniquePapers: PaperResult[] = [];
  const titles = new Set<string>();

  for (const paper of allPapers) {
    const normalizedTitle = paper.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!titles.has(normalizedTitle)) {
      titles.add(normalizedTitle);
      uniquePapers.push(paper);
    }
  }

  return uniquePapers;
}
