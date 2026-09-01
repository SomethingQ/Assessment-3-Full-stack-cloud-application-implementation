import "dotenv/config";
import cors from "cors";
import express from "express";

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import activitiesRouter from "./routes/activities";
import wordsRouter from "./routes/words";

const app = express();

const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// Minimal liveness check used by the Docker demo and later
// instrumentation assessments - just confirms the API process is up.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/activities", activitiesRouter);
app.use("/api", wordsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Phoneme Activity Builder API listening on port ${PORT}`);
});
