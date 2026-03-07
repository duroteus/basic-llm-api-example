const llmService = require("../services/llm.service");
const cache = require("../cache/memoryCache");
const { computeUsage } = require("../utils/usage");
const { streamText } = require("../utils/streamText");
const { normalizeQuestion } = require("../utils/normalizeQuestion");

exports.ask = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const normalizedQuestion = normalizeQuestion(question);

    const cached = cache.get(normalizedQuestion);

    if (cached) {
      res.locals.cacheHit = true;
      return res.json({
        answer: cached,
        cached: true,
      });
    }

    const answer = await llmService.askLLM(normalizedQuestion);

    res.locals.usage = computeUsage(normalizedQuestion, answer);

    cache.set(normalizedQuestion, answer);

    res.json({
      answer,
      cached: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

exports.askStream = async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");

  const normalizedQuestion = normalizeQuestion(question);

  try {
    const cached = cache.get(normalizedQuestion);

    if (cached) {
      await streamText(res, cached, { delay: 5 });

      res.locals.cacheHit = true;

      return res.end();
    }

    let fullAnswer = "";
    let completed = false;

    await llmService.streamLLM(question, (token) => {
      fullAnswer += token;
      res.write(token);
    });

    completed = true;

    if (completed) {
      cache.set(normalizedQuestion, fullAnswer);
    }

    res.locals.usage = computeUsage(question, fullAnswer);

    res.end();
  } catch (error) {
    console.error(error);
    res.end("\n[ERROR]");
  }
};
