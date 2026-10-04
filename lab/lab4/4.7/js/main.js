
const svg = d3.select(".responsive-svg-container")

    .append("svg")

    .attr("viewBox", "0 0 500 1400")

    .style("border", "1px solid black");

/*Load data and Console check*/
d3.csv("data/AUS_TV_models.csv", d => {
    return {
        brand: d.brand,
        count: +d.model_count
    };
}).then(data => {
    console.log(data);
    console.log(data.length);
    console.log(d3.max(data, d => d.count));
    console.log(d3.min(data, d => d.count));
    console.log(d3.extent(data, d => d.count));
    data.sort((a, b) => b.count - a.count);
    console.log(data); 
    drawBarChart(data); 
}); 

/*Draw bar chart*/
const drawBarChart = data => {
    /*const barHeight = 20;*/

    /*const barSpacing = 5;*/

    const xScale = d3.scaleLinear()
    .domain([0, 1200])
    .range([0, 400]);

    const yScale = d3.scaleBand()
    .domain(data.map(d => d.brand))
    .range([0, 1400])
    .padding(0.1);

    const barAndLabel = svg
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (d, i) => `translate(0, ${yScale(d.brand)})`);

    barAndLabel
    .append("rect")
    .attr("class", d => `bar bar-${d.count}`)
    .attr("width", d => xScale(d.count))
    .attr("height", yScale.bandwidth())
    .attr("fill", "#0077b6")
    .attr("x", 100)
    .attr("y",0);

    barAndLabel
    .append("text")
    .text(d => d.brand)
    .attr("x", 90)
    .attr("y", 15)
    .attr("text-anchor", "end")
    .style("font-size", "13px");

    barAndLabel
    .append("text")
    .text(d => d.count)
    .attr("x", d => 100 + xScale(d.count) + 5)
    .attr("y", 15)
    .style("font-size", "13px");

};