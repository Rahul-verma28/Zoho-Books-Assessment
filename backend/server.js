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

// Zoho Books API routes - mount on both /api/zoho and /zoho in case Vercel strips the routePrefix
app.use(["/api/zoho", "/zoho"], createZohoRouter(zohoAuth));

// Always listen on the provided PORT (Vercel will inject this for services)
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Zoho domain: https://www.zohoapis${process.env.ZOHO_DOMAIN || ".in"}`);
});

export default app;
