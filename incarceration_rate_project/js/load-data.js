d3.csv("data/prison_pop_rate.csv", row => ({
    country: row.Country.trim(),
    rate: Number.isFinite(Number(row["Prison population rate"])) ? Number(row["Prison population rate"]) : null,
    continent: row.Continent.trim()
})).then(data => {
    drawMap(data);
}).catch(error => {
    d3.select("#map")
        .append("p")
        .attr("class", "load-error")
        .text("Unable to load the prison population data.");
    console.error("Error loading prison population data:", error);
});
