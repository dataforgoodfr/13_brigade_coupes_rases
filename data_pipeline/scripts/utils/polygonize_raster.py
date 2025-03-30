from osgeo import gdal, ogr, osr


def polygonize_raster(
    input_raster: str,
    output_layer_file: str,
    fieldname: str | None = None,
    src_crs_epsg: int | None = None,
) -> None:
    """
    Polygonize a raster to a shapefile using 8-connectivity


    Parameters
    ----------
    input_raster : str
        The filepath to the .tif or .asc file
    output_layer_file : str
        The filepath to the .fgb output file
    fieldname : str | None, optional
        The name of the field to create in the destination file to store the pixels' values. If None, we only store the geometryies.
    src_crs_epsg : str | None, optional
        The CRS of the source raster file, if it is not already specified in the raster
    """

    # Register GDAL drivers
    gdal.AllRegister()

    # Open source file
    src_ds = gdal.Open(input_raster)
    if src_ds is None:
        raise ValueError(f"Unable to open {input_raster}")

    # Get the first band
    srcband = src_ds.GetRasterBand(1)
    maskband = srcband.GetMaskBand()

    # Create output file
    drv = ogr.GetDriverByName("FlatGeobuf")
    dst_ds = drv.CreateDataSource(output_layer_file)

    # Create layer
    srs = osr.SpatialReference()
    if src_ds.GetProjectionRef() != "":
        srs.ImportFromWkt(src_ds.GetProjectionRef())
    elif src_crs_epsg is not None:
        srs.ImportFromEPSG(src_crs_epsg)

    dst_layer = dst_ds.CreateLayer("out", geom_type=ogr.wkbPolygon, srs=srs)

    # Add field
    if fieldname:
        fd = ogr.FieldDefn(fieldname, ogr.OFTInteger)
        dst_layer.CreateField(fd)

    # Polygonize with 8-connectivity
    options = ["8CONNECTED=8"]
    gdal.Polygonize(
        srcband,
        maskband,
        dst_layer,
        0 if fieldname else -1,
        options,
        callback=gdal.TermProgress,
    )
