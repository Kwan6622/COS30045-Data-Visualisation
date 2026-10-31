/**************************************************/
/*                 Interactions                   */
/* COS30045 Data Visualisation - Week 6, Ex 6.3   */
/* Dufour & Meeks (2024) Chapter 7                */
/**************************************************/

/************************************/
/*        Screen type filters       */
/************************************/
const populateFilters = (data) => {

    d3.select("#filters_screen")
        .selectAll(".filter")
        .data(filters_screen)
        .join("button")
        .attr("class", d => `filter ${d.isActive ? "active" : ""}`)
        .text(d => d.label)
        .on("click", (e, d) => {
            console.log("DOM event", e);
            console.log("Attached datum", d);

            if (!d.isActive) {
                // Update isActive state of the filters
                filters_screen.forEach(filter => {
                    filter.isActive = d.id === filter.id;
                });

                // Update button styles
                d3.selectAll("#filters_screen .filter")
                    .classed("active", filter => filter.isActive);

                updateHistogram(d.id, data);
                updateScatterplot(d.id);   // Extension: filter scatterplot too
            }
        });

    const updateHistogram = (filterId, data) => {
        const updatedData = filterId === "all"
            ? data
            : data.filter(tv => tv.screenTech === filterId);

        const updatedBins = binGenerator(updatedData);

        d3.selectAll("#histogram rect")
            .data(updatedBins)
            .transition()
            .duration(500)
            .ease(d3.easeCubicInOut)
            .attr("y", d => yScale(d.length))
            .attr("height", d => innerHeight - yScale(d.length));
    };

    // Extension: fade out circles that don't match the selected screen type
    const updateScatterplot = (filterId) => {
        innerChartS.selectAll("circle")
            .transition()
            .duration(500)
            .attr("opacity", d => (filterId === "all" || d.screenTech === filterId) ? 0.5 : 0)
            .style("pointer-events", d => (filterId === "all" || d.screenTech === filterId) ? "auto" : "none");
    };
};

/************************************/
/*             Tooltip              */
/* (completed in Exercise 6.4)      */
/************************************/
const createTooltip = () => {
    const tooltip = innerChartS
        .append("g")
        .attr("class", "tooltip")
        .style("opacity", 0);

    tooltip
        .append("rect")
        .attr("width", tooltipWidth)
        .attr("height", tooltipHeight)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", barColor)
        .attr("fill-opacity", 0.75);

    tooltip
        .append("text")
        .text("00.0\"")
        .attr("x", tooltipWidth / 2)
        .attr("y", tooltipHeight / 2 + 1)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", white)
        .style("font-weight", 900);
};

const handleMouseEvents = () => {
    // Mouse events for the tooltip will be added in Exercise 6.4
};
