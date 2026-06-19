const fs = require("fs");
const path = require("path");
const axios = require("axios");

async function buildNationalTeams() {
  try {
    console.log("Download comuni italiani...");

    const comuniResponse = await axios.get(
      "https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json"
    );

    const comuni = comuniResponse.data
      .map((item) => item.nome.toUpperCase())
      .sort();

    console.log(`Comuni trovati: ${comuni.length}`);

console.log("Download capitali del mondo...");

    const capitalsResponse = await axios.get(
    "https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-capital-city.json"
    );

    const capitals = [
    ...new Set(
        capitalsResponse.data
        .map((item) => item.city)
        .filter(Boolean)
        .map((city) => city.toUpperCase())
    ),
    ].sort();

    console.log(`Capitali trovate: ${capitals.length}`);

    const dataDir = path.join(__dirname, "..", "data");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dataDir, "comuni-italiani.json"),
      JSON.stringify(comuni, null, 2),
      "utf8"
    );

    fs.writeFileSync(
      path.join(dataDir, "capitali-mondo.json"),
      JSON.stringify(capitals, null, 2),
      "utf8"
    );

    console.log("File generati correttamente");
  } catch (error) {
    console.error("Errore:", error.message);
    process.exit(1);
  }
}

buildNationalTeams();