# Appliance Energy Consumption Website

## Overview

The **Appliance Energy Consumption Website** is an educational website designed to help Australian consumers understand household appliance energy consumption and its potential impact on electricity costs.

The website was originally developed as part of **Exercise 0.2** and subsequently extended for **Exercise 3** in **COS30045 – Data Visualisation** at Swinburne University of Technology.

The latest version introduces improved data visualisations, more comprehensive Exploratory Data Analysis (EDA), and an electricity pricing API to provide more relevant electricity cost estimates for Australian consumers.

The project also demonstrates fundamental web development concepts using HTML, CSS, and JavaScript, alongside data preparation and visualisation techniques using KNIME.

---

## Version History

### Version 2.0 – Improved Data Visualisation and Electricity Pricing

This version focuses on improving the accuracy, interpretability, and practical value of the television energy consumption analysis.

**Major Updates:**

- **Australian Electricity Pricing API:** Integrated an API to retrieve electricity pricing information for Australia, allowing electricity cost estimates to be calculated using updated pricing data instead of relying solely on fixed electricity rates.
- **Improved Cost Estimation:** Enhanced electricity cost calculations by connecting estimated annual energy consumption (kWh/year) with electricity prices (AUD/kWh).
- **Additional Data Visualisations:** Introduced new charts to explore the relationships between television characteristics, energy efficiency ratings, annual energy consumption, and estimated electricity costs.
- **Enhanced Exploratory Data Analysis:** Refined the KNIME workflows to provide more meaningful comparisons between television screen sizes and screen technologies.
- **Balanced Sampling:** Applied equal-size sampling where appropriate to reduce sample imbalance between screen technology categories.
- **Improved Screen Size Comparisons:** Introduced comparisons between televisions of similar screen sizes to reduce the influence of screen size when evaluating differences between screen technologies.
- **Energy Star Rating Analysis:** Improved the interpretation of Energy Star Ratings by examining their relationship with annual electricity consumption and television screen size.
- **Clearer Data Storytelling:** Updated chart titles, labels, annotations, and supporting explanations to help readers understand the visualisations and their limitations.

These changes aim to make the website more useful for consumers who want to consider both energy efficiency and estimated electricity expenses when comparing televisions.

### Version 1.0 – Initial Website and Visualisation

The initial version established the foundation of the website.

**Features included:**

- Three-page website structure: Home, Televisions, and About Us.
- Consistent navigation menu with active page indicators.
- Responsive layouts using CSS media queries.
- Interactive FAQ accordion using JavaScript.
- Initial television energy consumption visualisation.
- Basic data preparation and aggregation using KNIME.
- Supporting explanatory text and data storytelling.

---

## Live Website

The website can be accessed here:

[View the Appliance Energy Consumption Website](https://mercury.swin.edu.au/cos30045/s104992981/AUS-TV-ENERGY/index.html)

---

## Pages

The website contains three main HTML pages:

1. **Home:** Introduces appliance energy consumption, electricity costs, and general information through an interactive FAQ.
2. **Televisions:** Presents television energy consumption visualisations, efficiency comparisons, and estimated electricity costs.
3. **About Us:** Provides background information about the website and its educational purpose.

---

## Features

### Navigation

All pages contain a consistent navigation menu.

The navigation includes:

- Power logo linking to the Home page.
- Home, Televisions, and About Us links.
- Hover effects.
- Active page indicators.

### Television Energy Visualisation

The **Televisions** page presents charts based on the television energy consumption dataset.

The visualisations examine relationships between:

- Television screen size and annual energy consumption.
- Screen technology and energy consumption.
- Energy Star Ratings and annual electricity usage.
- Energy consumption among televisions with comparable screen sizes.
- Estimated annual electricity costs based on electricity pricing data.

The visualisations are supported by explanatory text to communicate the main patterns and encourage readers to interpret the charts critically.

### Australian Electricity Pricing API

Version 2.0 introduces an electricity pricing API to improve estimated running costs for television products in Australia.

Rather than calculating electricity costs using only a fixed, manually entered electricity rate, the website can use electricity pricing information obtained through the API.

Estimated annual electricity costs are calculated using:

**Estimated Annual Cost (AUD) = Annual Energy Consumption (kWh) × Electricity Price (AUD/kWh)**

This allows the website to connect energy consumption data with electricity cost estimates that are more relevant to the Australian market.

However, the estimates are indicative rather than exact household electricity bills. Actual electricity prices may vary depending on state, electricity retailer, tariff structure, billing period, and household usage.

The accuracy and freshness of the estimate also depend on the data provided by the API.

### Improved Exploratory Data Analysis

The KNIME analysis workflow has been refined to improve the quality and interpretability of the visualisations.

Key improvements include:

- Reviewing relevant data attributes and missing values.
- Converting and grouping television screen sizes.
- Comparing annual energy consumption across screen technologies.
- Applying equal-size random sampling for selected comparisons.
- Comparing televisions of similar screen sizes.
- Investigating the relationship between Energy Star Ratings and electricity consumption.
- Calculating average energy consumption for selected groups.
- Reviewing the distribution of television records across categories.

These improvements help distinguish general patterns from comparisons that may be influenced by differences in screen size or sample distribution.

### FAQ Accordion

The Home page contains an interactive FAQ section.

FAQ answers are hidden by default and can be displayed by clicking the corresponding question.

JavaScript is used to control the accordion behaviour.

### Responsive Design

CSS media queries are used to adapt the website layout to different screen sizes, including desktop, tablet, and mobile devices.

---

# Data Story

## Audience

The primary audience is **Australian consumers interested in understanding television energy consumption, energy efficiency, and potential electricity costs**.

The website is also intended for consumers comparing televisions who want to understand how characteristics such as screen size, screen technology, and Energy Star Rating relate to electricity usage.

The visualisations are designed for a general audience without requiring advanced knowledge of data analysis.

## Audience Interest

Energy consumption is an important consideration when purchasing household appliances because electricity usage contributes to ongoing household expenses.

When choosing a television, consumers may consider:

- Whether larger televisions generally consume more electricity.
- How different screen technologies compare in energy consumption.
- Whether a higher Energy Star Rating always means lower annual electricity usage.
- How much a television may cost to operate annually.
- Why televisions with similar ratings can have different electricity consumption levels.

The website aims to make these relationships easier to understand through data visualisation and practical electricity cost estimates.

## Story

**Story Title: Beyond the Energy Star Rating – Understanding the Real Energy Cost of Televisions**

The data story investigates how television characteristics relate to annual electricity consumption and estimated operating costs.

Rather than relying on a single characteristic, such as screen technology or Energy Star Rating, the visualisations encourage readers to consider multiple factors when comparing televisions.

The story follows four main questions.

### 1. How Does Screen Size Relate to Energy Consumption?

The first analysis examines the relationship between television screen size and annual electricity consumption.

Scatter plots and aggregated bar charts are used to explore energy consumption patterns across different screen sizes.

This helps readers investigate whether larger screens are generally associated with greater electricity usage.

### 2. Does Screen Technology Make a Difference?

The second analysis compares annual energy consumption across different screen technologies, including LCD, LCD (LED), and OLED.

Equal-size sampling is used for selected comparisons to reduce differences in sample counts.

Additional comparisons involving televisions of similar sizes help reduce the influence of screen size when examining differences between technologies.

These analyses explore associations rather than proving that screen technology directly causes differences in energy consumption.

### 3. Does the Same Energy Star Rating Mean the Same Electricity Consumption?

The third analysis explores the relationship between Energy Star Ratings and annual electricity consumption.

Energy Star Ratings indicate relative energy efficiency under a standardised rating methodology, while annual energy consumption estimates the total electricity a product uses under standardised testing assumptions.

Two televisions with the same Energy Star Rating may still consume different amounts of electricity, particularly when their screen sizes differ.

The visualisations therefore encourage readers to examine both Energy Star Ratings and annual electricity consumption when comparing products.

### 4. What Does Energy Consumption Mean for Electricity Costs?

The final part of the story connects annual electricity consumption to estimated electricity expenses.

By incorporating electricity pricing information from an API, the website translates energy usage into a financial measure that may be easier for consumers to understand.

This allows readers to consider not only how much electricity a television uses, but also its estimated annual operating cost.

**Main Message:**

Choosing an energy-efficient television involves more than comparing screen technology or Energy Star Ratings. Screen size, annual electricity consumption, and local electricity prices should also be considered to better understand potential operating costs.

---

# About the Data

## Data Source

The project uses the **television energy consumption dataset provided for COS30045 – Data Visualisation at Swinburne University of Technology**.

The dataset contains television product information relevant to the Australian market, including attributes such as:

- Television screen size.
- Screen technology.
- Energy Star Rating.
- Labelled annual energy consumption (kWh/year).
- Product and manufacturer information.

The records describe registered television products and should not be interpreted as actual television sales volumes or consumer purchasing preferences.

### Electricity Pricing Data

An external API is used to retrieve electricity pricing information relevant to Australia.

The retrieved pricing data supports estimated annual electricity cost calculations.

Electricity prices may differ between locations, retailers, and tariff plans. Therefore, the pricing information is used to provide indicative comparisons rather than guaranteed household electricity costs.

---

## Data Processing

The television dataset was cleaned, explored, and transformed using **KNIME** before being used in the visualisations.

Data preparation and analysis included:

- Selecting relevant television attributes.
- Checking data quality and missing values.
- Filtering records where appropriate.
- Converting screen sizes into suitable measurement units.
- Rounding or grouping screen sizes to simplify comparisons.
- Applying equal-size sampling to selected technology comparisons.
- Grouping records by screen size and screen technology.
- Calculating average annual energy consumption.
- Exploring Energy Star Rating distributions.
- Comparing energy consumption among televisions of similar screen sizes.
- Reshaping aggregated data for chart generation.

The improved workflow aims to produce clearer comparisons and reduce misleading interpretations caused by differences in sample sizes or television characteristics.

---

## Privacy

The television dataset contains product information rather than personal information about individuals.

The visualisations do not require personal names, addresses, contact details, or other personally identifiable information.

The electricity pricing API is used to retrieve pricing information for cost estimation and does not require the television dataset to contain personal household information.

Consequently, privacy risks associated with the dataset are relatively low.

---

## Accuracy and Limitations

The website has been improved to present more meaningful comparisons, but several limitations remain.

- **Dataset Coverage:** The dataset may not represent every television currently sold in Australia.
- **Product Records vs Sales:** The number of registered television records does not represent the number of units sold or consumer purchasing preferences.
- **Screen Size Differences:** Energy consumption comparisons can be affected by differences in television screen sizes.
- **Sampling:** Equal-size sampling balances group counts but may not preserve the original dataset distribution or control for every relevant variable.
- **Energy Star Ratings:** Televisions with the same efficiency rating may still have different annual electricity consumption.
- **Estimated Consumption:** Labelled energy consumption is based on standardised assumptions and may differ from actual household electricity usage.
- **Electricity Pricing:** API-provided electricity prices may vary in freshness, coverage, and applicability to individual households.
- **Additional Factors:** Television brightness, display settings, usage habits, model specifications, and other characteristics