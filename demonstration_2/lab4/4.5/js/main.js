
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

/*Declare canvas*/
const svg = d3.select(".responsive-svg-container")

    .append("svg")

    .attr("viewBox", "0 0 1200 1600")

    .style("border", "1px solid black");


/*Draw bar chart*/
const drawBarChart = data => {
    const barHeight = 20;

    const barSpacing = 5;

    svg
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("class", d => {
    console.log(d);
        return `bar bar-${d.count}`;
    })
    .attr("x", 0)
    .attr("y", (d, i) => i * (barHeight + barSpacing))
    .attr("width", d => d.count)
    .attr("height", barHeight)
    .attr("fill", "blue");
};