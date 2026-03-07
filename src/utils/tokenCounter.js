function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function estimateCost(inputTokens, outputTokens) {
  const inputPrice = 0.2 / 1_000_000;
  const outputPrice = 0.8 / 1_000_000;

  const cost = inputTokens * inputPrice + outputTokens * outputPrice;

  return cost;
}

module.exports = {
  estimateTokens,
  estimateCost,
};
