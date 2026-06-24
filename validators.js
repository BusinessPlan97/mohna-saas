// Validation légère par ressource. Renvoie un tableau de messages d'erreur (vide = OK).

const isNum = (v) => typeof v === "number" && !Number.isNaN(v);
const isBool = (v) => typeof v === "boolean";
const isStr = (v) => typeof v === "string";

const SCHEMAS = {
  clients: { required: ["name"], fields: { name: isStr } },
  devis: { required: ["number", "client"], fields: { number: isStr, client: isStr, amountCents: isNum } },
  factures: { required: ["number", "client"], fields: { number: isStr, client: isStr, amountCents: isNum } },
  missions: { required: ["name", "client"], fields: { name: isStr, client: isStr } },
  expenses: { required: ["vendor"], fields: { vendor: isStr, amountCents: isNum, billable: isBool } },
  services: { required: ["name"], fields: { name: isStr, priceCents: isNum, costCents: isNum } },
  opportunities: { required: ["company"], fields: { company: isStr, amountCents: isNum } },
  timeEntries: { required: ["mission"], fields: { mission: isStr, durationMin: isNum, billable: isBool } },
  subscriptions: { required: ["client"], fields: { client: isStr, amountCents: isNum, active: isBool } },
  contracts: { required: ["client"], fields: { client: isStr, amountCents: isNum } },
  allocations: { required: ["mission"], fields: { mission: isStr, days: isNum } },
  automations: { required: ["title"], fields: { title: isStr, enabled: isBool } },
  users: { required: ["name"], fields: { name: isStr, email: isStr, role: isStr } },
};

export function validate(resource, body, { partial = false } = {}) {
  const schema = SCHEMAS[resource];
  if (!schema) return [];
  const errors = [];

  // Champs obligatoires (uniquement en création).
  if (!partial) {
    for (const field of schema.required || []) {
      const v = body[field];
      if (v === undefined || v === null || v === "") errors.push(`Le champ « ${field} » est requis.`);
    }
  }

  // Types des champs fournis.
  for (const [field, check] of Object.entries(schema.fields || {})) {
    if (body[field] !== undefined && body[field] !== null && !check(body[field])) {
      errors.push(`Le champ « ${field} » a un format invalide.`);
    }
  }

  return errors;
}
