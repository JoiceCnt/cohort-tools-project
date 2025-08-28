exports.notFound = (_req, res) => res.status(404).json({ error: "Not found" });

exports.errorHandler = (err, _req, res, _next) => {
  if (err?.name === "ValidationError")
    return res.status(400).json({ error: err.message });
  if (err?.name === "CastError")
    return res.status(400).json({ error: "Invalid id" });
  if (err?.code === 11000)
    return res.status(409).json({ error: "Duplicate key" });
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
};
