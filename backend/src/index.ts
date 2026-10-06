import "dotenv/config";
import cors from "cors";
import express from "express";

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import activitiesRouter from "./routes/activities";
import eventsRouter from "./routes/events";
import metricsRouter from "./routes/metrics";
import simulateRouter from "./routes/simulate";
import wordsRouter from "./routes/words";
import { checkDatabase } from "./services/healthService";

const app = express();

const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// Liveness + readiness check. Always returns 200 while the process is up so
// monitoring tools can distinguish a reachable-but-degraded service (database
// unreachable) from a completely down one.
app.get("/health", async (_req, res) => {
  const databaseConnected = await checkDatabase();

  res.status(200).json({
    status: databaseConnected ? "ok" : "degraded",
    database: databaseConnected ? "connected" : "unreachable",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.use("/api/activities", activitiesRouter);
app.use("/api", wordsRouter);
app.use("/api", eventsRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/simulate", simulateRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Phoneme Activity Builder API listening on port ${PORT}`);
});
