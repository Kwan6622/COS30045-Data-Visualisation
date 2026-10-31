const drawDonutChart = data => {
    const width = 700;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 30;

    const svg = d3.select("#donut-chart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "Proportion of small, medium and large television models");

    const innerChart = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.size))
        .range(["#0077b6", "#f4a261", "#d1495b"]);

    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

    const arcGenerator = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius);

    const labelArc = d3.arc()
        .innerRadius(radius * 1.1)
        .outerRadius(radius * 1.1);

    const leaderStartArc = d3.arc()
        .innerRadius(radius)
        .outerRadius(radius);

    const totalCount = d3.sum(data, d => d.count);
    const largestSize = d3.max(data, d => d.count);
    const pieData = pie(data);

    const sliceOffset = d => {
        if (d.data.count !== largestSize) {
            return [0, 0];
        }

        const angle = (d.startAngle + d.endAngle) / 2;
        return [Math.cos(angle - Math.PI / 2) * 15,
            Math.sin(angle - Math.PI / 2) * 15];
    };

    const arcs = innerChart.selectAll(".arc")
        .data(pieData)
        .join("g")
        .attr("class", "arc")
        .attr("transform", d => `translate(${sliceOffset(d)})`);

    arcs.append("path")
        .attr("d", arcGenerator)
        .attr("fill", d => colorScale(d.data.size))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2);

    arcs.append("polyline")
        .attr("class", "leader-line")
        .attr("points", d => {
            const [startX, startY] = leaderStartArc.centroid(d);
            const [elbowX, elbowY] = labelArc.centroid(d);
            const labelX = elbowX >= 0 ? radius * 1.35 : -radius * 1.35;

            return `${startX},${startY} ${elbowX},${elbowY} ${labelX},${elbowY}`;
        });

    arcs.append("text")
        .attr("class", "slice-percentage")
        .attr("transform", d => `translate(${arcGenerator.centroid(d)})`)
        .attr("text-anchor", "middle")
        .text(d => `${((d.data.count / totalCount) * 100).toFixed(1)}%`);

    arcs.append("text")
        .attr("class", "donut-label")
        .attr("x", d => labelArc.centroid(d)[0] >= 0
            ? radius * 1.35
            : -radius * 1.35)
        .attr("y", d => labelArc.centroid(d)[1])
        .attr("text-anchor", d => labelArc.centroid(d)[0] >= 0
            ? "start"
            : "end")
        .text(d => d.data.size);
};

d3.csv("data/size_count.csv", d => ({
    size: d.prediction,
    count: Number(d["Count*(screensize)"])
})).then(data => {
    drawDonutChart(data);
}).catch(error => {
    console.error("Unable to load television size data:", error);
});
