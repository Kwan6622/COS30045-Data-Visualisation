/**************************************************/
/*                 Histogram                      */
/* COS30045 Data Visualisation - Week 6, Ex 6.2   */
/* Dufour & Meeks (2024) Chapter 6 & 7            */
/**************************************************/

const drawHistogram = (data) => {
    // Clear any previous chart (for clean re-renders)
    d3.select("#histogram").selectAll("*").remove();

    /************************************/
    /*       Append the containers      */
    /************************************/
    const svg = d3.select("#histogram")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "Histogram of TV Energy Consumption");

    const innerChart = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    /************************************/
    /*          Generate bins           */
    /************************************/
    const bins = binGenerator(data);
    console.log("Initial bins:", bins);

    /************************************/
    /*          Draw the bars           */
    /************************************/
    innerChart
        .selectAll("rect")
        .data(bins)
        .join("rect")
        .attr("x", d => xScale(d.x0))
        .attr("y", d => yScale(d.length))
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0)))
        .attr("height", d => innerHeight - yScale(d.length))
        .attr("fill", slateGray)
        .attr("stroke", bodyBackgroundColor)
        .attr("stroke-width", 2);

    /************************************/
    /*          Add the x-axis          */
    /************************************/
    const bottomAxis = d3.axisBottom(xScale)
        .tickValues(d3.range(0, 1801, 200))
        .tickFormat(d3.format(","));

    innerChart
        .append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(bottomAxis);

    // Add the x-axis label
    svg
        .append("text")
        .text("Labeled Energy Consumption (kWh/year)")
        .attr("text-anchor", "end")
        .attr("x", width - margin.right)
        .attr("y", height - 10)
        .attr("class", "axis-label");

    /************************************/
    /*          Add the y-axis          */
    /************************************/
    const leftAxis = d3.axisLeft(yScale)
        .tickValues(d3.range(0, 1301, 100))
        .tickFormat(d3.format(","));

    innerChart
        .append("g")
        .call(leftAxis);

    // Add the y-axis label
    svg
        .append("text")
        .text("Frequency")
        .attr("x", margin.left)
        .attr("y", margin.top - 15)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label");
};
