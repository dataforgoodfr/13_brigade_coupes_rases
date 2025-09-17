import pandas as pd
from app.database import SessionLocal
from app.models import ClearCutReport


def update_anomalies_from_df(df: pd.DataFrame):
    """
    Met à jour la colonne anomaly de la table clear_cuts_reports
    à partir d'un DataFrame contenant :
      - clear_cut_group (clé de jointure avec l'id en DB)
      - anomaly (valeur à mettre dans anomaly)

    Ignore les IDs absents en base.
    """
    session = SessionLocal()
    try:
        # Récupérer les IDs existants en base
        existing_ids = {
            id_
            for (id_,) in session.query(ClearCutReport.id)
            .filter(ClearCutReport.id.in_(df["clear_cut_group"].astype(int).tolist()))
            .all()
        }

        # Filtrer le DataFrame pour ne garder que les correspondances
        valid_updates = [
            {"id": int(row["clear_cut_group"]), "anomaly": row["anomaly"]}
            for _, row in df.iterrows()
            if int(row["clear_cut_group"]) in existing_ids
        ]

        if valid_updates:
            session.bulk_update_mappings(ClearCutReport, valid_updates)

        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

#Test local
#df = pd.read_csv("data/anomaly_test.csv")
# Update database on cloud (prod)
df = pd.read_csv("data/anomalie_2024_coupes_rases_05ha.csv")

update_anomalies_from_df(df)