const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MONGODB_URI o MONGO_URI mancante nel .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connesso");
  } catch (err) {
    console.error("Errore connessione MongoDB:", err);
    process.exit(1);
  }
}

module.exports = connectDB;
