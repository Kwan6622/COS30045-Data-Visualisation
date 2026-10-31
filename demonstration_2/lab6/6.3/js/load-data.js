/**************************************************/
/*                 Load Data                      */
/* COS30045 Data Visualisation - Week 6, Ex 6.3   */
/**************************************************/

d3.csv("data/W6_TVdata.csv", d => {
    return {
        brand: d.brand,
        model: d.model,
        screenSize: +d.screenSize,
        screenTech: d.screenTech,
        star: +d.star,
        energyConsumption: +d.energyConsumption
    };
}).then(data => {
    console.log(data);

    drawHistogram(data);
    drawScatterplot(data);
    populateFilters(data);

    // Called after the charts are drawn so they already contain data
    createTooltip();
    handleMouseEvents();
}).catch(error => {
    console.error("Error loading TV data:", error);
});
