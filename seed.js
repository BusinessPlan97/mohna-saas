// Données de démonstration.
// CLI : npm run seed  ·  Programmatique : import { buildSeed } (serveur auto-seed si base vide).

import { write, emptyDb, uid } from "./db.js";

export function buildSeed() {
let t = Date.now();
const stamp = () => new Date(t++).toISOString(); // horodatages croissants stables

const row = (obj) => ({ id: uid(), createdAt: stamp(), ...obj });

const db = emptyDb();

db.clients = [
  row({ name: "Groupe Aria", segment: "Grand compte" }),
  row({ name: "Nova Santé", segment: "ETI" }),
  row({ name: "Delta Industrie", segment: "ETI" }),
  row({ name: "Studio Vox", segment: "PME" }),
];

db.devis = [
  row({ number: "D-2026-082", client: "Studio Vox", obj: "Pack formation + suivi", status: "Signé", validUntil: "—", amountCents: 960000 }),
  row({ number: "D-2026-085", client: "Groupe Aria", obj: "Extension contrat conseil", status: "Signé", validUntil: "—", amountCents: 1800000 }),
  row({ number: "D-2026-088", client: "Nova Santé", obj: "Cadrage projet data", status: "À relancer", validUntil: "28/06/2026", amountCents: 1250000 }),
  row({ number: "D-2026-090", client: "Delta Industrie", obj: "Refonte SI — lot 1", status: "Vu", validUntil: "05/07/2026", amountCents: 2200000 }),
  row({ number: "D-2026-091", client: "Helio Conseil", obj: "Accompagnement stratégie", status: "Envoyé", validUntil: "30/06/2026", amountCents: 890000 }),
];

db.factures = [
  row({ number: "F-2026-042", client: "Nova Santé", type: "Solde", dueDate: "28/05/2026", status: "Payée", amountCents: 730000 }),
  row({ number: "F-2026-043", client: "Groupe Aria", type: "Récurrente", dueDate: "01/06/2026", status: "Payée", amountCents: 240000 }),
  row({ number: "F-2026-045", client: "Delta Industrie", type: "Acompte 30%", dueDate: "02/07/2026", status: "Partiel", amountCents: 660000 }),
  row({ number: "F-2026-044", client: "Studio Vox", type: "Standard", dueDate: "19/06/2026", status: "Retard", amountCents: 420000 }),
  row({ number: "F-2026-041", client: "Groupe Aria", type: "Solde", dueDate: "11/06/2026", status: "Retard", amountCents: 520000 }),
];

db.missions = [
  row({ name: "Cadrage data — phase 1", client: "Nova Santé", budget: "8 j", status: "Livrée" }),
  row({ name: "Pack formation + suivi", client: "Studio Vox", budget: "6 j", status: "En cours" }),
  row({ name: "Accompagnement stratégie", client: "Groupe Aria", budget: "20 j", status: "En cours" }),
  row({ name: "Refonte SI — lot 1", client: "Delta Industrie", budget: "14 j", status: "En cours" }),
];

db.services = [
  row({ name: "Journée de conseil", unit: "Jour", priceCents: 95000, costCents: 42000 }),
  row({ name: "Cadrage & audit", unit: "Forfait", priceCents: 450000, costCents: 210000 }),
  row({ name: "Formation (1 jour)", unit: "Jour", priceCents: 120000, costCents: 50000 }),
  row({ name: "Pack accompagnement 3 mois", unit: "Mois", priceCents: 240000, costCents: 100000 }),
];

db.expenses = [
  row({ vendor: "SNCF", category: "Déplacement", mission: "Refonte SI Delta", billable: true, amountCents: 14800, date: "20/06" }),
  row({ vendor: "Hôtel Lyon", category: "Hébergement", mission: "Refonte SI Delta", billable: true, amountCents: 21200, date: "15/06" }),
  row({ vendor: "OVHcloud", category: "Hébergement", mission: "—", billable: false, amountCents: 8900, date: "12/06" }),
];

db.opportunities = [
  row({ company: "Cabinet Lumen", subject: "Audit organisation", amountCents: 650000, stage: "Nouveau" }),
  row({ company: "PharmaPlus", subject: "Accompagnement", amountCents: 1400000, stage: "Nouveau" }),
  row({ company: "Nova Santé", subject: "Cadrage data", amountCents: 1250000, stage: "Qualifié" }),
  row({ company: "Delta Industrie", subject: "Refonte SI", amountCents: 2200000, stage: "Proposition" }),
  row({ company: "Groupe Aria", subject: "Extension contrat", amountCents: 1800000, stage: "Négociation" }),
];

  return db;
}

// Exécution directe en CLI : écrit le fichier.
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  write(buildSeed());
  console.log("✓ data.json initialisé avec les données de démonstration.");
}
