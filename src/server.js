require("dotenv").config();

const express = require("express");

const logger = require("./middlewares/logger");
const rateLimit = require("./middlewares/rateLimit");
const askRoutes = require("./routes/ask.routes");

const PORT = 3000;

const app = express();

app.use(express.json());
app.use(logger);
app.use(rateLimit);

app.use("/ask", askRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
