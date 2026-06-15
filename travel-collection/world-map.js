(function (global) {
  const MAP_TOPOLOGY_URL = "data/countries-50m.json";
  const COUNTRY_META_URL = "data/countries.zh.json";
  const WIDTH = 960;
  const HEIGHT = 500;
  const EXPLORED_FILL = "#6DBF67";
  const UNEXPLORED_FILL = "#E8ECE6";
  const BORDER_FILL = "#FFFFFF";

  let resourcesPromise = null;

  function normalizeNumeric(value) {
    return String(value ?? "").padStart(3, "0");
  }

  function readState() {
    return global.TravelState?.readTravelState?.() || {};
  }

  function mapUnavailable(container, message = "地图加载中") {
    container.innerHTML = `<div class="travel-world-map__fallback">${message}</div>`;
  }

  async function loadResources() {
    if (resourcesPromise) return resourcesPromise;
    resourcesPromise = Promise.all([
      fetch(MAP_TOPOLOGY_URL).then((response) => response.json()),
      fetch(COUNTRY_META_URL).then((response) => response.json()),
    ]).then(([topology, countryMeta]) => {
      const numericByIso = Object.fromEntries(
        countryMeta
          .filter((item) => item.code && item.numeric)
          .map((item) => [item.code, normalizeNumeric(item.numeric)]),
      );
      const metaByNumeric = Object.fromEntries(
        countryMeta
          .filter((item) => item.numeric)
          .map((item) => [normalizeNumeric(item.numeric), item]),
      );
      const features = global.topojson.feature(topology, topology.objects.countries).features;
      return { topology, features, numericByIso, metaByNumeric };
    });
    return resourcesPromise;
  }

  function exploredNumericCodes(state, numericByIso) {
    return new Set(
      (state.countries || [])
        .filter((country) => country.explorationStatus === "explored")
        .map((country) => numericByIso[country.id])
        .filter(Boolean),
    );
  }

  function countryName(feature, metaByNumeric) {
    const numeric = normalizeNumeric(feature.id);
    return metaByNumeric[numeric]?.name || feature.properties?.name || "国家";
  }

  function renderMap(container, resources) {
    const state = readState();
    const exploredCodes = exploredNumericCodes(state, resources.numericByIso);
    const isInteractive = container.dataset.worldMapMode === "detail";
    const isPreview = container.dataset.worldMapMode === "preview";
    container.innerHTML = "";
    container.style.setProperty("--explored-country-count", String(exploredCodes.size));

    const svg = global.d3
      .select(container)
      .append("svg")
      .attr("class", "travel-world-map__svg")
      .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
      .attr("role", "img")
      .attr("aria-label", `世界地图，已探索 ${exploredCodes.size} 个国家`);

    const projection = global.d3.geoNaturalEarth1();
    projection.fitExtent(
      isPreview ? [[0, 10], [WIDTH, HEIGHT - 10]] : [[18, 18], [WIDTH - 18, HEIGHT - 18]],
      isPreview ? { type: "FeatureCollection", features: resources.features } : { type: "Sphere" },
    );
    const path = global.d3.geoPath(projection);
    const group = svg.append("g").attr("class", "travel-world-map__countries");

    group
      .selectAll("path")
      .data(resources.features)
      .join("path")
      .attr("d", path)
      .attr("class", (feature) => exploredCodes.has(normalizeNumeric(feature.id)) ? "is-explored" : "is-unexplored")
      .attr("fill", (feature) => exploredCodes.has(normalizeNumeric(feature.id)) ? EXPLORED_FILL : UNEXPLORED_FILL)
      .attr("stroke", BORDER_FILL)
      .attr("stroke-width", 0.8)
      .attr("vector-effect", "non-scaling-stroke")
      .append("title")
      .text((feature) => {
        const status = exploredCodes.has(normalizeNumeric(feature.id)) ? "已探索" : "未探索";
        return `${countryName(feature, resources.metaByNumeric)} · ${status}`;
      });

    if (isInteractive) {
      const zoom = global.d3
        .zoom()
        .scaleExtent([1, 5])
        .translateExtent([[0, 0], [WIDTH, HEIGHT]])
        .on("zoom", (event) => {
          group.attr("transform", event.transform);
        });
      svg.call(zoom);
    }
  }

  async function renderTravelWorldMaps() {
    const containers = [...document.querySelectorAll("[data-world-map]")];
    if (!containers.length) return;
    if (!global.d3 || !global.topojson || !global.fetch) {
      containers.forEach((container) => mapUnavailable(container, "地图资源不可用"));
      return;
    }
    containers.forEach((container) => mapUnavailable(container));
    try {
      const resources = await loadResources();
      containers.forEach((container) => renderMap(container, resources));
    } catch {
      containers.forEach((container) => mapUnavailable(container, "地图加载失败"));
    }
  }

  document.addEventListener("DOMContentLoaded", renderTravelWorldMaps);
  global.addEventListener?.("storage", (event) => {
    if (event.key === global.TravelState?.TRAVEL_STATE_STORAGE_KEY) renderTravelWorldMaps();
  });
  global.renderTravelWorldMaps = renderTravelWorldMaps;
})(typeof window !== "undefined" ? window : globalThis);
