/**************************************************/
/*                 Scatterplot                    */
/* COS30045 Data Visualisation - Week 6, Ex 6.3   */
/* Dufour & Meeks (2024) Chapter 7                */
/**************************************************/

const drawScatterplot = (data) => {

    /************************************/
    /*       Append the containers      */
    /************************************/
    const svg = d3.select("#scatterplot")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    // innerChartS is declared in shared-constants.js
    innerChartS = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    /************************************/
    /*          Set up scales           */
    /************************************/
    const maxStar = d3.max(data, d => d.star);
    const maxEng = d3.max(data, d => d.energyConsumption);

    xScaleS
        .domain([0, maxStar])
        .range([0, innerWidth]);

    yScaleS
        .domain([0, maxEng])
        .range([innerHeight, 0]);

    // Hue (not saturation) distinguishes categories of screen type
    colorScale
        .domain(["LED", "LCD", "OLED"])
        .range(d3.schemeCategory10);

    /************************************/
    /*          Draw the circles        */
    /************************************/
    innerChartS
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("r", 4)
        .attr("cx", d => xScaleS(d.star))
        .attr("cy", d => yScaleS(d.energyConsumption))
        .attr("fill", d => colorScale(d.screenTech))
        .attr("opacity", 0.5);

    /************************************/
    /*          Add the axes            */
    /************************************/
    const bottomAxis = d3.axisBottom(xScaleS);

    innerChartS
        .append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(bottomAxis);

    svg
        .append("text")
        .text("Star Rating")
        .attr("text-anchor", "end")
        .attr("x", width - margin.right)
        .attr("y", height - 5)
        .attr("class", "axis-label");

    const leftAxis = d3.axisLeft(yScaleS)
        .ticks(14)
        .tickFormat(d3.format(","));

    innerChartS
        .append("g")
        .call(leftAxis);

    svg
        .append("text")
        .text("Labeled Energy Consumption (kWh/year)")
        .attr("x", margin.left - 30)
        .attr("y", margin.top - 15)
        .attr("class", "axis-label");

    /************************************/
    /*            Add legend            */
    /************************************/
    // 1. Group element to contain legend items
    const legend = innerChartS
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${innerWidth - 80}, 0)`);

    // 2. Iterate through colour categories
    colorScale.domain().forEach((tech, i) => {
        // Group for each legend item, spaced by 20px
        const legendItem = legend
            .append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        // Coloured rectangle
        legendItem
            .append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", colorScale(tech));

        // Label text
        legendItem
            .append("text")
            .attr("x", 20)
            .attr("y", 11)
            .attr("class", "legend-label")
            .text(tech);
    });
};
