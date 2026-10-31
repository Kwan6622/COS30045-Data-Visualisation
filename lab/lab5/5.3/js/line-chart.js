const drawLineChart = data => {
    const margin = { top: 30, right: 30, bottom: 100, left: 80 };
    const width = 700;
    const height = 500;

    const svg = d3.select("#line-chart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "Average Australian electricity spot price from 1998 to 2024");

    const innerChart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.averagePrice)])
        .nice()
        .range([innerHeight, 0]);

    innerChart.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    innerChart.append("g")
        .call(d3.axisLeft(yScale));

    innerChart.append("text")
        .attr("x", -innerHeight / 2)
        .attr("y", -55)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Average price ($ per megawatt hour)");

    innerChart.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 75)
        .attr("text-anchor", "middle")
        .text("Year");

    const tooltip = innerChart.append("g")
        .attr("class", "line-tooltip")
        .attr("aria-hidden", "true")
        .style("display", "none");

    tooltip.append("rect")
        .attr("x", -62)
        .attr("y", -34)
        .attr("width", 124)
        .attr("height", 28)
        .attr("rx", 4);

    const tooltipText = tooltip.append("text")
        .attr("text-anchor", "middle")
        .attr("y", -15);

    innerChart.selectAll(".point")
        .data(data)
        .join("circle")
        .attr("class", "point")
        .attr("tabindex", 0)
        .attr("role", "img")
        .attr("aria-label", d => `${d.year}: $${d.averagePrice} per megawatt hour`)
        .attr("r", 4)
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.averagePrice))
        .attr("fill", "#0077b6")
        .on("mouseenter focus", function (event, d) {
            d3.select(this).attr("r", 6);
            tooltip
                .style("display", null)
                .raise()
                .attr("transform", `translate(${xScale(d.year)}, ${yScale(d.averagePrice)})`);
            tooltipText.text(`${d.year}: $${d.averagePrice} per MWh`);
        })
        .on("mouseleave blur", function () {
            d3.select(this).attr("r", 4);
            tooltip.style("display", "none");
        });

    const lineGenerator = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.averagePrice));

    innerChart.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", lineGenerator);
};

d3.csv("data/ARE_Spot_Prices.csv", d => ({
    year: Number(d.Year),
    averagePrice: Number(d["Average Price (notTas-Snowy)"])
})).then(data => {
    data.sort((a, b) => a.year - b.year);
    drawLineChart(data);
}).catch(error => {
    console.error("Unable to load Australian electricity spot price data:", error);
});
