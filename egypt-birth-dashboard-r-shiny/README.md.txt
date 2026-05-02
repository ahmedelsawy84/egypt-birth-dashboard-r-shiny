# Egypt Birth Dashboard

This project is an interactive R Shiny dashboard for visualizing birth counts by Egyptian governorate in 2016.

## Project Overview

The dashboard joins governorate-level birth data with Egypt spatial boundary data and displays the result as an interactive choropleth map.

## Features

- Interactive Plotly choropleth map
- Governorate-level birth counts
- Data preview table
- Spatial data processing with `sf`
- Dashboard layout using `shinydashboard`

## Technologies Used

- R
- Shiny
- shinydashboard
- sf
- ggplot2
- dplyr
- plotly
- readr
- viridis

## Repository Structure

```text
app.R          Main Shiny application
data/          CSV data files
shapefiles/    Egypt governorate shapefile files
outputs/       Exported map outputs
README.md      Project documentation