/******************************************************************************/
/* Global Incarceration Rates — Data & Canonical Mapping Loader               */
/******************************************************************************/

Promise.all([
    d3.csv("data/prison_pop_rate.csv", row => ({
        country: (row.Country || "").trim(),
        rate: parsePrisonRate(row["Prison population rate"]),
        continent: (row.Continent || "").trim()
    })),
    d3.csv("data/prison_population_total.csv", row => ({
        country: (row["Country / Jurisdiction"] || "").trim(),
        incarceratedPopulation: parseIncarceratedPopulation(row["Prison population total"])
    })),
    d3.json("data/jurisdiction_mapping.json").catch(() => DEFAULT_MAPPING_CONFIG)
]).then(([rawRows, populationRows, mappingConfig]) => {
    const populationByCountry = new Map(
        populationRows
            .filter(row => row.country)
            .map(row => [normaliseJurisdictionName(row.country).toLowerCase(), row.incarceratedPopulation])
    );
    rawRows.forEach(row => {
        row.incarceratedPopulation = populationByCountry.get(normaliseJurisdictionName(row.country).toLowerCase()) ?? null;
    });
    const validRows = rawRows.filter(row => Boolean(row.country));
    drawMap(validRows, mappingConfig || DEFAULT_MAPPING_CONFIG);
}).catch(error => {
    d3.select("#map")
        .append("p")
        .attr("class", "load-error")
        .text("Unable to load the prison population data.");
    console.error("Error loading prison population data:", error);
});
