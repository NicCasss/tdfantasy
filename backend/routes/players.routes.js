const express = require("express");
const Player = require("../models/playerModel");
const { authenticateToken } = require("../middlewares/authenticateToken");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      search = "",
      team = "",
      active = "true",
      sort = "price_desc",
      remainingBudget,
      remainingSlots,
      selectedIds = "",
      smartBudget = "false",
    } = req.query;

    if (String(search).length > 40) {
      return res.status(400).json({
        error: true,
        message: "Ricerca troppo lunga",
      });
    }

    if (String(team).length > 40) {
      return res.status(400).json({
        error: true,
        message: "Nome squadra troppo lungo",
      });
    }

    const query = {};

    if (active !== "all") {
      query.active = active === "true";
    }

    if (team) {
      query.team = new RegExp(`^${escapeRegExp(team)}$`, "i");
    }

    if (search) {
      query.$or = [
        { name: new RegExp(escapeRegExp(search), "i") },
        { team: new RegExp(escapeRegExp(search), "i") },
        { playerId: new RegExp(escapeRegExp(search), "i") },
      ];
    }

    const sortOption = getSortOption(sort);

    let players = await Player.find(query)
      .sort(sortOption)
      .select("playerId name team price active")
      .lean();

    if (smartBudget === "true") {
      const parsedRemainingBudget = Number(remainingBudget);
      const parsedRemainingSlots = Number(remainingSlots);

      const selectedIdSet = new Set(
        String(selectedIds || "")
          .split(",")
          .map((id) => id.trim().toUpperCase())
          .filter(Boolean)
      );

      players = applySmartBudgetFilter({
        players,
        selectedIdSet,
        remainingBudget: parsedRemainingBudget,
        remainingSlots: parsedRemainingSlots,
      });
    }

    return res.json({
      error: false,
      count: players.length,
      players,
    });
  } catch (err) {
    console.error("Errore get players:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

function applySmartBudgetFilter({
  players,
  selectedIdSet,
  remainingBudget,
  remainingSlots,
}) {
  if (
    !Number.isFinite(remainingBudget) ||
    !Number.isFinite(remainingSlots) ||
    remainingSlots <= 0
  ) {
    return players;
  }

  return players.filter((player) => {
    const playerId = String(player.playerId || "").toUpperCase();
    const isAlreadySelected = selectedIdSet.has(playerId);

    if (isAlreadySelected) {
      return true;
    }

    const price = Number(player.price || 0);

    if (price > remainingBudget) {
      return false;
    }

    const slotsAfterPurchase = remainingSlots - 1;
    const budgetAfterPurchase = remainingBudget - price;

    if (slotsAfterPurchase <= 0) {
      return budgetAfterPurchase >= 0;
    }

    const cheapestOtherPlayers = players
      .filter((candidate) => {
        const candidateId = String(candidate.playerId || "").toUpperCase();

        return (
          candidateId !== playerId &&
          !selectedIdSet.has(candidateId) &&
          Number(candidate.price || 0) <= budgetAfterPurchase
        );
      })
      .map((candidate) => Number(candidate.price || 0))
      .sort((a, b) => a - b)
      .slice(0, slotsAfterPurchase);

    if (cheapestOtherPlayers.length < slotsAfterPurchase) {
      return false;
    }

    const minimumCostToComplete = cheapestOtherPlayers.reduce(
      (sum, value) => sum + value,
      0
    );

    return minimumCostToComplete <= budgetAfterPurchase;
  });
}

function getSortOption(sort) {
  switch (sort) {
    case "price_asc":
      return { price: 1, name: 1 };

    case "name_asc":
      return { name: 1 };

    case "team_asc":
      return { team: 1, name: 1 };

    case "price_desc":
    default:
      return { price: -1, name: 1 };
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = router;