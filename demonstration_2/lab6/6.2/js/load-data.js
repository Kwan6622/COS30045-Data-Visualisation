/**************************************************/
/*                 Load Data                      */
/* COS30045 Data Visualisation - Week 6, Ex 6.2   */
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
    // Exclude the extreme single outlier (> 1800 kWh/year) to fit the 0-1800 domain
    const cleanData = data.filter(d => d.energyConsumption <= 1800);
    console.log("Processed Data (count):", cleanData.length);

    // Initial render of histogram
    if (typeof drawHistogram === "function") {
        drawHistogram(cleanData);
    }

    // Populate filter buttons and event handlers
    if (typeof populateFilters === "function") {
        populateFilters(cleanData);
    }
}).catch(error => {
    console.error("Error loading TV data:", error);
});
