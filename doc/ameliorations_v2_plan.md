# Plan d'implémentation : Améliorations Canopée

Ce document détaille la stratégie d'implémentation pour répondre aux quatre axes d'amélioration demandés.

> [!WARNING]
> ## User Review Required
> Merci de valider l'approche technique ci-dessous avant que je ne commence le développement. Les modifications touchent à la fois la base de données, le backend (FastAPI) et le frontend (React/Vite).

> [!IMPORTANT]
> ## Open Questions
> **1. Envoi d'e-mails (Notification d'attribution et Réinitialisation de mot de passe) :** Quel service d'envoi d'e-mails souhaitez-vous utiliser (SMTP classique, SendGrid, Brevo, AWS SES...) ? Possédez-vous déjà les identifiants ? Pour l'instant, je prévois de mettre en place le code avec des variables d'environnement (`SMTP_HOST`, `SMTP_PORT`, etc.) et d'afficher les e-mails dans la console en local.
> **2. Synchronisation Airtable :** Avez-vous déjà créé la base (Base ID) et les tables (Nom des tables pour Utilisateurs et Coupes) sur Airtable ? Il faudra renseigner le `AIRTABLE_API_KEY` et les identifiants de la base dans le `.env`.
> **3. Ajout Manuel de coupes (Tracé de polygone) :** Confirmez-vous l'utilisation d'une librairie comme `leaflet-draw` ou `geoman` côté front-end pour permettre le dessin de polygones sur la carte ?

---

## Proposed Changes

### 1. Gestion des Comptes et Attribution des Coupes

#### Backend (FastAPI)
*   **[DONE] `backend/app/services/user_auth.py` et `routes`** : Ajout des routes pour l'inscription d'un bénévole (`POST /auth/register`), la demande de réinitialisation de mot de passe (`POST /auth/forgot-password`) et la validation de réinitialisation (`POST /auth/reset-password`).
*   **[DONE] `backend/app/services/clear_cut_report.py`** : Création des endpoints d'attribution (`POST /clear-cuts/{id}/assign`), de désattribution (`POST /clear-cuts/{id}/unassign`) et gestion des requêtes d'attribution manuelles avec le statut "Action Requise".
*   **[DONE] `backend/app/models.py` & Sérialiseurs (schemas)** : S'assurer que les routes de lecture des coupes (GET) ne renvoient pas les informations personnelles (email, nom complet) de l'utilisateur assigné si le requérant n'est pas un administrateur.
*   **[NEW] `backend/app/services/email.py`** : Module pour gérer l'envoi d'e-mails (Notification d'attribution et lien de reset password).

#### Frontend (React)
*   **[DONE] Pages d'Auth** : Création des pages d'inscription et de mot de passe oublié/réinitialisation.
*   **[DONE] Onglet "Mon Compte" / "Mes Coupes"** : Nouvelle vue listant les coupes attribuées à l'utilisateur connecté.
*   **[DONE] Dashboard Admin "Actions Requises"** : Création d'un onglet listant les coupes en attente de validation ou les demandes d'attribution.
*   **[DONE] Pop-up de coupe et Formulaires** : Déblocage de la pré-saisie pour les demandeurs d'attribution avant validation de l'admin.


---

### 2. Expérience Utilisateur (Front-end)

#### Frontend (React / Leaflet)
*   **[DONE] Pop-up d'information de la coupe** : Ajout du bouton "Renseigner les informations / Ajouter des détails" qui redirige vers le formulaire d'inspection.
*   **[DONE] Composant Carte (Map)** : Modification de la logique de recherche d'adresse pour que le `setView` utilise un zoom approprié pour la visualisation des coupes (niveau 14).
*   **[MODIFY] Composant Filtres (Pop-up/Sidebar)** : 
    *   Ajout d'un overlay cliquable pour fermer la pop-up en cliquant à l'extérieur sur mobile.
    *   Stockage de l'état des filtres en local (Zustand/Redux ou URL search params) pour qu'il soit conservé après fermeture.
    *   Ajout des boutons explicites "Valider" (applique les filtres) et "Réinitialiser" (vide les filtres).
*   **[DONE] Code global** : Suppression totale de la fonctionnalité "Ajouter aux favoris" (Backend et Frontend).

---

### 3. Ajout Manuel de Coupes

#### Frontend
*   **[DONE] Menu gauche** : Ajout du bouton "Ajouter une coupe manuellement".
*   **[DONE] Mode Dessin sur la carte** : Activation d'outils de dessin (Geoman) via une surcouche Leaflet (`@geoman-io/leaflet-geoman-free`).
*   **[DONE] Flux d'action** : À la validation du dessin, ouverture automatique d'une modale de demande de code postal pour initialiser le signalement.

#### Backend
*   **[MODIFY] `backend/app/routes/clear_cuts.py`** : Adaptation de la route de création (POST) pour supporter les géométries (Point/Polygon) fournies manuellement depuis le front-end, avec création d'un statut "créé manuellement".

---

### 4. Gestion des Données et Intégration (Airtable)

#### Backend (FastAPI / APScheduler)
*   **[NEW] `backend/app/services/airtable_sync.py`** : Création d'un service gérant les appels API vers Airtable (via la librairie `pyairtable` ou des requêtes HTTP directes).
*   **[NEW] `backend/app/tasks.py`** : Mise en place d'un planificateur (ex: `APScheduler`) lancé au démarrage de l'application FastAPI.
*   **[MODIFY] `backend/app/main.py`** : Configuration des tâches planifiées pour s'exécuter tous les jours à 8h00 et 12h00. La synchronisation prendra les utilisateurs et les coupes de PostgreSQL pour faire un upsert (Update/Insert) unidirectionnel vers Airtable.

---

## Verification Plan

### Automated Tests
*   Exécuter les tests unitaires backend existants pour valider que les changements de schémas n'ont rien cassé.
*   Ajout de tests sur la logique d'attribution et de protection des données privées (Privacy inter-bénévoles).

### Manual Verification
*   **Création de compte** : Inscription d'un nouveau bénévole depuis l'UI, vérification de la création en base.
*   **Attribution** : Attribution d'une coupe, vérification que le bouton passe en "Annuler", et vérification des logs d'envoi d'e-mail.
*   **Privacy** : Connexion avec un autre compte bénévole pour vérifier l'absence des données de l'autre utilisateur sur la coupe.
*   **UI/UX** : Test de la recherche d'adresse (zoom), du comportement des filtres (boutons Valider/Réinitialiser, fermeture au clic extérieur sur mobile).
*   **Dessin manuel** : Tracé d'un polygone sur la carte, soumission et vérification de son apparition.
*   **Airtable** : Lancement manuel de la tâche de synchronisation pour s'assurer que les données remontent bien sur une base Airtable de test.
