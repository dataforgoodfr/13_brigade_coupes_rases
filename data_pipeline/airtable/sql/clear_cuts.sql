WITH zones_eco AS (
      SELECT
          cc.report_id,
          STRING_AGG(DISTINCT ez.name, ' / ' ORDER BY ez.name) AS noms_zones_ecologiques
      FROM clear_cuts cc
      JOIN clear_cut_ecological_zoning ccez ON ccez.clear_cut_id = cc.id
      JOIN ecological_zonings ez ON ez.id = ccez.ecological_zoning_id
      GROUP BY cc.report_id
  ),
  natura2000 AS (
      SELECT
          cc.report_id,
          TRUE AS dans_natura2000,
          STRING_AGG(ez.name || ' (' || ez.code || ')', ' / ' ORDER BY ez.name) AS nom_natura2000
      FROM clear_cuts cc
      JOIN clear_cut_ecological_zoning ccez ON ccez.clear_cut_id = cc.id
      JOIN ecological_zonings ez ON ez.id = ccez.ecological_zoning_id
      WHERE ez.type = 'Natura2000'
      GROUP BY cc.report_id
  ),
  derniers_formulaires AS (
      SELECT DISTINCT ON (report_id)
          report_id,
          editor_id,
          inspection_date, weather, forest,
          has_remaining_trees, trees_species,
          planting_images,
          has_construction_panel,
          construction_panel_images,
          wetland, soil_state, destruction_clues,
          clear_cut_images,
          tree_trunks_images,
          soil_state_images,
          access_road_images,
          has_other_ecological_zone, other_ecological_zone_type,
          has_nearby_ecological_zone, nearby_ecological_zone_type,
          protected_species, protected_habitats,
          has_ddt_request, ddt_request_owner,
          company, subcontractor, landlord,
          is_pefc_fsc_certified, is_over_20_ha, is_psg_required_plot,
          other,
          relevant_for_pefc_complaint, relevant_for_rediii_complaint,
          relevant_for_ofb_complaint, relevant_for_alert_cnpf_ddt_srgs,
          relevant_for_alert_cnpf_ddt_psg_thresholds,
          relevant_for_psg_request, request_engaged
      FROM clear_cut_report_forms
      ORDER BY report_id, created_at DESC
  ),
  nb_versions AS (
      SELECT report_id, COUNT(*) AS nb
      FROM clear_cut_report_forms
      GROUP BY report_id
  ),
  regles AS (
      SELECT rcr.report_id, STRING_AGG(rl.type, ', ') AS regles_declenchees
      FROM rules_clear_cuts_reports rcr
      JOIN rules rl ON rl.id = rcr.rule_id
      GROUP BY rcr.report_id
  )
  SELECT
      r.id::text                                        AS rapport_id,
      r.status                                          AS statut,
      r.created_at                                      AS date_signalement,
      r.first_cut_date                                  AS debut_coupe,
      r.last_cut_date                                   AS fin_coupe,
      r.total_area_hectare                              AS surface_totale_ha,
      r.slope_area_hectare                              AS surface_pente_ha,
      r.total_ecological_zoning_area_hectare            AS surface_zone_ecologique_ha,
      r.total_bdf_deciduous_area_hectare                AS surface_feuillu_ha,
      r.total_bdf_resinous_area_hectare                 AS surface_resineux_ha,
      r.total_bdf_mixed_area_hectare                    AS surface_mixte_ha,
      r.total_bdf_poplar_area_hectare                   AS surface_peuplier_ha,
      ci.name                                           AS commune,
      ci.zip_code                                       AS code_postal,
      d.name                                            AS departement,
      d.code                                            AS code_departement,
      ST_Y(r.average_location)                          AS latitude,
      ST_X(r.average_location)                          AS longitude,
      u.first_name || ' ' || u.last_name                AS benevole_assigne,
      u.email                                           AS email_benevole,
      z.noms_zones_ecologiques,
      COALESCE(n.dans_natura2000, FALSE)                AS dans_natura2000,
      n.nom_natura2000,
      COALESCE(v.nb, 0)                                 AS nb_versions,
      re.regles_declenchees,
      ue.first_name || ' ' || ue.last_name              AS benevole_terrain,
      ue.email                                          AS email_benevole_terrain,
      f.inspection_date                                 AS date_inspection,
      f.weather                                         AS meteo,
      f.forest                                          AS type_peuplement_avant_coupe,
      f.has_remaining_trees                             AS presence_plantation,
      f.trees_species                                   AS essence_plantee,
      f.planting_images                                 AS photos_plantation,
      f.has_construction_panel                          AS panneau_chantier_visible,
      f.construction_panel_images                       AS photos_panneau,
      f.wetland                                         AS traversees_cours_eau,
      f.destruction_clues                               AS indices_destruction,
      f.soil_state                                      AS etat_des_sols,
      f.clear_cut_images                                AS photos_coupe,
      f.tree_trunks_images                              AS photos_bois_coupes,
      f.soil_state_images                               AS photos_etat_sols,
      f.access_road_images                              AS photos_chemins_acces,
      f.has_other_ecological_zone                       AS coupe_dans_autre_zone_eco,
      f.other_ecological_zone_type                      AS type_autre_zone_eco,
      f.has_nearby_ecological_zone                      AS zone_eco_proximite,
      f.nearby_ecological_zone_type                     AS type_zone_eco_proximite,
      f.protected_species                               AS especes_protegees,
      f.protected_habitats                              AS habitats_proteges,
      f.has_ddt_request                                 AS demande_ddt,
      f.ddt_request_owner                               AS par_qui_ddt,
      f.company                                         AS entreprise_travaux,
      f.subcontractor                                   AS sous_traitant,
      f.landlord                                        AS proprietaire,
      f.is_pefc_fsc_certified                           AS certifie_pefc_fsc,
      f.is_over_20_ha                                   AS propriete_plus_20ha,
      f.is_psg_required_plot                            AS parcelle_soumise_psg,
      f.other                                           AS informations_complementaires,
      f.relevant_for_pefc_complaint                     AS pertinent_plainte_pefc,
      f.relevant_for_rediii_complaint                   AS pertinent_plainte_rediii,
      f.relevant_for_ofb_complaint                      AS pertinent_plainte_ofb,
      f.relevant_for_alert_cnpf_ddt_srgs                AS pertinent_alerte_cnpf_srgs,
      f.relevant_for_alert_cnpf_ddt_psg_thresholds      AS pertinent_alerte_cnpf_psg,
      f.relevant_for_psg_request                        AS pertinent_demande_psg,
      f.request_engaged                                 AS demande_engagee
  FROM clear_cuts_reports r
  JOIN cities ci ON ci.id = r.city_id
  JOIN departments d ON d.id = ci.department_id
  LEFT JOIN users u ON u.id = r.user_id
  LEFT JOIN zones_eco z ON z.report_id = r.id
  LEFT JOIN natura2000 n ON n.report_id = r.id
  LEFT JOIN nb_versions v ON v.report_id = r.id
  LEFT JOIN regles re ON re.report_id = r.id
  LEFT JOIN derniers_formulaires f ON f.report_id = r.id
  LEFT JOIN users ue ON ue.id = f.editor_id
  ORDER BY r.created_at DESC;