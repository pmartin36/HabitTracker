import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export function startServer(port) {
  return app.listen(port);
}

export default app;
