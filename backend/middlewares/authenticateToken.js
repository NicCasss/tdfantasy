const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const bearerHeader = req.headers.authorization;
  const bearerToken = bearerHeader?.startsWith("Bearer ")
    ? bearerHeader.split(" ")[1]
    : null;

  const cookieToken = req.cookies?.accessToken;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ error: true, message: "Accesso non autorizzato" });
  }

  try {
    req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: true, message: "Token non valido o scaduto" });
  }
}

module.exports = { authenticateToken };
