# W6.2 Histogram Interaction - TV Energy Consumption with Filters

COS30045 Data Visualisation — Week 6, Exercise 6.2

## Overview

This exercise builds upon the histogram visualization created in Exercise 6.1 by adding interactive filter controls. Users can dynamically filter televisions by **Screen Technology** (All, LED, LCD, OLED) and by **Screen Size** (All Sizes, 24", 32", 55", 65", 98"). When a filter is triggered, the histogram smoothly transitions its bar heights to reflect the distribution of the filtered subset using D3.js transitions.

## Folder Structure

```
6.2/
├── css/
│   ├── base.css              # Page layout, banner, typography, and interactive button styles
│   └── visualisation.css     # Responsive SVG container and axis styling
├── data/
│   └── W6_TVdata.csv         # Cleaned TV Energy Consumption dataset
├── js/
│   ├── histogram.js          # SVG setup, inner chart, bars, axes, and labels (0-1,800 range)
│   ├── interactions.js       # populateFilters & updateHistogram functions
│   ├── load-data.js          # Asynchronous CSV loading, calls drawHistogram and populateFilters
│   └── shared-constants.js   # Global dimensions, scales, binGenerator, and filter arrays
├── index.html                # Semantic HTML5 host page with #filters_screen and #filters_size
└── README.md                 # Project documentation
```

## Key Interactive Features

1. **Screen Technology Filter (`#filters_screen`)**:
   - Filter options: **All**, **LED**, **LCD**, and **OLED**.
   - Uses `d3.selectAll(...).classed("active", ...)` to toggle active button state.
   - Shows market distribution: LED TVs dominate the dataset with higher overall energy variation, while OLED and LCD represent distinct distributions.

2. **Screen Size Filter Extension (`#filters_size`)**:
   - Filter options: **All Sizes**, **24"**, **32"**, **55"**, **65"**, and **98"**.
   - Placed below the chart as an intuitive secondary exploration control.
   - Works cohesively with screen technology filtering.

3. **Smooth D3 Transitions**:
   - Updated bin frequencies animate smoothly using:
     ```javascript
     d3.selectAll("#histogram rect")
         .data(updatedBins)
         .transition()
         .duration(500)
         .ease(d3.easeCubicInOut)
         .attr("y", d => yScale(d.length))
         .attr("height", d => innerHeight - yScale(d.length));
     ```

4. **Bin Consistency**:
   - `binGenerator` maintains consistent domain (`[0, 1800]`) and thresholds across all filtering updates to preserve 1-to-1 mapping with existing SVG rectangles.

## Running Locally

Because D3 loads data via asynchronous HTTP requests (`fetch`), serve the files through a local server:

```powershell
cd 6.2
python -m http.server 8000
```
Then visit **http://localhost:8000** in your browser.
