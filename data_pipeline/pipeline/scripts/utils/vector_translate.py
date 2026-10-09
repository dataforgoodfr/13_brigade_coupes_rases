from osgeo import gdal


def to_flatgeobuf(input_file: str, output_file: str) -> None:
    """Recopie une couche vectorielle en FlatGeobuf, avec son index spatial,
    sans la charger en mémoire."""
    gdal.UseExceptions()
    gdal.VectorTranslate(output_file, input_file, format="FlatGeobuf")
