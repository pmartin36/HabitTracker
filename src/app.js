import express from "express";
import { createServer } from "http";

const app = express();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export function startServer(port) {
  const server = createServer(app);
  server.listen(port);
  return server;
}

export default app;
