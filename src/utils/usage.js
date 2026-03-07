const { estimateTokens, estimateCost } = require("./tokenCounter");

function computeUsage(input, output) {
  const inputTokens = estimateTokens(input);
  const outputTokens = estimateTokens(output);

  return {
    inputTokens,
    outputTokens,
    cost: estimateCost(inputTokens, outputTokens),
  };
}

module.exports = {
  computeUsage,
};
