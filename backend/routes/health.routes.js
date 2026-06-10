const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ error: false, message: "API online" });
});

module.exports = router;
