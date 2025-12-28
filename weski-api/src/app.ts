import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { searchRouter } from "./routes/search.routes";

dotenv.config();

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "*",
      credentials: false
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api", searchRouter);

  return app;
}
