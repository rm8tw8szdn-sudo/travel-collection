(function (global) {
  const WIKIVOYAGE_API = "https://en.wikivoyage.org/w/api.php";

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function compact(value) {
    return normalize(value).replace(/\s+/g, "");
  }

  function unique(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function stableId(value) {
    return compact(value)
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72);
  }

  function createRouteCandidate(data) {
    return {
      id: data.id || `candidate-${stableId([data.name, ...(data.cities || [])].join("-"))}`,
      name: data.name,
      type: data.type || ((data.countries || []).length > 1 ? "cross_country" : "single_country"),
      countries: unique(data.countries || []),
      cities: unique(data.cities || []),
      description: data.description || "",
      recommendedDays: data.recommendedDays || "天数待定",
      bestSeason: data.bestSeason || "按季节选择",
      budgetLevel: data.budgetLevel || "medium",
      tags: unique(data.tags || []),
      keywords: unique(data.keywords || []),
      sourceUrl: data.sourceUrl || "",
      sourceName: data.sourceName || "",
      confidence: Number.isFinite(data.confidence) ? data.confidence : 0,
      status: data.status || "candidate",
    };
  }

  const DESTINATION_PROFILES = [
    {
      key: "uk-york-history",
      aliases: ["约克", "york"],
      queries: [
        "York England travel itinerary history route",
        "York Oxford Cambridge itinerary UK",
        "英国 约克 历史 旅行路线",
      ],
      evidence: ["york", "england", "history", "museum", "约克", "英国"],
      candidate: {
        id: "candidate-uk-york-history",
        name: "英国约克历史线",
        type: "single_country",
        countries: ["英国"],
        cities: ["约克", "牛津", "剑桥"],
        description: "以约克古城为核心，延伸到英格兰大学城与历史街区。",
        recommendedDays: "5-7天",
        bestSeason: "5月-9月",
        budgetLevel: "medium",
        tags: ["history", "culture", "museum", "city"],
        keywords: ["英国", "UK", "England", "York", "Oxford", "Cambridge", "history", "museum"],
      },
    },
    {
      key: "uk-classic",
      aliases: ["英国", "英國", "uk", "united kingdom", "england", "scotland", "伦敦", "london", "约克", "york", "爱丁堡", "edinburgh"],
      queries: [
        "best UK travel itinerary 7 days",
        "classic England Scotland itinerary",
        "UK travel route London Edinburgh York",
        "英国 经典旅行路线",
        "英国 自由行 路线 伦敦 爱丁堡",
      ],
      evidence: ["uk", "united kingdom", "england", "scotland", "london", "edinburgh", "york", "英国", "伦敦", "爱丁堡", "约克"],
      candidate: {
        id: "candidate-uk-london-york-edinburgh",
        name: "英国经典线",
        type: "single_country",
        countries: ["英国"],
        cities: ["伦敦", "约克", "爱丁堡"],
        description: "从伦敦出发，串联英格兰历史城市与苏格兰经典风景。",
        recommendedDays: "7-10天",
        bestSeason: "5月-9月",
        budgetLevel: "medium",
        tags: ["culture", "history", "city", "museum"],
        keywords: ["英国", "UK", "England", "Scotland", "London", "Edinburgh", "York", "history", "culture"],
      },
    },
  ];

  function profilesForQuery(query) {
    const normalized = compact(query);
    if (!normalized) return [];
    return DESTINATION_PROFILES.filter((profile) => (
      profile.aliases.some((alias) => normalized.includes(compact(alias)) || compact(alias).includes(normalized))
    ));
  }

  function routeSearchQueries(query, profile) {
    const raw = String(query || "").trim();
    return unique([
      ...(profile?.queries || []),
      raw ? `${raw} travel itinerary route` : "",
      raw ? `${raw} 经典旅行路线` : "",
    ]);
  }

  async function fetchSearchText(query, fetchImpl) {
    const url = new URL(WIKIVOYAGE_API);
    url.searchParams.set("origin", "*");
    url.searchParams.set("format", "json");
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srlimit", "5");
    url.searchParams.set("srsearch", query);
    const response = await fetchImpl(url.toString());
    if (!response.ok) return "";
    const data = await response.json();
    return (data?.query?.search || [])
      .map((item) => `${item.title || ""} ${item.snippet || ""}`)
      .join(" ");
  }

  function evidenceScore(text, terms) {
    const normalized = normalize(text);
    const hits = unique(terms).filter((term) => normalized.includes(normalize(term)));
    return hits.length / Math.max(1, unique(terms).length);
  }

  async function searchOnlineRouteCandidates(query, options = {}) {
    const fetchImpl = options.fetchImpl || global.fetch;
    if (typeof fetchImpl !== "function") return [];
    const profiles = profilesForQuery(query);
    if (!profiles.length) return [];

    const results = [];
    for (const profile of profiles) {
      let combinedText = "";
      for (const searchQuery of routeSearchQueries(query, profile).slice(0, 5)) {
        try {
          combinedText += ` ${await fetchSearchText(searchQuery, fetchImpl)}`;
        } catch {
          combinedText += "";
        }
      }
      const score = evidenceScore(combinedText, profile.evidence);
      if (score < 0.18) continue;
      const candidate = createRouteCandidate({
        ...profile.candidate,
        sourceName: "Wikivoyage",
        sourceUrl: "https://en.wikivoyage.org/wiki/United_Kingdom",
        confidence: Math.min(0.95, 0.62 + score),
      });
      results.push(candidate);
    }
    return results;
  }

  const api = {
    createRouteCandidate,
    searchOnlineRouteCandidates,
    routeSearchQueries,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.RouteCandidate = api;
})(typeof window !== "undefined" ? window : globalThis);
