/**************************************************/
/*                 Load Data                      */
/* COS30045 Data Visualisation - Week 6           */
/**************************************************/

// Load TV dataset
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
    console.log("Processed Data:", data);

    // Call visualization function with processed data
    if (typeof drawHistogram === "function") {
        drawHistogram(data);
    } else {
        window.addEventListener("DOMContentLoaded", () => {
            drawHistogram(data);
        });
    }
}).catch(error => {
    console.error("Error loading TV data:", error);
});
