/**************************************************/
/*                 Histogram                      */
/* COS30045 Data Visualisation - Week 6, Ex 6.4   */
/* Dufour & Meeks (2024) Chapter 6                */
/**************************************************/

const drawHistogram = (data) => {

    /************************************/
    /*       Append the containers      */
    /************************************/
    const svg = d3.select("#histogram")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    // innerChartH is declared in shared-constants.js (needed for the histogram tooltip)
    innerChartH = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    const innerChart = innerChartH;

    /************************************/
    /*          Generate bins           */
    /************************************/
    const bins = binGenerator(data);
    console.log("Bins:", bins);

    /************************************/
    /*          Define scales           */
    /************************************/
    const minEng = bins[0].x0;
    const maxEng = bins[bins.length - 1].x1;
    const binsMaxLength = d3.max(bins, d => d.length);

    xScale
        .domain([minEng, maxEng])
        .range([0, innerWidth]);

    yScale
        .domain([0, binsMaxLength])
        .range([innerHeight, 0])
        .nice();

    /************************************/
    /*          Draw the bars           */
    /************************************/
    innerChart
        .selectAll("rect.bar")
        .data(bins)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.x0))
        .attr("y", d => yScale(d.length))
        .attr("width", d => xScale(d.x1) - xScale(d.x0))
        .attr("height", d => innerHeight - yScale(d.length))
        .attr("fill", slateGray)
        .attr("stroke", bodyBackgroundColor)
        .attr("stroke-width", 2);

    /************************************/
    /*          Add the axes            */
    /************************************/
    const bottomAxis = d3.axisBottom(xScale)
        .ticks(14)
        .tickFormat(d3.format(","));

    innerChart
        .append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(bottomAxis);

    svg
        .append("text")
        .text("Labeled Energy Consumption (kWh/year)")
        .attr("text-anchor", "end")
        .attr("x", width - margin.right)
        .attr("y", height - 5)
        .attr("class", "axis-label");

    const leftAxis = d3.axisLeft(yScale)
        .ticks(14)
        .tickFormat(d3.format(","));

    innerChart
        .append("g")
        .call(leftAxis);

    svg
        .append("text")
        .text("Frequency")
        .attr("x", margin.left - 30)
        .attr("y", margin.top - 15)
        .attr("class", "axis-label");
};
