function* tokenize(text) {
  const words = text.split(" ");

  for (const word of words) {
    yield word + " ";
  }
}

async function streamText(res, text, { delay = 0 } = {}) {
  for (const token of tokenize(text)) {
    res.write(token);

    if (delay) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

module.exports = {
  streamText,
};
