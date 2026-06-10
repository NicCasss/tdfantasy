const Player = require("../models/playerModel");
const { readSheetValues } = require("./googleSheets.service");

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizePlayerId(value) {
  return String(value || "").trim().toUpperCase();
}

function parseBoolean(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (["true", "vero", "si", "sì", "yes", "1", "attivo"].includes(normalized)) {
    return true;
  }

  if (["false", "falso", "no", "0", "non_attivo", "inattivo"].includes(normalized)) {
    return false;
  }

  return true;
}

function parsePrice(value) {
  const normalized = String(value || "")
    .trim()
    .replace(",", ".");

  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function rowToObject(headers, row) {
  const obj = {};

  headers.forEach((header, index) => {
    obj[header] = row[index] ?? "";
  });

  return obj;
}

function validatePlayerRow(rowObj, rowNumber) {
  const errors = [];

  const playerId = normalizePlayerId(rowObj.PLAYER_ID);
  const name = normalizeString(rowObj.NOME);
  const team = normalizeString(rowObj.SQUADRA);
  const price = parsePrice(rowObj.PREZZO);
  const active = parseBoolean(rowObj.ATTIVO);
  const notes = normalizeString(rowObj.NOTE);

  if (!playerId) {
    errors.push(`Riga ${rowNumber}: PLAYER_ID mancante`);
  }

  if (!name) {
    errors.push(`Riga ${rowNumber}: NOME mancante`);
  }

  if (!team) {
    errors.push(`Riga ${rowNumber}: SQUADRA mancante`);
  }

  if (price === null) {
    errors.push(`Riga ${rowNumber}: PREZZO non valido`);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      player: null,
    };
  }

  return {
    valid: true,
    errors: [],
    player: {
      playerId,
      name,
      team,
      price,
      active,
      notes,
      source: "google_sheets",
      lastSyncedAt: new Date(),
    },
  };
}

async function syncPlayersFromGoogleSheet() {
  const sheetName = process.env.GOOGLE_PLAYERS_SHEET_NAME || "PLAYERS";
  const range = `${sheetName}!A:F`;

  const values = await readSheetValues(range);

  if (!values.length) {
    return {
      read: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: ["Il tab PLAYERS è vuoto"],
    };
  }

  const headers = values[0].map(normalizeHeader);

  const requiredHeaders = [
    "PLAYER_ID",
    "NOME",
    "SQUADRA",
    "PREZZO",
    "ATTIVO",
    "NOTE",
  ];

  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    return {
      read: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [
        `Header mancanti nel foglio PLAYERS: ${missingHeaders.join(", ")}`,
      ],
    };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  const errors = [];
  const seenPlayerIds = new Set();

  const rows = values.slice(1);

  for (let index = 0; index < rows.length; index++) {
    const rowNumber = index + 2;
    const row = rows[index];

    const isEmptyRow = row.every((cell) => String(cell || "").trim() === "");

    if (isEmptyRow) {
      skipped++;
      continue;
    }

    const rowObj = rowToObject(headers, row);
    const validation = validatePlayerRow(rowObj, rowNumber);

    if (!validation.valid) {
      skipped++;
      errors.push(...validation.errors);
      continue;
    }

    const player = validation.player;

    if (seenPlayerIds.has(player.playerId)) {
      skipped++;
      errors.push(
        `Riga ${rowNumber}: PLAYER_ID duplicato nel foglio: ${player.playerId}`
      );
      continue;
    }

    seenPlayerIds.add(player.playerId);

    const existing = await Player.findOne({ playerId: player.playerId });

    await Player.updateOne(
      { playerId: player.playerId },
      {
        $set: player,
      },
      { upsert: true }
    );

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  return {
    read: rows.length,
    created,
    updated,
    skipped,
    errors,
  };
}

module.exports = {
  syncPlayersFromGoogleSheet,
};