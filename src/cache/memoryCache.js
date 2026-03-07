const cache = new Map();

const TTL = 5 * 60 * 1000;

function get(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() > item.expire) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function set(key, value) {
  cache.set(key, {
    value,
    expire: Date.now() + TTL,
  });
}

module.exports = {
  get,
  set,
};
