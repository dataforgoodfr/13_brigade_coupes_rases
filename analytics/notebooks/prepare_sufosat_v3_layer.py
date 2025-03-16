import logging

import geopandas as gpd
import pandas as pd
from osgeo import gdal, ogr, osr
from tqdm import tqdm

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s][%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)


# Code from https://github.com/scipy/scipy/blob/v1.15.2/scipy/_lib/_disjoint_set.py#L0-L1
# We could import it from scipy but that might be an unnecessary dependency for this simple data structure
class DisjointSet:
    """Disjoint set data structure for incremental connectivity queries.

    .. versionadded:: 1.6.0

    Attributes
    ----------
    n_subsets : int
        The number of subsets.

    Methods
    -------
    add
    merge
    connected
    subset
    subset_size
    subsets
    __getitem__

    Notes
    -----
    This class implements the disjoint set [1]_, also known as the *union-find*
    or *merge-find* data structure. The *find* operation (implemented in
    `__getitem__`) implements the *path halving* variant. The *merge* method
    implements the *merge by size* variant.

    References
    ----------
    .. [1] https://en.wikipedia.org/wiki/Disjoint-set_data_structure

    Examples
    --------
    >>> from scipy.cluster.hierarchy import DisjointSet

    Initialize a disjoint set:

    >>> disjoint_set = DisjointSet([1, 2, 3, 'a', 'b'])

    Merge some subsets:

    >>> disjoint_set.merge(1, 2)
    True
    >>> disjoint_set.merge(3, 'a')
    True
    >>> disjoint_set.merge('a', 'b')
    True
    >>> disjoint_set.merge('b', 'b')
    False

    Find root elements:

    >>> disjoint_set[2]
    1
    >>> disjoint_set['b']
    3

    Test connectivity:

    >>> disjoint_set.connected(1, 2)
    True
    >>> disjoint_set.connected(1, 'b')
    False

    List elements in disjoint set:

    >>> list(disjoint_set)
    [1, 2, 3, 'a', 'b']

    Get the subset containing 'a':

    >>> disjoint_set.subset('a')
    {'a', 3, 'b'}

    Get the size of the subset containing 'a' (without actually instantiating
    the subset):

    >>> disjoint_set.subset_size('a')
    3

    Get all subsets in the disjoint set:

    >>> disjoint_set.subsets()
    [{1, 2}, {'a', 3, 'b'}]
    """

    def __init__(self, elements=None):
        self.n_subsets = 0
        self._sizes = {}
        self._parents = {}
        # _nbrs is a circular linked list which links connected elements.
        self._nbrs = {}
        # _indices tracks the element insertion order in `__iter__`.
        self._indices = {}
        if elements is not None:
            for x in elements:
                self.add(x)

    def __iter__(self):
        """Returns an iterator of the elements in the disjoint set.

        Elements are ordered by insertion order.
        """
        return iter(self._indices)

    def __len__(self):
        return len(self._indices)

    def __contains__(self, x):
        return x in self._indices

    def __getitem__(self, x):
        """Find the root element of `x`.

        Parameters
        ----------
        x : hashable object
            Input element.

        Returns
        -------
        root : hashable object
            Root element of `x`.
        """
        if x not in self._indices:
            raise KeyError(x)

        # find by "path halving"
        parents = self._parents
        while self._indices[x] != self._indices[parents[x]]:
            parents[x] = parents[parents[x]]
            x = parents[x]
        return x

    def add(self, x):
        """Add element `x` to disjoint set"""
        if x in self._indices:
            return

        self._sizes[x] = 1
        self._parents[x] = x
        self._nbrs[x] = x
        self._indices[x] = len(self._indices)
        self.n_subsets += 1

    def merge(self, x, y):
        """Merge the subsets of `x` and `y`.

        The smaller subset (the child) is merged into the larger subset (the
        parent). If the subsets are of equal size, the root element which was
        first inserted into the disjoint set is selected as the parent.

        Parameters
        ----------
        x, y : hashable object
            Elements to merge.

        Returns
        -------
        merged : bool
            True if `x` and `y` were in disjoint sets, False otherwise.
        """
        xr = self[x]
        yr = self[y]
        if self._indices[xr] == self._indices[yr]:
            return False

        sizes = self._sizes
        if (sizes[xr], self._indices[yr]) < (sizes[yr], self._indices[xr]):
            xr, yr = yr, xr
        self._parents[yr] = xr
        self._sizes[xr] += self._sizes[yr]
        self._nbrs[xr], self._nbrs[yr] = self._nbrs[yr], self._nbrs[xr]
        self.n_subsets -= 1
        return True

    def connected(self, x, y):
        """Test whether `x` and `y` are in the same subset.

        Parameters
        ----------
        x, y : hashable object
            Elements to test.

        Returns
        -------
        result : bool
            True if `x` and `y` are in the same set, False otherwise.
        """
        return self._indices[self[x]] == self._indices[self[y]]

    def subset(self, x):
        """Get the subset containing `x`.

        Parameters
        ----------
        x : hashable object
            Input element.

        Returns
        -------
        result : set
            Subset containing `x`.
        """
        if x not in self._indices:
            raise KeyError(x)

        result = [x]
        nxt = self._nbrs[x]
        while self._indices[nxt] != self._indices[x]:
            result.append(nxt)
            nxt = self._nbrs[nxt]
        return set(result)

    def subset_size(self, x):
        """Get the size of the subset containing `x`.

        Note that this method is faster than ``len(self.subset(x))`` because
        the size is directly read off an internal field, without the need to
        instantiate the full subset.

        Parameters
        ----------
        x : hashable object
            Input element.

        Returns
        -------
        result : int
            Size of the subset containing `x`.
        """
        return self._sizes[self[x]]

    def subsets(self):
        """Get all the subsets in the disjoint set.

        Returns
        -------
        result : list
            Subsets in the disjoint set.
        """
        result = []
        visited = set()
        for x in self:
            if x not in visited:
                xset = self.subset(x)
                visited.update(xset)
                result.append(xset)
        return result


def polygonize_raster(input_raster: str, output_shapefile: str, fieldname: str):
    """
    Converts a raster image to vector polygons using 8-connectivity.

    This function identifies connected areas of the same value in the raster
    and converts them to polygons, saving the result as a vector file.

    Parameters
    ----------
    input_raster : str
        Path to the input raster file.
    output_shapefile : str
        Path where the output vector file will be saved.
    fieldname : str
        Name of the field in the output shapefile that will store the raster values.

    Raises
    ------
    ValueError
        If the input raster cannot be opened.
    """
    logging.info(f"Polygonizing raster: {input_raster} -> {output_shapefile}")

    # Register GDAL drivers
    gdal.AllRegister()

    # Open source file
    src_ds = gdal.Open(input_raster)
    if src_ds is None:
        raise ValueError(f"Unable to open raster file: {input_raster}")

    # Get the first band
    srcband = src_ds.GetRasterBand(1)
    maskband = srcband.GetMaskBand()

    # Create output file
    drv = ogr.GetDriverByName("FlatGeobuf")
    dst_ds = drv.CreateDataSource(output_shapefile)

    # Create layer
    srs = None
    if src_ds.GetProjectionRef() != "":
        srs = osr.SpatialReference()
        srs.ImportFromWkt(src_ds.GetProjectionRef())

    dst_layer = dst_ds.CreateLayer("out", geom_type=ogr.wkbPolygon, srs=srs)

    # Add field
    fd = ogr.FieldDefn(fieldname, ogr.OFTInteger)
    dst_layer.CreateField(fd)

    # Polygonize with 8-connectivity
    options = ["8CONNECTED=8"]
    gdal.Polygonize(srcband, maskband, dst_layer, 0, options)

    # Resources cleanup
    dst_ds = None
    src_ds = None

    logging.info(f"Polygonization complete: {output_shapefile}")


def parse_sufosat_date(sufosat_date: float) -> pd.Timestamp:
    """
    Converts SUFOSAT date format to a pandas Timestamp.

    The input format is YYDDD, where YY is the year (e.g., 18-25 = 2018-2025)
    and DDD is the day of the year (1-366).

    Parameters
    ----------
    sufosat_date : float
        Date in SUFOSAT format (YYDDD).

    Returns
    -------
    pd.Timestamp
        Converted date as a pandas Timestamp.

    Examples
    --------
    >>> parse_sufosat_date(19032)
    Timestamp('2019-02-01 00:00:00')  # February 1, 2019 (32nd day of 2019)
    """
    sufosat_date = int(sufosat_date)
    return pd.Timestamp(year=2000 + sufosat_date // 1000, month=1, day=1) + pd.Timedelta(
        days=(sufosat_date % 1000) - 1
    )


def pair_clear_cuts_through_space_and_time(
    gdf: gpd.GeoDataFrame, max_meters_between_clear_cuts: int, max_days_between_clear_cuts: int
) -> pd.DataFrame:
    """
    Identifies pairs of clear-cuts that are within a specified distance and a
    specified number of days of each other.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        GeoDataFrame containing clear-cut polygons with a 'geometry' column.
    max_meters_between_clear_cuts : int
        Maximum distance in meters that can separate two clear-cuts for them
        to be considered a pair.
    max_days_between_clear_cuts : int
        Maximum time difference in days between clear-cuts to consider them related.


    Returns
    -------
    pd.DataFrame
        DataFrame with columns:
        - index_left: Index of the first clear-cut in each pair
        - date_left: Date of the first clear-cut
        - index_right: Index of the second clear-cut in each pair
        - date_right: Date of the second clear-cut

    Notes
    -----
    This function can consume a significant amount of memory due to the Cartesian product
    generated by the spatial join.
    """
    logging.info(
        f"Pairing clear-cuts within {max_meters_between_clear_cuts} meters "
        f"and {max_days_between_clear_cuts} days of each other"
    )

    # Cluster the clear-cuts that are within `max_meters_between_clear_cuts` of each other
    clear_cut_pairs = (
        gdf.sjoin(gdf, how="left", predicate="dwithin", distance=max_meters_between_clear_cuts)
        .reset_index()
        .rename(columns={"index": "index_left"})
    )

    # Ignore clear-cuts that intersect with themselves
    clear_cut_pairs = clear_cut_pairs[
        clear_cut_pairs["index_left"] != clear_cut_pairs["index_right"]
    ]

    # Remove duplicates (left -> right exists, ignore right -> left)
    clear_cut_pairs = clear_cut_pairs[
        clear_cut_pairs["index_left"] < clear_cut_pairs["index_right"]
    ]

    # Remove pairs if the date difference is too big
    clear_cut_pairs = clear_cut_pairs[
        (clear_cut_pairs["date_left"] - clear_cut_pairs["date_right"]).dt.days.abs()
        <= max_days_between_clear_cuts
    ]

    logging.info(
        f"Found {len(clear_cut_pairs)} potential clear-cut pairs (before shape complexity filtering)"
    )

    return clear_cut_pairs


def regroup_clear_cut_pairs(clear_cut_pairs: pd.DataFrame) -> list[set[int]]:
    """
    Groups connected clear-cut pairs into distinct sets (clusters).

    Given a set of identified clear-cut pairs, this function groups all
    interconnected clear cuts into the same set using a disjoint-set
    data structure (also known as a union-find algorithm).

    Parameters
    ----------
    clear_cut_pairs : pd.DataFrame
        DataFrame containing pairs of clear-cut IDs that are connected,
        with columns 'index_left' and 'index_right'.

    Returns
    -------
    list[set[int]]
        A list of sets, where each set contains the IDs of clear cuts
        belonging to the same cluster.

    Examples
    --------
    If we have four clear cuts (A, B, C, and D) and the identified pairs
    are (A, B) and (B, D), the function will group them as:
    - Group 1: {A, B, D}
    - Group 2: {C}
    """
    logging.info("Grouping connected clear-cuts into clusters")

    # Get all unique clear-cut indices from both columns
    all_indices = pd.concat(
        [clear_cut_pairs["index_left"], clear_cut_pairs["index_right"]]
    ).unique()

    # Start with each clear cut having its own group
    clear_cuts_disjoint_set = DisjointSet(all_indices)

    # Group the clear cuts that belong together one pair at a time
    for index_left, index_right in tqdm(
        clear_cut_pairs[["index_left", "index_right"]].itertuples(index=False),
        total=len(clear_cut_pairs),
        desc="Merging connected clear-cuts",
    ):
        clear_cuts_disjoint_set.merge(index_left, index_right)

    # Get the resulting subsets (clusters)
    subsets = clear_cuts_disjoint_set.subsets()

    logging.info(f"Created {len(subsets)} clear-cut clusters")

    return subsets


def cluster_clear_cuts(
    gdf: gpd.GeoDataFrame, max_meters_between_clear_cuts: int, max_days_between_clear_cuts: int
) -> gpd.GeoDataFrame:
    """
    Clusters individual clear-cuts based on spatial and temporal proximity.
    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        GeoDataFrame containing clear-cut polygons with 'date' and 'geometry' columns.
    max_meters_between_clear_cuts : int
        Maximum distance in meters between clear-cuts to consider them related.
    max_days_between_clear_cuts : int
        Maximum time difference in days between clear-cuts to consider them related.

    Returns
    -------
    gpd.GeoDataFrame
        The input GeoDataFrame with an additional 'clear_cut_group' column
        that assigns each polygon to a cluster.

    Notes
    -----
    The function modifies the input GeoDataFrame by adding a 'clear_cut_group' column.
    """
    logging.info("Clustering clear-cuts by spatial and temporal proximity")

    # Identify the clear cut groups
    clear_cut_pairs = pair_clear_cuts_through_space_and_time(
        gdf, max_meters_between_clear_cuts, max_days_between_clear_cuts
    )
    clear_cut_groups = regroup_clear_cut_pairs(clear_cut_pairs)

    # Assign a clear cut group id to each clear cut polygon
    logging.info("Assigning cluster IDs to clear-cuts")
    for i, subset in tqdm(
        enumerate(clear_cut_groups), total=len(clear_cut_groups), desc="Assigning cluster IDs"
    ):
        gdf.loc[list(subset), "clear_cut_group"] = i

    logging.info(f"Clustering complete: {gdf['clear_cut_group'].nunique()} total clusters")

    return gdf


def union_clear_cut_clusters(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Combines clear-cuts belonging to the same cluster into single geometries.

    This function dissolves the geometries based on the 'clear_cut_group' column,
    and calculates aggregate statistics for each cluster.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        GeoDataFrame with 'clear_cut_group', 'date', and 'geometry' columns.

    Returns
    -------
    gpd.GeoDataFrame
        A new GeoDataFrame with one row per cluster, containing:
        - Unified geometry
        - Minimum and maximum dates
        - Time span of the cluster in days
        - Number of clear-cuts in each cluster
    """
    logging.info("Merging clear-cuts within each cluster")

    # Calculate group sizes before dissolve
    clear_cut_group_size = gdf.groupby("clear_cut_group").size()

    logging.info("Performing spatial union of geometries within each cluster")
    gdf = gdf.dissolve(by="clear_cut_group", aggfunc={"date": ["min", "max"]}).rename(
        columns={
            ("date", "min"): "date_min",
            ("date", "max"): "date_max",
        }
    )
    gdf["days_delta"] = (gdf["date_max"] - gdf["date_min"]).dt.days
    gdf["clear_cut_group_size"] = clear_cut_group_size

    # Fill tiny gaps left after the dissolve/union operation
    logging.info("Filling tiny gaps in the dissolved geometries")
    gdf["geometry"] = gdf["geometry"].buffer(0.0001)

    logging.info(f"Successfully created {len(gdf)} merged clear-cut clusters")

    return gdf


def filter_out_clear_cuts_with_complex_shapes(
    gdf: gpd.GeoDataFrame, concave_hull_ratio: float, concave_hull_score_threshold: float
) -> gpd.GeoDataFrame:
    """
    Filters out clear-cuts with overly complex shapes that may represent false positives.

    This function uses the concave hull score (ratio of the area of the shape to the
    area of its concave hull) to identify and remove shapes that are too complex.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        GeoDataFrame containing clear-cut polygons.
    concave_hull_ratio : float
        Ratio parameter for the concave hull calculation (1.0 = convex hull).
        Lower values create tighter hulls that follow the shape more closely.
    concave_hull_score_threshold : float
        Minimum acceptable concave hull score. Polygons with scores below this
        threshold will be removed.

    Returns
    -------
    gpd.GeoDataFrame
        Filtered GeoDataFrame with complex shapes removed.

    Notes
    -----
    The concave hull score (area of polygon / area of concave hull) provides a measure
    of shape complexity. Values close to 0 indicate more complex, irregular shapes,
    while large values indicate simpler shapes. The score can be greater than 1.
    """
    logging.info("Filtering out clear-cuts with complex shapes")

    # concave_hull(ratio=1) would be the same as convex_hull
    gdf["concave_hull_score"] = gdf.area / gdf.concave_hull(concave_hull_ratio).area

    logging.info(
        f"Dropping {(gdf['concave_hull_score'] < concave_hull_score_threshold).sum() / len(gdf):.1%} of the clear-cut clusters because their concave hull score is too low, meaning their shape is too complex."
    )

    # Filter out clear cuts that are too complex, and get rid of the score since it won't be useful later
    gdf = gdf[gdf["concave_hull_score"] >= concave_hull_score_threshold].drop(
        columns="concave_hull_score"
    )

    return gdf


def prepare_sufosat_v3_layer(
    input_raster_dates: str,
    temp_output_vector_dates: str,
    output_layer: str,
    max_meters_between_clear_cuts: int,
    max_days_between_clear_cuts: int,
    min_clear_cut_area_ha: float,
    concave_hull_ratio: float,
    concave_hull_threshold: float,
) -> None:
    """
    Process forest clear-cut raster data into a filtered vector layer of clear-cut clusters.

    This function orchestrates a complete workflow for processing forest clear-cut data:
    1. Converts raster clear-cut data to vector polygons
    2. Processes the dates associated with each clear-cut
    3. Clusters nearby clear-cuts in space and time
    4. Merges clear-cuts within each cluster
    5. Filters the results based on shape complexity and area
    6. Saves the final vector dataset

    Parameters
    ----------
    input_raster_dates : str
        Path to the input raster file containing clear-cut dates in SUFOSAT format.
    temp_output_vector_dates : str
        Path for the temporary vector file created during polygonization.
    output_layer : str
        Path where the final processed clear-cut clusters will be saved.
    max_meters_between_clear_cuts : int
        Maximum distance in meters between clear-cuts to consider them spatially related.
    max_days_between_clear_cuts : int
        Maximum time difference in days between clear-cuts to consider them temporally related.
    min_clear_cut_area_ha : float
        Minimum area in hectares for a clear-cut cluster to be included in the final output.
    concave_hull_ratio : float
        Ratio parameter for the concave hull calculation (1.0 = convex hull).
        Lower values create tighter hulls that follow the shape more closely.
    concave_hull_threshold : float
        Minimum acceptable concave hull score. Polygons with scores below this
        threshold will be removed as they represent overly complex shapes.

    Returns
    -------
    None
        The function saves the results to the specified output_layer path.
    """
    logging.info(f"Starting to process {input_raster_dates}")

    # Transform the SUFOSAT raster data into vector data
    polygonize_raster(
        input_raster=input_raster_dates,
        output_shapefile=temp_output_vector_dates,
        fieldname="sufosat_date",
    )

    # Read the SUFOSAT vectorized data
    gdf: gpd.GeoDataFrame = gpd.read_file(temp_output_vector_dates)

    # Transform the SUFOSAT date numbers into actual python dates
    gdf["date"] = gdf["sufosat_date"].apply(parse_sufosat_date)
    gdf = gdf.drop(columns="sufosat_date")

    # Cluster individual clear-cuts that are close in space and time.
    gdf = cluster_clear_cuts(gdf, max_meters_between_clear_cuts, max_days_between_clear_cuts)

    # Union all the polygons
    gdf = union_clear_cut_clusters(gdf)

    gdf = filter_out_clear_cuts_with_complex_shapes(
        gdf, concave_hull_ratio, concave_hull_threshold
    )

    # Add clear cut area, with 1 hectare = 10,000 m²
    logging.info("Adding clear-cut clusters area")
    gdf["area_ha"] = gdf.area / 10000

    # Only keep clear cuts >= min_clear_cut_area_ha ha
    logging.info("Only keeping clear-cuts if area >= min_clear_cut_area_ha ha")
    gdf = gdf[gdf["area_ha"] >= min_clear_cut_area_ha]

    # Let's sort the clear-cut clusters by their area
    gdf = gdf.sort_values("area_ha")

    logging.info(
        f"We identified {len(gdf)} clear-cut clusters >= {min_clear_cut_area_ha} ha"
        f" and {(gdf['area_ha'] >= 10).sum()} clear-cut clusters >= 10 ha"
    )

    # Finally, save the result to disk
    logging.info(f"Saving results to {output_layer}")
    gdf.to_file(output_layer, index=False)
    logging.info("Processing complete!")
