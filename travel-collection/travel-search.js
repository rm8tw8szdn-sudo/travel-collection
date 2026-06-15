(function (global) {
  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function dataSource(state = {}) {
    const data = global.TravelData || {};
    return {
      countries: state.countries || data.DEFAULT_COUNTRIES || [],
      cities: state.cities || data.DEFAULT_CITIES || [],
      routes: state.routes || data.DEFAULT_ROUTES || [],
      aliases: data.ROUTE_KEYWORD_ALIASES || {},
    };
  }

  function expandTerms(query, aliases = {}) {
    const raw = String(query || "").trim();
    if (!raw) return [];
    const direct = raw.split(/\s+/).filter(Boolean);
    const aliasTerms = Object.entries(aliases).flatMap(([key, values]) => (
      normalize(raw).includes(normalize(key)) ? values : []
    ));
    return unique([...direct, raw, ...aliasTerms]).map(normalize).filter(Boolean);
  }

  function compact(value) {
    return normalize(value).replace(/\s+/g, "");
  }

  function entityText(item) {
    return [
      item.id,
      item.name,
      item.englishName,
      item.continent,
      item.intro,
      item.searchText,
      ...(item.aliases || []),
      ...(item.tags || []),
      ...(item.keywords || []),
      ...(item.spots || []),
    ].join(" ");
  }

  function entityMatchesQuery(item, query) {
    const term = compact(query);
    if (!term) return false;
    return entityText(item)
      .split(/\s+/)
      .map(compact)
      .filter(Boolean)
      .some((token) => token === term);
  }

  function routeEntityText(route, state = {}) {
    const countries = (route.countryIds || []).map((id) => state.countriesById?.[id]).filter(Boolean);
    const cities = (route.cityIds || []).map((id) => state.citiesById?.[id]).filter(Boolean);
    return [
      ...countries.map(entityText),
      ...cities.map(entityText),
    ].join(" ");
  }

  function itemText(item, state = {}) {
    const country = state.countriesById?.[item.countryId];
    return [
      item.id,
      item.name,
      item.englishName,
      item.continent,
      item.intro,
      item.reason,
      item.days,
      item.season,
      item.bestSeason,
      item.budgetLevel,
      item.searchText,
      country?.name,
      country?.englishName,
      ...(item.tags || []),
      ...(item.keywords || []),
      ...(item.spots || []),
      ...(item.countryIds || []).map((id) => state.countriesById?.[id]?.name || id),
      ...(item.countryIds || []).map((id) => state.countriesById?.[id]?.englishName || ""),
      ...(item.cityIds || []).map((id) => state.citiesById?.[id]?.name || id),
      ...(item.cityIds || []).map((id) => state.citiesById?.[id]?.englishName || ""),
      routeEntityText(item, state),
    ].join(" ").toLowerCase();
  }

  function matchesTerms(item, terms, state) {
    if (!terms.length) return true;
    const text = itemText(item, state);
    return terms.some((term) => text.includes(term));
  }

  function atlasItemFromCountry(country) {
    return {
      ...country,
      type: "country",
      typeLabel: "国家",
      href: `country-japan.html#${encodeURIComponent(country.id)}`,
    };
  }

  function atlasItemFromCity(city, state = {}) {
    const country = state.countriesById?.[city.countryId] || {};
    return {
      ...city,
      type: "city",
      typeLabel: "城市",
      parentName: country.name || "",
      href: `city-oslo.html#${encodeURIComponent(city.id)}`,
    };
  }

  function searchAtlas(state = {}, query = "", options = {}) {
    const source = dataSource(state);
    const terms = expandTerms(query, source.aliases);
    const countriesById = state.countriesById || Object.fromEntries(source.countries.map((item) => [item.id, item]));
    const citiesById = state.citiesById || Object.fromEntries(source.cities.map((item) => [item.id, item]));
    const nextState = { ...state, countriesById, citiesById };
    const directCountries = source.countries
      .filter((country) => matchesTerms(country, terms, nextState))
      .map(atlasItemFromCountry);
    const directCountryIds = new Set(directCountries.map((country) => country.id));
    const cities = source.cities
      .filter((city) => matchesTerms(city, terms, nextState) || directCountryIds.has(city.countryId))
      .map((city) => atlasItemFromCity(city, nextState));
    const parentCountryIds = new Set(cities.map((city) => city.countryId));
    const parentCountries = source.countries
      .filter((country) => parentCountryIds.has(country.id) && !directCountryIds.has(country.id))
      .map(atlasItemFromCountry);
    const countries = [...directCountries, ...parentCountries];
    const allItems = [...countries, ...cities];
    if (options.filter === "favorite") return allItems.filter((item) => item.isFavorite);
    if (options.filter && options.filter !== "all") return allItems.filter((item) => item.explorationStatus === options.filter);
    return allItems;
  }

  function searchRoutes(state = {}, query = "", options = {}) {
    const source = dataSource(state);
    const raw = String(query || "").trim();
    const countriesById = state.countriesById || Object.fromEntries(source.countries.map((item) => [item.id, item]));
    const citiesById = state.citiesById || Object.fromEntries(source.cities.map((item) => [item.id, item]));
    const nextState = { ...state, countriesById, citiesById };
    const matchedCityIds = source.cities.filter((city) => entityMatchesQuery(city, raw)).map((city) => city.id);
    const matchedCountryIds = source.countries.filter((country) => entityMatchesQuery(country, raw)).map((country) => country.id);
    let routes;
    if (!raw) {
      routes = source.routes;
    } else if (matchedCityIds.length || matchedCountryIds.length) {
      const cityIds = new Set(matchedCityIds);
      const countryIds = new Set(matchedCountryIds);
      routes = source.routes.filter((route) => (
        (route.cityIds || []).some((id) => cityIds.has(id))
        || (route.countryIds || []).some((id) => countryIds.has(id))
      ));
    } else {
      const terms = expandTerms(raw, source.aliases);
      routes = source.routes.filter((route) => matchesTerms(route, terms, nextState));
    }
    if (options.kind && options.kind !== "all") routes = routes.filter((route) => route.kind === options.kind);
    return routes;
  }

  const api = {
    expandTerms,
    searchAtlas,
    searchRoutes,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.TravelSearch = api;
})(typeof window !== "undefined" ? window : globalThis);
