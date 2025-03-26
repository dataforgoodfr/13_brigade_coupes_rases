# Sample code rules
# Ensure both GeoDataFrames have the same CRS (Coordinate Reference System)
if sufosat.crs != sufosat_2.crs:
    sufosat_2 = sufosat_2.to_crs(sufosat.crs)

# Perform a spatial join between the two layers using the 'intersects' predicate
overlapping = gpd.sjoin(
    sufosat_2, 
    sufosat, 
    how="inner", 
    predicate="intersects"
)

# Log the result of the spatial join
print(f"{len(overlapping)} new clear-cuts overlap with the old ones.")
