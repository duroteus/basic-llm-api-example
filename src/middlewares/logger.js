module.exports = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const usage = res.locals.usage ?? null;
    const cacheHit = res.locals.cacheHit ?? false;

    console.log({
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration,
      usage,
      cacheHit,
    });
  });

  next();
};
