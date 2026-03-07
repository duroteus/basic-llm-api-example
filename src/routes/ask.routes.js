const express = require("express");
const router = express.Router();

const askController = require("../controllers/ask.controller");

router.post("/", askController.ask);
router.post("/stream", askController.askStream);

module.exports = router;
