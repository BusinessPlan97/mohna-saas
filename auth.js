// Authentification légère sans dépendance externe (HMAC via crypto natif).
// Identifiants et secret configurables par variables d'environnement (Render).
import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "pilotis-dev-secret-a-changer";
export const EMAIL = (process.env.PILOTIS_EMAIL || "contact@mohna-consulting.com").toLowerCase();
const PASSWORD = process.env.PILOTIS_PASSWORD || "pilotis2026";
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (data) => crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

export function makeToken(email) {
  const payload = b64({ email, exp: Date.now() + TTL_MS });
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return null;
  // comparaison à temps constant
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!o.exp || o.exp < Date.now()) return null;
    return o;
  } catch {
    return null;
  }
}

export function checkCredentials(email, password) {
  return String(email || "").toLowerCase() === EMAIL && String(password || "") === PASSWORD;
}
