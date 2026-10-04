const chartOverlay = document.getElementById("chart-overlay");
const chartClose = document.getElementById("chart-close");
const chartDialogTitle = document.getElementById("chart-dialog-title");
const chartDialogDescription = document.getElementById(
    "chart-dialog-description"
);
const chartLegend = document.getElementById("chart-legend");
const energyChart = document.getElementById("energy-chart");
const chartTriggers = document.querySelectorAll(".chart-trigger");

const chartSources = {
    "screen-size": "data/energy_consumption_screen_size.csv",
    "display-technology": "data/energy_consumption_screen_tech.csv"
};

const chartColours = {
    "LCD": "#0077b6",
    "LCD (LED)": "#00a6d6",
    "OLED": "#f4a261",
    "Average energy consumption": "#0077b6"
};

let lastTrigger;

const formatEnergy = value => `${d3.format(",.1f")(value)} kWh/year`;

const closeChart = () => {
    chartOverlay.classList.remove("is-visible");
    chartOverlay.setAttribute("aria-hidden", "true");

    if (lastTrigger) {
        lastTrigger.focus();
    }
};

const showChartError = () => {
    energyChart.innerHTML = `
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

const drawChart = (chartType, data) => {
    const isTechnologyChart = chartType === "display-technology";
    const width = 760;
    const height = 430;
    const margin = { top: 25, right: 25, bottom: 75, left: 75 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    energyChart.innerHTML = "";
    chartLegend.innerHTML = "";

    const svg = d3
        .select(energyChart)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr(
            "aria-label",
            isTechnologyChart
                ? "Average energy consumption by screen size and display technology"
                : "Average energy consumption by screen size"
        );

    const chartGroup = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const maxValue = isTechnologyChart
        ? d3.max(data, row =>
            d3.max(
                ["LCD", "LCD (LED)", "OLED"],
                technology => row[technology]
            )
        )
        : d3.max(data, row => row.value);

    const yScale = d3
        .scaleLinear()
        .domain([0, maxValue * 1.15])
        .nice()
        .range([chartHeight, 0]);

    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(value => `${value} kWh`);
    chartGroup.append("g").call(yAxis);

    const xLabels = data.map(row => row.label);
    const xScale = d3
        .scaleBand()
        .domain(xLabels)
        .range([0, chartWidth])
        .padding(isTechnologyChart ? 0.2 : 0.3);

    chartGroup
        .append("g")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale));

    createAxisLabel(
        chartGroup,
        chartWidth / 2,
        chartHeight + 58,
        "Screen size"
    );
    createAxisLabel(
        chartGroup,
        -chartHeight / 2,
        -55,
        "Average energy consumption (kWh/year)"
    ).attr("transform", `rotate(-90, ${-chartHeight / 2}, -55)`);

    if (isTechnologyChart) {
        const technologies = ["LCD", "LCD (LED)", "OLED"];
        const groupScale = d3
            .scaleBand()
            .domain(technologies)
            .range([0, xScale.bandwidth()])
            .padding(0.08);

        data.forEach(row => {
            technologies.forEach(technology => {
                chartGroup
                    .append("rect")
                    .attr("class", "energy-bar")
                    .attr("x", xScale(row.label) + groupScale(technology))
                    .attr("y", yScale(row[technology]))
                    .attr("width", groupScale.bandwidth())
                    .attr("height", chartHeight - yScale(row[technology]))
                    .attr("fill", chartColours[technology])
                    .append("title")
                    .text(`${row.label}, ${technology}: ${formatEnergy(row[technology])}`);
            });
        });

        technologies.forEach(technology => {
            chartLegend.insertAdjacentHTML(
                "beforeend",
                `<span class="legend-item">
                    <span class="legend-swatch" style="background-color: ${chartColours[technology]}"></span>
                    ${technology}
                </span>`
            );
        });
    } else {
        data.forEach(row => {
            chartGroup
                .append("rect")
                .attr("class", "energy-bar")
                .attr("x", xScale(row.label))
                .attr("y", yScale(row.value))
                .attr("width", xScale.bandwidth())
                .attr("height", chartHeight - yScale(row.value))
                .attr("fill", chartColours["Average energy consumption"])
                .append("title")
                .text(`${row.label}: ${formatEnergy(row.value)}`);
        });

        chartLegend.innerHTML = `
            <span class="legend-item">
                <span class="legend-swatch" style="background-color: ${chartColours["Average energy consumption"]}"></span>
                Average labelled energy consumption
            </span>
        `;
    }
};

const loadChart = async chartType => {
    const source = chartSources[chartType];

    try {
        const rows = await d3.csv(source);

        if (chartType === "screen-size") {
            drawChart(
                chartType,
                rows.map(row => ({
                    label: row.prediction,
                    value: Number(row["Labelled energy consumption (kWh/year)"])
                }))
            );
            return;
        }

        drawChart(
            chartType,
            rows.map(row => ({
                label: row.prediction,
                LCD: Number(row.LCD),
                "LCD (LED)": Number(row["LCD (LED)"]),
                OLED: Number(row.OLED)
            }))
        );
    } catch (error) {
        console.error("Unable to load television energy chart data.", error);
        showChartError();
    }
};

const openChart = trigger => {
    const chartType = trigger.dataset.chart;
    lastTrigger = trigger;

    chartDialogTitle.textContent =
        chartType === "screen-size"
            ? "Average energy by screen size"
            : "Average energy by display technology";
    chartDialogDescription.textContent =
        chartType === "screen-size"
            ? "Compare the average labelled energy consumption of small, medium and large televisions."
            : "Compare average labelled energy consumption across display technologies and screen sizes.";

    chartOverlay.classList.add("is-visible");
    chartOverlay.setAttribute("aria-hidden", "false");
    chartClose.focus();
    loadChart(chartType);
};

chartTriggers.forEach(trigger => {
    trigger.addEventListener("click", () => openChart(trigger));
});

chartClose.addEventListener("click", closeChart);

chartOverlay.addEventListener("click", event => {
    if (event.target === chartOverlay) {
        closeChart();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && chartOverlay.classList.contains("is-visible")) {
        closeChart();
    }
});
