import express from "express";
import cors from "cors";
import { getStore, COLLECTIONS } from "./store.js";
import { validate } from "./validators.js";
import { makeToken, verifyToken, checkCredentials, EMAIL } from "./auth.js";
import { buildSeed } from "./seed.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "12mb" })); // marge pour les justificatifs (images base64)

const PORT = process.env.PORT || 4000;
const isValid = (r) => COLLECTIONS.includes(r);
const notFound = (res, msg = "Ressource inconnue") => res.status(404).json({ error: { code: "not_found", message: msg } });
const unprocessable = (res, details) => res.status(422).json({ error: { code: "validation_error", message: "Données invalides", details } });
// Enrobe un handler async pour router les erreurs vers le middleware d'erreur.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/api/health", (req, res) => res.json({ ok: true, service: "pilotis-api" }));

// --- Authentification ---
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!checkCredentials(email, password)) {
    return res.status(401).json({ error: { code: "invalid_credentials", message: "Email ou mot de passe incorrect." } });
  }
  res.json({ token: makeToken(EMAIL), email: EMAIL });
});

// Toutes les routes /api suivantes exigent un jeton valide.
app.use("/api", (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!verifyToken(token)) return res.status(401).json({ error: { code: "unauthorized", message: "Connexion requise." } });
  next();
});

// Liste
app.get("/api/:resource", wrap(async (req, res) => {
  const { resource } = req.params;
  if (!isValid(resource)) return notFound(res);
  res.json(await (await getStore()).list(resource));
}));

// Détail
app.get("/api/:resource/:id", wrap(async (req, res) => {
  const { resource, id } = req.params;
  if (!isValid(resource)) return notFound(res);
  const item = await (await getStore()).get(resource, id);
  if (!item) return notFound(res, "Élément introuvable");
  res.json(item);
}));

// Création
app.post("/api/:resource", wrap(async (req, res) => {
  const { resource } = req.params;
  if (!isValid(resource)) return notFound(res);
  const errors = validate(resource, req.body || {});
  if (errors.length) return unprocessable(res, errors);
  res.status(201).json(await (await getStore()).create(resource, req.body || {}));
}));

// Mise à jour partielle
app.patch("/api/:resource/:id", wrap(async (req, res) => {
  const { resource, id } = req.params;
  if (!isValid(resource)) return notFound(res);
  const errors = validate(resource, req.body || {}, { partial: true });
  if (errors.length) return unprocessable(res, errors);
  const updated = await (await getStore()).update(resource, id, req.body || {});
  if (!updated) return notFound(res, "Élément introuvable");
  res.json(updated);
}));

// Suppression
app.delete("/api/:resource/:id", wrap(async (req, res) => {
  const { resource, id } = req.params;
  if (!isValid(resource)) return notFound(res);
  const ok = await (await getStore()).remove(resource, id);
  if (!ok) return notFound(res, "Élément introuvable");
  res.status(204).end();
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: { code: "bad_request", message: err.message } });
});

// Démarrage : initialise le store, auto-seed si la base est vide.
(async () => {
  try {
    const store = await getStore();
    if (await store.isEmpty()) {
      await store.bulkInsert(buildSeed());
      console.log("✓ Base vide : données de démonstration chargées.");
    }
    console.log(`✓ Stockage : ${store.backend}`);
  } catch (e) {
    console.error("Initialisation du stockage :", e.message);
  }
  app.listen(PORT, () => console.log(`✓ Pilotis API en écoute sur le port ${PORT}`));
})();
