"""Imprime le modèle de données en Mermaid (erDiagram) depuis les modèles SQLAlchemy.

Usage : `make erd` ; coller le résultat dans doc/architecture.md (la table des
formulaires y est abrégée à la main).
"""

from sqlalchemy import Column, Table

import app.models  # noqa: F401  enregistre les tables sur Base
from app.database import Base

TYPES = {
    "Integer": "int",
    "String": "string",
    "Float": "float",
    "Boolean": "bool",
    "DateTime": "datetime",
    "JSON": "json",
    "Geometry": "geometry",
}


def mermaid_type(column: Column) -> str:  # type: ignore[type-arg]
    name = type(column.type).__name__
    return TYPES.get(name, name.lower())


def keys(column: Column) -> str:  # type: ignore[type-arg]
    flags = []
    if column.primary_key:
        flags.append("PK")
    if column.foreign_keys:
        flags.append("FK")
    if column.unique:
        flags.append("UK")
    return f" {','.join(flags)}" if flags else ""


def print_table(table: Table) -> None:
    print(f"    {table.name} {{")
    for column in table.columns:
        print(f"        {mermaid_type(column)} {column.name}{keys(column)}")
    print("    }")


def print_relations(table: Table) -> None:
    for fk in table.foreign_keys:
        cardinality = "|o--o{" if fk.parent.nullable else "||--o{"
        print(
            f"    {fk.column.table.name} {cardinality} {table.name} : {fk.parent.name}"
        )


if __name__ == "__main__":
    print("erDiagram")
    for table in Base.metadata.sorted_tables:
        print_table(table)
    for table in Base.metadata.sorted_tables:
        print_relations(table)
