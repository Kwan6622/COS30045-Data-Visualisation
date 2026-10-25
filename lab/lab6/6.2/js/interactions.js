/**************************************************/
/*                 Interactions                   */
/* COS30045 Data Visualisation - Week 6, Ex 6.2   */
/* Dufour & Meeks (2024) Chapter 6 & 7            */
/**************************************************/

const populateFilters = (data) => {
    /************************************/
    /*  1. Screen Tech Filter Buttons   */
    /************************************/
    d3.select("#filters_screen")
        .selectAll(".filter")
        .data(filters_screen)
        .join("button")
        .attr("class", d => `filter ${d.isActive ? "active" : ""}`)
        .text(d => d.label)
        .on("click", (e, d) => {
            console.log("DOM event:", e);
            console.log("Attached datum:", d);

            if (!d.isActive) {
                // Update isActive state for all screen tech filters
                filters_screen.forEach(filter => {
                    filter.isActive = d.id === filter.id;
                });

                // Update CSS classes using .classed()
                d3.selectAll("#filters_screen .filter")
                    .classed("active", filter => filter.isActive);

                // Update the histogram
                updateHistogram(data);
            }
        });

    /************************************/
    /*  2. Screen Size Filter Buttons   */
    /*     (Lab Extension)             */
    /************************************/
    d3.select("#filters_size")
        .selectAll(".filter")
        .data(filters_size)
        .join("button")
        .attr("class", d => `filter ${d.isActive ? "active" : ""}`)
        .text(d => d.label)
        .on("click", (e, d) => {
            console.log("DOM event:", e);
            console.log("Attached datum:", d);

            if (!d.isActive) {
                // Update isActive state for all screen size filters
                filters_size.forEach(filter => {
                    filter.isActive = d.id === filter.id;
                });

                // Update CSS classes using .classed()
                d3.selectAll("#filters_size .filter")
                    .classed("active", filter => filter.isActive);

                // Update the histogram
                updateHistogram(data);
            }
        });

    /************************************/
    /*  3. Update Histogram Function    */
    /************************************/
    const updateHistogram = (dataset) => {
        const activeTech = filters_screen.find(f => f.isActive)?.id || "all";
        const activeSize = filters_size.find(f => f.isActive)?.id || "all";

        let updatedData = dataset;

        // Filter by screen technology if not 'all'
        if (activeTech !== "all") {
            updatedData = updatedData.filter(d => d.screenTech.toLowerCase() === activeTech.toLowerCase());
        }

        // Filter by screen size if not 'all'
        if (activeSize !== "all") {
            updatedData = updatedData.filter(d => Math.round(d.screenSize) === Number(activeSize));
        }

        console.log(`Filtered Data (${activeTech}, ${activeSize}"):`, updatedData.length);

        // Recalculate bins using global bin generator
        const updatedBins = binGenerator(updatedData);

        // Transition bars smoothly to new heights
        d3.selectAll("#histogram rect")
            .data(updatedBins)
            .transition()
            .duration(500)
            .ease(d3.easeCubicInOut)
            .attr("y", d => yScale(d.length))
            .attr("height", d => innerHeight - yScale(d.length));
    };
};

// Also support lowercase naming mentioned in requirements.txt
const populatefilters = populateFilters;
