/**************************************************/
/*               Declare the constants            */
/* COS30045 Data Visualisation - Week 6, Ex 6.4   */
/**************************************************/
const margin = { top: 40, right: 30, bottom: 50, left: 70 };
const width = 1000;
const height = 500;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

/**************************************************/
/*         Make bin generator accessible          */
/**************************************************/
// Fixed domain/thresholds so filtered data always produces the same 14 bins
const binGenerator = d3.bin()
    .value(d => d.energyConsumption)
    .domain([0, 2800])
    .thresholds(d3.range(0, 2800, 200));

/**************************************************/
/*       Make the scales accessible globally      */
/**************************************************/
// Histogram scales
const xScale = d3.scaleLinear();
const yScale = d3.scaleLinear();

// Scatterplot scales
const xScaleS = d3.scaleLinear();
const yScaleS = d3.scaleLinear();

// Colour scale for screen type (domain/range set in scatterplot.js)
const colorScale = d3.scaleOrdinal();

/**************************************************/
/*        Scatterplot inner chart reference       */
/**************************************************/
// Distinguishes the scatterplot inner chart from the histogram inner chart
let innerChartS;

// Histogram inner chart reference (used for histogram tooltips)
let innerChartH;

/**************************************************/
/*                Tooltip dimensions              */
/**************************************************/
const tooltipWidth = 65;
const tooltipHeight = 32;

// Multi-line tooltips resize to fit their text
const tooltipPadding = 8;
const tooltipLineHeight = 16;

/**************************************************/
/*       Make filter options accessible globally  */
/**************************************************/
const filters_screen = [
    { id: "all", label: "All", isActive: true },
    { id: "LED", label: "LED", isActive: false },
    { id: "LCD", label: "LCD", isActive: false },
    { id: "OLED", label: "OLED", isActive: false }
];

// Extension: scatterplot-only filter for the most common screen sizes
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
