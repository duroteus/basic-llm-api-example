const requests = {};

const WINDOW = 60000;
const LIMIT = 10;

module.exports = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  if (!requests[ip]) {
    requests[ip] = [];
  }

  requests[ip] = requests[ip].filter((timestamp) => now - timestamp < WINDOW);

  if (requests[ip].length >= LIMIT) {
    return res.status(429).json({
      error: "Too many requests",
    });
  }

  requests[ip].push(now);

  next();
};
