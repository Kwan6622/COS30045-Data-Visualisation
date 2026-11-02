# Global Incarceration Rates

This demonstration uses D3 v7 and a world TopoJSON boundary file to display prison population rates per 100,000 people. It includes:

- stepped legend filtering with a no-data hatch;
- country search, continent filters and palette selection;
- hover tooltips, click-to-focus country details and map zoom;
- dark mode and CSV export.

The default palette is the World Prison Brief / Pew-inspired warm gold-brown scale. Use the palette selector to switch to Crimson or Viridis.

Open [index.html](./index.html) in a local web server because browsers block `d3.csv` and TopoJSON requests from `file://` pages.
