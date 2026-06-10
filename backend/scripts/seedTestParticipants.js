require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/userModel");
const Player = require("../models/playerModel");
const Roster = require("../models/rosterModel");
const FantasySettings = require("../models/fantasySettingsModel");

const TEST_PASSWORD = "Test123!";
const TEST_EMAIL_DOMAIN = "tdfantasy.test";

const TEST_TEAMS = [
  "LAS VEGAS",
  "GOGOGOGO",
  "ANCONA",
  "SAN GIACOMO",
  "LAMEZIA TERME",
  "MEDELLIN",
  "TORONTO PAESE",
  "BOGOTÀ",
  "L'AQUILA",
  "VIA INDIPENDENZA",
  "VILLA MAISÉ",
  "SANTA PETRONILLA",
  "TRANI",
  "FROSINONE",
  "KAMBURUGAMUWA",
  "TROPEA",
  "CASACALENDA",
  "COLLESALVETTI",
  "CASAL THAULERO",
  "LIVORNO",
  "GODO",
  "PAPERINO",
  "SAN BENEDETTO IN PERILLIS",
  "CERCHIARA",
  "CHIETI SCALO",
  "CALIFOGGIA",
  "ISOLE COOK",
  "FICULLO",
  "CEPAGATTI",
  "ORGIA",
];

function createTeamSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function getPlayerPrice(player) {
  return Number(player.price || 0);
}

function getTotalCost(players) {
  return players.reduce((sum, player) => sum + getPlayerPrice(player), 0);
}

function canCompleteRosterAfterBuying({
  candidate,
  selectedPlayers,
  allPlayers,
  budgetCap,
  rosterSize,
}) {
  const selectedIds = new Set(selectedPlayers.map((p) => String(p.playerId)));
  const currentCost = getTotalCost(selectedPlayers);
  const candidatePrice = getPlayerPrice(candidate);

  if (selectedIds.has(String(candidate.playerId))) {
    return false;
  }

  if (currentCost + candidatePrice > budgetCap) {
    return false;
  }

  const slotsAfterPurchase = rosterSize - selectedPlayers.length - 1;
  const budgetAfterPurchase = budgetCap - currentCost - candidatePrice;

  if (slotsAfterPurchase <= 0) {
    return budgetAfterPurchase >= 0;
  }

  const cheapestOthers = allPlayers
    .filter((player) => {
      const playerId = String(player.playerId);
      const price = getPlayerPrice(player);

      return (
        playerId !== String(candidate.playerId) &&
        !selectedIds.has(playerId) &&
        price <= budgetAfterPurchase
      );
    })
    .map(getPlayerPrice)
    .sort((a, b) => a - b)
    .slice(0, slotsAfterPurchase);

  if (cheapestOthers.length < slotsAfterPurchase) {
    return false;
  }

  const minimumCostToComplete = cheapestOthers.reduce(
    (sum, price) => sum + price,
    0
  );

  return minimumCostToComplete <= budgetAfterPurchase;
}

function pickRosterForUser(allPlayers, budgetCap, rosterSize) {
  const selectedPlayers = [];

  const playersPool = shuffle(allPlayers);

  for (const candidate of playersPool) {
    if (selectedPlayers.length >= rosterSize) break;

    const canBuy = canCompleteRosterAfterBuying({
      candidate,
      selectedPlayers,
      allPlayers,
      budgetCap,
      rosterSize,
    });

    if (canBuy) {
      selectedPlayers.push(candidate);
    }
  }

  if (selectedPlayers.length === rosterSize) {
    return selectedPlayers;
  }

  const cheapestPlayers = [...allPlayers]
    .sort((a, b) => getPlayerPrice(a) - getPlayerPrice(b))
    .slice(0, rosterSize);

  if (cheapestPlayers.length !== rosterSize) {
    throw new Error("Giocatori attivi insufficienti per completare una rosa.");
  }

  const cheapestTotal = getTotalCost(cheapestPlayers);

  if (cheapestTotal > budgetCap) {
    throw new Error(
      `Budget insufficiente: i ${rosterSize} giocatori più economici costano ${cheapestTotal}, budget disponibile ${budgetCap}.`
    );
  }

  return cheapestPlayers;
}

function buildRosterPlayers(players) {
  return players.map((player) => ({
    playerId: String(player.playerId || "").trim().toUpperCase(),
    name: String(player.name || "").trim(),
    team: String(player.team || "").trim(),
    price: getPlayerPrice(player),
  }));
}

async function loadFantasySettings() {
  const settings = await FantasySettings.findOne({}).lean();

  return {
    budgetCap: Number(process.env.SEED_BUDGET_CAP || settings?.budgetCap || 100),
    rosterSize: Number(process.env.SEED_ROSTER_SIZE || settings?.rosterSize || 4),
  };
}

async function deleteExistingTestData() {
  const testEmails = TEST_TEAMS.map((_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `test${number}@${TEST_EMAIL_DOMAIN}`;
  });

  const existingUsers = await User.find({
    email: { $in: testEmails },
  }).select("_id email fantasyTeamName");

  const existingUserIds = existingUsers.map((user) => user._id);

  if (!existingUserIds.length) {
    return 0;
  }

  await Roster.deleteMany({ userId: { $in: existingUserIds } });
  await User.deleteMany({ _id: { $in: existingUserIds } });

  return existingUserIds.length;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI mancante nel file .env");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connesso");

  const { budgetCap, rosterSize } = await loadFantasySettings();

  console.log(`Budget seed: ${budgetCap}`);
  console.log(`Roster size seed: ${rosterSize}`);

  const activePlayers = await Player.find({ active: true })
    .sort({ price: 1, name: 1 })
    .lean();

  if (activePlayers.length < rosterSize) {
    throw new Error(
      `Giocatori attivi insufficienti. Trovati ${activePlayers.length}, richiesti almeno ${rosterSize}.`
    );
  }

  const cheapestTotal = getTotalCost(
    [...activePlayers]
      .sort((a, b) => getPlayerPrice(a) - getPlayerPrice(b))
      .slice(0, rosterSize)
  );

  if (cheapestTotal > budgetCap) {
    throw new Error(
      `Impossibile creare rose valide: i ${rosterSize} giocatori più economici costano ${cheapestTotal}, budget ${budgetCap}.`
    );
  }

  const removed = await deleteExistingTestData();

  if (removed > 0) {
    console.log(`Rimossi ${removed} utenti test esistenti con relative rose`);
  }

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);

  const createdUsers = [];
  const createdRosters = [];

  for (let i = 0; i < TEST_TEAMS.length; i++) {
    const number = String(i + 1).padStart(2, "0");
    const teamName = TEST_TEAMS[i];
    const email = `test${number}@${TEST_EMAIL_DOMAIN}`;
    const fantasyTeamSlug = createTeamSlug(teamName);

    const selectedPlayers = pickRosterForUser(
      activePlayers,
      budgetCap,
      rosterSize
    );

    const rosterPlayers = buildRosterPlayers(selectedPlayers);
    const totalCost = getTotalCost(rosterPlayers);

    const user = await User.create({
      fullName: `Partecipante Test ${number}`,
      fantasyTeamName: teamName,
      fantasyTeamSlug,
      nationalTeam: teamName,
      assignedTeamName: teamName,
      email,
      password: hashedPassword,
      role: "user",
      isEmailVerified: true,
    });

    const roster = await Roster.create({
      userId: user._id,
      userEmail: user.email,
      assignedTeamName: teamName,
      players: rosterPlayers,
      totalCost,
      budgetCap,
      rosterSize,
      status: rosterPlayers.length === rosterSize ? "complete" : "draft",
      submittedAt: new Date(),
      lastUpdatedAt: new Date(),
    });

    createdUsers.push(user);
    createdRosters.push(roster);

    console.log(
      `${number}. ${teamName} | ${email} | costo ${totalCost}/${budgetCap} | ${rosterPlayers
        .map((p) => `${p.name} (${p.price})`)
        .join(", ")}`
    );
  }

  console.log("");
  console.log("Seed completato correttamente");
  console.log(`Utenti creati: ${createdUsers.length}`);
  console.log(`Rose create: ${createdRosters.length}`);
  console.log(`Password test: ${TEST_PASSWORD}`);
  console.log("");
  console.log("Esempio login:");
  console.log(`Email: test01@${TEST_EMAIL_DOMAIN}`);
  console.log(`Password: ${TEST_PASSWORD}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Errore seed:", err);

  try {
    await mongoose.disconnect();
  } catch (_) {}

  process.exit(1);
});