import sys
import types

# Les bindings Python de GDAL (osgeo) viennent de l'image conda, pas de pip.
# Seule la polygonisation des rasters les utilise, et ces tests ne la lancent
# jamais : on fournit un module vide pour que `pipeline.scripts.utils` s'importe.
try:
    import osgeo  # noqa: F401
except ImportError:  # pragma: no cover
    stub = types.ModuleType("osgeo")
    for name in ("gdal", "ogr", "osr"):
        submodule = types.ModuleType(f"osgeo.{name}")
        setattr(stub, name, submodule)
        sys.modules[f"osgeo.{name}"] = submodule
    sys.modules["osgeo"] = stub
