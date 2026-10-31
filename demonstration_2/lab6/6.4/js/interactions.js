/**************************************************/
/*                 Interactions                   */
/* COS30045 Data Visualisation - Week 6, Ex 6.4   */
/* Dufour & Meeks (2024) Chapter 7                */
/**************************************************/

/************************************/
/*             Filters              */
/************************************/
const populateFilters = (data) => {

    // Screen type filter (updates histogram AND scatterplot)
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
                filters_screen.forEach(filter => {
                    filter.isActive = d.id === filter.id;
                });

                d3.selectAll("#filters_screen .filter")
                    .classed("active", filter => filter.isActive);

                updateHistogram(d.id, data);
                updateScatterplot();
            }
        });

    // Extension: screen size filter (scatterplot only)
    d3.select("#filters_size")
        .selectAll(".filter")
        .data(filters_size)
        .join("button")
        .attr("class", d => `filter ${d.isActive ? "active" : ""}`)
        .text(d => d.label)
        .on("click", (e, d) => {
            if (!d.isActive) {
                filters_size.forEach(filter => {
                    filter.isActive = d.id === filter.id;
                });

                d3.selectAll("#filters_size .filter")
                    .classed("active", filter => filter.isActive);

                updateScatterplot();
            }
        });

    const updateHistogram = (filterId, data) => {
        const updatedData = filterId === "all"
            ? data
            : data.filter(tv => tv.screenTech === filterId);

        const updatedBins = binGenerator(updatedData);

        d3.selectAll("#histogram rect.bar")
            .data(updatedBins)
            .transition()
            .duration(500)
            .ease(d3.easeCubicInOut)
            .attr("y", d => yScale(d.length))
            .attr("height", d => innerHeight - yScale(d.length));
    };

    // Extension: show only circles matching BOTH the screen type and screen size filters
    const updateScatterplot = () => {
        const activeTech = filters_screen.find(f => f.isActive).id;
        const activeSize = filters_size.find(f => f.isActive).id;

        const isVisible = d =>
            (activeTech === "all" || d.screenTech === activeTech) &&
            (activeSize === "all" || Math.round(d.screenSize) === +activeSize);

        hideTooltip(".tooltip-scatter");

        innerChartS.selectAll("circle")
            .style("pointer-events", d => isVisible(d) ? "auto" : "none")
            .transition()
            .duration(500)
            .attr("opacity", d => isVisible(d) ? 0.5 : 0);
    };
};

/************************************/
/*          Create tooltips         */
/************************************/
// Builds a hidden tooltip (rect + text) inside the given inner chart
const appendTooltip = (chart, className) => {
    const tooltip = chart
        .append("g")
        .attr("class", `tooltip ${className}`)
        .style("opacity", 0);

    tooltip
        .append("rect")
        .attr("width", tooltipWidth)
        .attr("height", tooltipHeight)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", barColor)
        .attr("fill-opacity", 0.85);

    tooltip
        .append("text")
        .attr("fill", white);
};

const createTooltip = () => {
    appendTooltip(innerChartS, "tooltip-scatter");   // scatterplot
    appendTooltip(innerChartH, "tooltip-hist");      // Extension: histogram
};

/************************************/
/*        Tooltip helpers           */
/************************************/
// Fill the tooltip with one line per item, resize it to fit, and place it above (x, y)
const showTooltip = (selector, lines, x, y) => {
    const tooltip = d3.select(selector);

    // One <tspan> per line; first line bold
    tooltip.select("text")
        .selectAll("tspan")
        .data(lines)
        .join("tspan")
        .attr("x", tooltipPadding)
        .attr("y", (d, i) => tooltipPadding + 12 + i * tooltipLineHeight)
        .style("font-weight", (d, i) => i === 0 ? 900 : 400)
        .text(d => d);

    // Resize background to fit the text
    const textBox = tooltip.select("text").node().getBBox();
    const w = Math.max(tooltipWidth, textBox.width + 2 * tooltipPadding);
    const h = lines.length * tooltipLineHeight + 2 * tooltipPadding - 2;

    tooltip.select("rect")
        .attr("width", w)
        .attr("height", h);

    // Centre above the point, keeping the tooltip inside the chart
    let tx = Math.min(Math.max(x - w / 2, 0), innerWidth - w);
    let ty = y - h - 10;
    if (ty < 0) ty = y + 10;   // flip below if there's no room above

    tooltip
        .attr("transform", `translate(${tx}, ${ty})`)
        .raise()
        .transition()
        .duration(200)
        .style("opacity", 1);
};

const hideTooltip = (selector) => {
    d3.select(selector)
        .interrupt()
        .style("opacity", 0)
        .attr("transform", `translate(0, 500)`);
};

// "philips" -> "Philips", "tcl electronics" -> "Tcl Electronics"
const capitalise = str => str.replace(/\b\w/g, c => c.toUpperCase());

/************************************/
/*       Handle mouse events        */
/************************************/
const handleMouseEvents = () => {

    // Scatterplot: brand, model and screen size
    innerChartS.selectAll("circle")
        .on("mouseenter", (e, d) => {
            console.log("Mouse entered circle", d);

            const cx = +e.target.getAttribute("cx");
            const cy = +e.target.getAttribute("cy");

            showTooltip(".tooltip-scatter", [
                capitalise(d.brand),
                `Model: ${d.model}`,
                `Screen size: ${d.screenSize}"`
            ], cx, cy);
        })
        .on("mouseleave", (e, d) => {
            console.log("Mouse left circle", d);
            hideTooltip(".tooltip-scatter");
        });

    // Extension: histogram tooltip with TV count and energy range of the bar
    innerChartH.selectAll("rect.bar")
        .on("mouseenter", (e, d) => {
            const x = +e.target.getAttribute("x") + +e.target.getAttribute("width") / 2;
            const y = yScale(d.length);   // final bar top (safe during transitions)

            showTooltip(".tooltip-hist", [
                `${d3.format(",")(d.length)} TVs`,
                `${d3.format(",")(d.x0)}–${d3.format(",")(d.x1)} kWh/year`
            ], x, y);

            d3.select(e.target).attr("fill", gray).attr("fill-opacity", 0.8);
        })
        .on("mouseleave", (e) => {
            hideTooltip(".tooltip-hist");
            d3.select(e.target).attr("fill", slateGray).attr("fill-opacity", 1);
        });
};
