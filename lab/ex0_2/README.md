# Appliance Energy Consumption Website

## Overview

The **Appliance Energy Consumption Website** is a small educational website about household appliance energy consumption in the Australian market.

The website was originally developed as part of Exercise 0.2 and has been extended for **Exercise 3** to communicate a data story about **television energy consumption** through data visualisation and supporting contextual information.

The project also demonstrates fundamental web development concepts using HTML, CSS and JavaScript.

## Live Website

The website can be accessed here:

**[View the Appliance Energy Consumption Website](https://mercury.swin.edu.au/cos30045/s104992981/test/index.html)**

## Pages

The website contains three HTML pages:

- Home
- Televisions
- About Us

## Features

### Navigation

All pages contain a consistent navigation menu.

The navigation includes:

- Power logo
- Home link
- Televisions link
- About Us link
- Hover effects
- Active page indicator

Clicking the Power logo returns the user to the Home page.

### Television Energy Visualisation

The **Televisions** page presents visualisations based on the television energy consumption dataset.

The visualisation is supported by explanatory text that provides context for the reader and helps communicate the main patterns in the data rather than presenting the chart by itself.

### FAQ Accordion

The Home page contains an FAQ section.

The FAQ answers are hidden by default and can be revealed by clicking the corresponding question.

JavaScript is used to control the accordion behaviour.

### Responsive Design

CSS media queries are used to make the website responsive across desktop, tablet and mobile screen sizes.

---

# Data Story

## Audience

The primary audience for this visualisation is **Australian consumers who are interested in understanding the energy consumption of televisions**.

The visualisation may also be useful for people who are comparing televisions and want to understand how characteristics such as **screen size and screen technology relate to energy consumption**.

The visualisation is designed for a general audience, so it focuses on presenting the information in a clear and accessible way without requiring advanced knowledge of data analysis.

## Audience Interest

Energy consumption is an important consideration when purchasing household appliances because appliances with higher energy consumption can contribute to greater electricity usage over time.

For televisions, consumers may be interested in understanding whether larger screen sizes or different screen technologies are associated with different levels of energy consumption.

The visualisation therefore aims to help the audience explore these relationships and make the dataset easier to understand.

## Story

The data story focuses on the relationship between **television characteristics and energy consumption**.

Rather than displaying the television dataset as a large table of individual products, the visualisation groups and summarises the data to reveal patterns more clearly.

In particular, the visualisation explores how energy consumption varies according to factors such as:

- Television screen size
- Screen technology
- Average energy consumption

This allows the reader to compare groups of televisions and identify patterns in how different television characteristics relate to energy usage.

The accompanying text on the website provides context for the visualisation and explains what the reader should consider when interpreting the chart.

---

# About the Data

## Data Source

The project uses the **television energy consumption dataset provided for COS30045 – Data Visualisation at Swinburne University of Technology**.

The dataset contains information about television products available in the Australian market, including attributes used to examine their characteristics and energy consumption.

## Data Processing

The original dataset was processed and transformed before being used for visualisation.

Data preparation included tasks such as:

- Filtering the dataset to relevant television records
- Cleaning and checking relevant attributes
- Converting measurement units where necessary
- Rounding or grouping screen sizes for clearer comparison
- Grouping records by screen size and screen technology
- Calculating summary values such as average energy consumption
- Reshaping the data where required for visualisation

Data processing and exploration were performed using **KNIME**.

These transformations make the dataset easier to visualise and allow patterns between television characteristics and energy consumption to be communicated more clearly.

## Privacy

The dataset contains information about television products rather than personal information about individuals.

Therefore, the visualisation does not use names, addresses, contact details or other personally identifiable information.

As a result, the privacy risk associated with this dataset is relatively low.

## Accuracy and Limitations

The visualisation depends on the accuracy and completeness of the original dataset.

There are several limitations that should be considered when interpreting the results:

- The dataset may not represent every television currently available in Australia.
- Product information may change as new television models enter the market.
- Grouping and averaging data can hide differences between individual television models.
- Screen size and screen technology are not the only factors that may influence energy consumption.
- Missing, outdated or incorrectly recorded values in the original dataset may affect the visualisation.

Therefore, the visualisation should be interpreted as a way of exploring patterns in the provided dataset rather than as a complete representation of every television available in the Australian market.

## Ethics

The visualisation was designed to present the data in a clear and responsible way.

Care was taken not to intentionally manipulate chart scales, categories or labels in ways that could mislead the audience.

The visualisation also avoids making claims that cannot be supported by the available data. Relationships shown in the visualisation should be interpreted as patterns or associations within the dataset and should not automatically be interpreted as causal relationships.

Where data has been grouped or summarised, this is explained so that readers understand that the values may represent averages across multiple television products.

---

# AI Declaration

Generative AI was used during the development of this website, primarily using **ChatGPT**.

I used Generative AI to assist with the structure and syntax of the HTML, CSS and JavaScript code. This included creating the initial three-page website structure, navigation menu, responsive styling, FAQ accordion and JavaScript functionality. I also used it to help organise the project into separate HTML, CSS and JavaScript files and to explain how different parts of the code work.

For Exercise 3, Generative AI was also used to assist with organising and improving written content for the README and website, including explanations surrounding the television energy consumption visualisation.

My previous experience with web development is somewhat rusty because my major is Artificial Intelligence, so I was not confident that I could build the entire website independently from scratch. However, I reviewed the generated code and can confirm that I understand the code used in the final website and can explain what the main sections do.

I adapted and reviewed the generated code rather than using it without understanding it. In particular, I checked how the HTML pages are connected through the navigation, how CSS classes are used for styling, how JavaScript handles interactive functionality, and how the visualisation is presented to the user.

Through using Generative AI, I refreshed my understanding of basic web development concepts including HTML document structure, CSS selectors and layout, JavaScript event listeners, DOM manipulation and responsive web design.

One limitation I encountered was that Generative AI can generate code that works but may contain concepts or syntax that I have not used recently. Therefore, I needed to read through the generated content and understand each section before using it.

Overall, Generative AI was used as a **development and learning assistant rather than as a replacement for understanding the code or data**. Generated material was reviewed and adapted before being included in the final project.

---

# Technologies

The project uses:

- HTML5
- CSS3
- JavaScript
- KNIME for data preparation and analysis

No external web frameworks are required.

## Folder Structure

```text
appliance-energy-consumption/
│
├── index.html
├── televisions.html
├── about.html
├── README.md
│
└── assets/
    ├── css/
    │   └── style.css
    │
    ├── js/
    │   └── script.js
    │
    └── img/
        └── PowerIcon.png
```

## Website

**Live website:**  
[https://mercury.swin.edu.au/cos30045/s104992981/test/index.html](https://mercury.swin.edu.au/cos30045/s104992981/test/index.html)