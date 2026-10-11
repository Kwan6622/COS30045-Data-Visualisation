/* =========================================================
   TELEVISION ENERGY CONSUMPTION DATA VISUALISATIONS
   COS30045 Data Visualisation
   ========================================================= */

// Cache-busting timestamps ensure newly edited CSV datasets are always loaded fresh
const getChartSource = filename => `data/${filename}?v=${Date.now()}`;

const chartColours = {
    "LCD": "#0077b6",
    "LCD (LED)": "#00a6d6",
    "OLED": "#f4a261",
    "Average energy consumption": "#0077b6"
};

const formatEnergy = value => `${d3.format(",.1f")(value)} kWh/year`;

const showChartError = container => {
    if (!container) return;
    container.innerHTML = `
        <p class="chart-error">
            The energy data could not be loaded. Please try again later.
        </p>
    `;
};

const createAxisLabel = (group, x, y, text, anchor = "middle") => {
    return group
        .append("text")
        .attr("class", "chart-axis-label")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", anchor)
        .text(text);
};

/* ---------------------------------------------------------
   CHART 1: Average Energy Consumption by Screen Size
   --------------------------------------------------------- */
const drawScreenSizeChart = (container, legendContainer, data) => {
    if (!container) return;

    container.innerHTML = "";
    if (legendContainer) {
        legendContainer.innerHTML = `
            <span class="legend-item">
                <span class="legend-swatch" style="background-color: ${chartColours["Average energy consumption"]}"></span>
                Average labelled energy consumption
            </span>
        `;
    }

    // Large, high-visibility dimensions
    const width = 960;
    const height = 500;
    // margin.left = 115 guarantees generous clearance between Y-axis tick numbers and Y label
    const margin = { top: 45, right: 35, bottom: 65, left: 115 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
        .select(container)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr(
            "aria-label",
            "Vertical bar chart showing average energy consumption by screen size"
        );

    const chartGroup = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const maxValue = d3.max(data, row => row.value);

    const yScale = d3
        .scaleLinear()
        .domain([0, maxValue * 1.15])
        .nice()
        .range([chartHeight, 0]);

    // Horizontal reference grid lines
    chartGroup
        .append("g")
        .attr("class", "chart-grid-lines")
        .call(
            d3.axisLeft(yScale)
                .ticks(6)
                .tickSize(-chartWidth)
                .tickFormat("")
        );

    // Y Axis with ticks
    const yAxis = d3
        .axisLeft(yScale)
        .ticks(6)
        .tickFormat(value => `${value} kWh`);

    chartGroup.append("g").attr("class", "y-axis").call(yAxis);

    const xLabels = data.map(row => row.label);
    const xScale = d3
        .scaleBand()
        .domain(xLabels)
        .range([0, chartWidth])
        .padding(0.35);

    chartGroup
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale));

    // X-axis label
    createAxisLabel(
        chartGroup,
        chartWidth / 2,
        chartHeight + 48,
        "Screen size"
    );

    // Y-axis label - positioned at y = -85 to ensure 20px+ clearance from the numbers (which end around -64px)
    chartGroup
        .append("text")
        .attr("class", "chart-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -85)
        .attr("text-anchor", "middle")
        .text("Average energy consumption (kWh/year)");

    // Bars
    data.forEach(row => {
        chartGroup
            .append("rect")
            .attr("class", "energy-bar")
            .attr("x", xScale(row.label))
            .attr("y", yScale(row.value))
            .attr("width", xScale.bandwidth())
            .attr("height", chartHeight - yScale(row.value))
            .attr("fill", chartColours["Average energy consumption"])
            .attr("rx", 6)
            .append("title")
            .text(`${row.label}: ${formatEnergy(row.value)}`);

        // Prominent numerical value label above each bar
        chartGroup
            .append("text")
            .attr("class", "bar-value-label")
            .attr("x", xScale(row.label) + xScale.bandwidth() / 2)
            .attr("y", yScale(row.value) - 10)
            .attr("text-anchor", "middle")
            .text(`${d3.format(",.1f")(row.value)} kWh`);
    });
};

/* ---------------------------------------------------------
   CHART 2: Average Energy by Display Technology
   --------------------------------------------------------- */
const drawDisplayTechChart = (container, legendContainer, data) => {
    if (!container) return;

    container.innerHTML = "";
    const technologies = ["LCD", "LCD (LED)", "OLED"];

    if (legendContainer) {
        legendContainer.innerHTML = technologies
            .map(
                tech => `
                <span class="legend-item">
                    <span class="legend-swatch" style="background-color: ${chartColours[tech]}"></span>
                    ${tech}
                </span>`
            )
            .join("");
    }

    // Large, high-visibility dimensions
    const width = 960;
    const height = 500;
    // margin.left = 115 guarantees generous clearance between Y-axis tick numbers and Y label
    const margin = { top: 45, right: 35, bottom: 65, left: 115 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
        .select(container)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr(
            "aria-label",
            "Grouped vertical bar chart showing average energy consumption across display technologies and screen sizes"
        );

    const chartGroup = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const maxValue = d3.max(data, row =>
        d3.max(technologies, tech => row[tech])
    );

    const yScale = d3
        .scaleLinear()
        .domain([0, maxValue * 1.15])
        .nice()
        .range([chartHeight, 0]);

    // Horizontal reference grid lines
    chartGroup
        .append("g")
        .attr("class", "chart-grid-lines")
        .call(
            d3.axisLeft(yScale)
                .ticks(6)
                .tickSize(-chartWidth)
                .tickFormat("")
        );

    // Y Axis with ticks
    const yAxis = d3
        .axisLeft(yScale)
        .ticks(6)
        .tickFormat(value => `${value} kWh`);

    chartGroup.append("g").attr("class", "y-axis").call(yAxis);

    const xLabels = data.map(row => row.label);
    const xScale = d3
        .scaleBand()
        .domain(xLabels)
        .range([0, chartWidth])
        .padding(0.24);

    chartGroup
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale));

    // X-axis label
    createAxisLabel(
        chartGroup,
        chartWidth / 2,
        chartHeight + 48,
        "Screen size"
    );

    // Y-axis label - positioned at y = -85 to ensure 20px+ clearance from the numbers (which end around -64px)
    chartGroup
        .append("text")
        .attr("class", "chart-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -85)
        .attr("text-anchor", "middle")
        .text("Average energy consumption (kWh/year)");

    const groupScale = d3
        .scaleBand()
        .domain(technologies)
        .range([0, xScale.bandwidth()])
        .padding(0.08);

    data.forEach(row => {
        technologies.forEach(tech => {
            chartGroup
                .append("rect")
                .attr("class", "energy-bar")
                .attr("x", xScale(row.label) + groupScale(tech))
                .attr("y", yScale(row[tech]))
                .attr("width", groupScale.bandwidth())
                .attr("height", chartHeight - yScale(row[tech]))
                .attr("fill", chartColours[tech])
                .attr("rx", 4)
                .append("title")
                .text(`${row.label}, ${tech}: ${formatEnergy(row[tech])}`);

            // Numerical value label above each grouped bar
            chartGroup
                .append("text")
                .attr("class", "bar-value-label bar-value-label-tech")
                .attr("x", xScale(row.label) + groupScale(tech) + groupScale.bandwidth() / 2)
                .attr("y", yScale(row[tech]) - 8)
                .attr("text-anchor", "middle")
                .text(`${d3.format(",.0f")(row[tech])} kWh`);
        });
    });
};

/* ---------------------------------------------------------
   LOAD DATA & INITIALISE BOTH CHARTS
   --------------------------------------------------------- */
const loadScreenSizeChart = async () => {
    const chartContainer = document.getElementById("chart-screen-size");
    const legendContainer = document.getElementById("legend-screen-size");
    if (!chartContainer) return;

    try {
        const rows = await d3.csv(getChartSource("energy_consumption_screen_size.csv"));
        const data = rows.map(row => ({
            label: row.prediction,
            value: Number(row["Labelled energy consumption (kWh/year)"])
        }));
        drawScreenSizeChart(chartContainer, legendContainer, data);
    } catch (error) {
        console.error("Unable to load screen-size energy data.", error);
        showChartError(chartContainer);
    }
};

const loadDisplayTechChart = async () => {
    const chartContainer = document.getElementById("chart-display-technology");
    const legendContainer = document.getElementById("legend-display-technology");
    if (!chartContainer) return;

    try {
        const rows = await d3.csv(getChartSource("energy_consumption_screen_tech.csv"));
        const data = rows.map(row => ({
            label: row.prediction,
            LCD: Number(row.LCD),
            "LCD (LED)": Number(row["LCD (LED)"]),
            OLED: Number(row.OLED)
        }));
        drawDisplayTechChart(chartContainer, legendContainer, data);
    } catch (error) {
        console.error("Unable to load display-technology energy data.", error);
        showChartError(chartContainer);
    }
};

const initTelevisionCharts = () => {
    loadScreenSizeChart();
    loadDisplayTechChart();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTelevisionCharts);
} else {
    initTelevisionCharts();
}
