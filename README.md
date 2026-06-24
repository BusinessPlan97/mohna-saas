# Pilotis API — backend REST (Express + stockage JSON)

Backend exécutable du prototype Pilotis. **Zéro dépendance native, zéro script
d'installation** : démarre partout sans compilation. Les données sont stockées dans
un simple fichier `data.json`.

> Choix volontaire pour le prototype : certains environnements npm bloquent les
> scripts d'installation et les binaires natifs (Prisma, better-sqlite3…). Ce backend
> les évite. Le modèle de données cible pour la **production** (PostgreSQL + Prisma)
> reste documenté dans `prisma/schema.prisma`.

## Démarrer

```bash
cd pilotis-api
npm install
npm run setup     # crée data.json avec les données de démonstration
npm run dev       # API sur http://localhost:4000
```

`npm run setup` réinitialise les données. À relancer uniquement pour repartir de zéro.

## Endpoints

Ressources : `clients`, `devis`, `factures`, `missions`, `expenses`, `services`, `opportunities`.

| Méthode | Route | Effet |
|---|---|---|
| GET | `/api/health` | Vérifie que l'API tourne |
| GET | `/api/:resource` | Liste (triée par date décroissante) |
| GET | `/api/:resource/:id` | Détail |
| POST | `/api/:resource` | Création (id + createdAt auto) |
| PATCH | `/api/:resource/:id` | Mise à jour partielle |
| DELETE | `/api/:resource/:id` | Suppression |

Exemple :

```bash
curl http://localhost:4000/api/devis
curl -X POST http://localhost:4000/api/devis \
  -H "Content-Type: application/json" \
  -d '{"number":"D-2026-100","client":"Atelier Boréal","obj":"Conseil","status":"Brouillon","amountCents":320000}'
```

## Modèle de données

Montants en **centimes** (`amountCents`, `priceCents`, `costCents`). Champs alignés sur
ce qu'attend le frontend (`src/data/api.js` + `DataContext`).

## Connecter le frontend

Dans `pilotis-app`, le fichier `.env.local` contient déjà :

```
VITE_API_URL=http://localhost:4000/api
```

Démarrer le backend **avant** le frontend ; le bandeau passe au vert « Connecté au backend ».

## Vers la production

Reprendre `prisma/schema.prisma`, brancher PostgreSQL (`prisma migrate`), puis ajouter
auth (JWT), RBAC et validation comme décrit dans le blueprint.
