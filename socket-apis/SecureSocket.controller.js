const jwt = require("jsonwebtoken");

async function verifyToken(socket) {
  const token = socket.handshake.query.Authorization;
  try {
    if (!token) {
      throw new Error("Authentication error: Invalid token");
    }
    await jwt.verify(token, process.env.SECRET_KEY_ADMIN);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = verifyToken;
