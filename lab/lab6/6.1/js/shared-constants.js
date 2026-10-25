/**************************************************/
/*               Declare the constants            */
/**************************************************/
const margin = { top: 40, right: 30, bottom: 50, left: 60 };
const width = 1000;
const height = 500;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

/**************************************************/
/*         Make bin generator accessible          */
/**************************************************/
const binGenerator = d3.bin()
    .value(d => d.energyConsumption);

/**************************************************/
/*       Make the scales accessible globally      */
/**************************************************/
const xScale = d3.scaleLinear();
const yScale = d3.scaleLinear();

/**************************************************/
/*       Make the colours accessible globally     */
/**************************************************/
const bodyBackgroundColor = "#fbf7ee";
const slateGray = "#555d60";
const barColor = "#555d60";
const gray = "#606464";
const white = "#ffffff";
