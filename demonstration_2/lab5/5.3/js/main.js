
const drawBarChart = data => {
    const margin = { top: 30, right: 30, bottom: 100, left: 80 };
    const width = 700;
    const height = 500;

    const svg = d3.select(".responsive-svg-container")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "Average annual energy consumption of 55-inch televisions by screen type");

    const innerChart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleBand()
        .domain(data.map(d => d.screenType))
        .range([0, innerWidth])
        .padding(0.25);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.energyConsumption)])
        .nice()
        .range([innerHeight, 0]);

    innerChart.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale));

    innerChart.append("g")
        .call(d3.axisLeft(yScale));

    innerChart.append("text")
        .attr("x", -innerHeight / 2)
        .attr("y", -55)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Average energy consumption (kWh/year)");

    innerChart.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 75)
        .attr("text-anchor", "middle")
        .text("Screen type");

    const bars = innerChart.selectAll(".bar")
        .data(data)
        .join("g")
        .attr("class", "bar")
        .attr("transform", d => `translate(${xScale(d.screenType)}, 0)`);

    bars.append("rect")
        .attr("x", 0)
        .attr("y", d => yScale(d.energyConsumption))
        .attr("width", xScale.bandwidth())
        .attr("height", d => innerHeight - yScale(d.energyConsumption));

    bars.append("text")
        .attr("x", xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.energyConsumption) - 8)
        .attr("text-anchor", "middle")
        .text(d => d.energyConsumption.toFixed(2));
};

d3.csv("data/55_energy_tech.csv", d => ({
    screenType: d.Screen_Tech,
    energyConsumption: Number(d["Mean(Labelled energy consumption (kWh/year))"])
})).then(data => {
    data.sort((a, b) => b.energyConsumption - a.energyConsumption);
    drawBarChart(data);
}).catch(error => {
    console.error("Unable to load 55-inch television energy data:", error);
});