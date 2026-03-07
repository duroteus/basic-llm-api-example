function normalizeQuestion(question) {
  return question.trim().replace(/\s+/g, " ").toLowerCase();
}

module.exports = {
  normalizeQuestion,
};
