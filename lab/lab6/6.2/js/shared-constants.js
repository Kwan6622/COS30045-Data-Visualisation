/**************************************************/
/*               Declare the constants            */
/* COS30045 Data Visualisation - Week 6, Ex 6.2   */
/**************************************************/
const margin = { top: 40, right: 30, bottom: 50, left: 60 };
const width = 1000;
const height = 500;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

/**************************************************/
/*         Make bin generator accessible          */
/**************************************************/
// 9 bins spanning 0 to 1800 kWh/year (step 200)
const binGenerator = d3.bin()
    .value(d => d.energyConsumption)
    .domain([0, 1800])
    .thresholds(d3.range(0, 1801, 200));

/**************************************************/
/*       Make the scales accessible globally      */
/**************************************************/
const xScale = d3.scaleLinear()
    .domain([0, 1800])
    .range([0, innerWidth]);

const yScale = d3.scaleLinear()
    .domain([0, 1300])
    .range([innerHeight, 0]);

/**************************************************/
/*       Make filter options accessible globally  */
/**************************************************/
const filters_screen = [
    { id: "all", label: "All", isActive: true },
    { id: "LED", label: "LED", isActive: false },
    { id: "LCD", label: "LCD", isActive: false },
    { id: "OLED", label: "OLED", isActive: false }
];

const filters_size = [
    { id: "all", label: "All Sizes", isActive: true },
    { id: "24", label: "24\"", isActive: false },
    { id: "32", label: "32\"", isActive: false },
    { id: "55", label: "55\"", isActive: false },
    { id: "65", label: "65\"", isActive: false },
    { id: "98", label: "98\"", isActive: false }
];

/**************************************************/
/*       Make the colours accessible globally     */
/**************************************************/
const bodyBackgroundColor = "#fbf7ee";
const slateGray = "#555d60";
const barColor = "#555d60";
const gray = "#606464";
const white = "#ffffff";
