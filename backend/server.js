import "dotenv/config";
import express from "express";
import cors from "cors";
import { zohoAuth } from "./lib/zoho-auth.js";
import { createZohoRouter } from "./routes/zoho.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Zoho Books API routes
app.use("/api/zoho", createZohoRouter(zohoAuth));

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Zoho domain: https://www.zohoapis${process.env.ZOHO_DOMAIN || ".in"}`);
});
