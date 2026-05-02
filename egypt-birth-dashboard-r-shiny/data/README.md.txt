# Data

This folder contains the CSV files used by the Egypt Birth Dashboard.

## Files

- `EGB16.csv`: Governorate-level birth-count dataset for Egypt in 2016.
- `gov_names_from_shapefile.csv`: Governorate names extracted from the Egypt shapefile, used to help match CSV names with spatial boundary names.

## Notes

The Shiny app reads the main birth dataset from:

```text
data/EGB16.csv