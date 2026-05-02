library(shiny)
library(shinydashboard)
library(sf)
library(ggplot2)
library(dplyr)
library(plotly)
library(readr)
library(viridis)

ui <- dashboardPage(
  dashboardHeader(title = "Egypt Birth Dashboard"),
  
  dashboardSidebar(
    sidebarMenu(
      menuItem("Map", tabName = "map_tab", icon = icon("globe")),
      menuItem("Data", tabName = "data_tab", icon = icon("table"))
    )
  ),
  
  dashboardBody(
    tabItems(
      tabItem(
        tabName = "map_tab",
        fluidRow(
          box(
            title = "Interactive Birth Map",
            width = 12,
            plotlyOutput("birth_map", height = "700px")
          )
        )
      ),
      tabItem(
        tabName = "data_tab",
        fluidRow(
          box(
            title = "Joined Data",
            width = 12,
            tableOutput("data_preview")
          )
        )
      )
    )
  )
)

server <- function(input, output, session) {
  
  path_sh <- "shapefiles/geoBoundaries-EGY-ADM1.shp"
  egypt_sf <- st_read(path_sh, quiet = TRUE)
  
  path_csv <- "data/EGB16.csv"
  birth_data <- read_csv(path_csv)
  
  map_data <- egypt_sf %>%
    left_join(birth_data, by = c("shapeName" = "Governrator")) %>%
    mutate(shapeName = gsub(" Governorate|Governate", "", shapeName))
  
  p_imp <- ggplot(map_data) +
    geom_sf(aes(
      fill = birth_16,
      text = paste(
        "Governorate:", shapeName,
        "<br>Births:", birth_16
      )
    )) +
    scale_fill_viridis_c(option = "plasma", na.value = "grey80") +
    theme_bw() +
    labs(
      title = "Births by Governorate in Egypt 2016",
      fill = "Number of Births"
    )
  
  output$birth_map <- renderPlotly({
    ggplotly(p_imp, tooltip = "text")
  })
  
  output$data_preview <- renderTable({
    map_data %>% st_drop_geometry()
  })
}

shinyApp(ui, server)

shiny::runApp()
