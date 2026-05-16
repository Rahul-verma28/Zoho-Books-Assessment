import { Router } from "express";

export function createZohoRouter(zoho) {
  const router = Router();

  // Debug / Test Connection 
  router.get("/debug/test", async (req, res) => {
    try {
      const token = await zoho.getAccessToken();
      res.json({
        status: "ok",
        hasToken: !!token,
        organizationId: zoho.organizationId,
        baseUrl: zoho.baseUrl,
      });
    } catch (err) {
      res.status(500).json({ error: err.message, step: "token_refresh" });
    }
  });

  // Organizations 
  router.get("/organizations", async (req, res) => {
    try {
      const token = await zoho.getAccessToken();
      const response = await fetch(`${zoho.baseUrl}/organizations`, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` },
      });
      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("Organizations Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Profit & Loss Report 
  router.get("/reports/profit-loss", async (req, res) => {
    try {
      const { from_date, to_date } = req.query;

      if (!from_date || !to_date) {
        return res.status(400).json({ error: "from_date and to_date are required (YYYY-MM-DD)" });
      }

      const data = await zoho.request("/reports/profitandloss", {
        params: { from_date, to_date },
      });

      res.json(data);
    } catch (err) {
      console.error("P&L Report Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/invoices", async (req, res) => {
    try {
      const params = {};
      if (req.query.date_start) params.date_start = req.query.date_start;
      if (req.query.date_end) params.date_end = req.query.date_end;
      if (req.query.status) params.status = req.query.status;
      if (req.query.customer_name) params.customer_name = req.query.customer_name;

      const data = await zoho.request("/invoices", { params });
      res.json(data);
    } catch (err) {
      console.error("Invoices Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/invoices/:id", async (req, res) => {
    try {
      const data = await zoho.request(`/invoices/${req.params.id}`);
      res.json(data);
    } catch (err) {
      console.error("Invoice Detail Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Bills
  router.get("/bills", async (req, res) => {
    try {
      const params = {};
      if (req.query.date_start) params.date_start = req.query.date_start;
      if (req.query.date_end) params.date_end = req.query.date_end;
      if (req.query.status) params.status = req.query.status;
      if (req.query.vendor_name) params.vendor_name = req.query.vendor_name;

      const data = await zoho.request("/bills", { params });
      res.json(data);
    } catch (err) {
      console.error("Bills Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/zoho/bills/:id
  router.get("/bills/:id", async (req, res) => {
    try {
      const data = await zoho.request(`/bills/${req.params.id}`);
      res.json(data);
    } catch (err) {
      console.error("Bill Detail Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Invoice Attachment (PDF) 
  router.get("/invoices/:id/attachment", async (req, res) => {
    try {
      const response = await zoho.request(`/invoices/${req.params.id}/attachment`, {
        raw: true,
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: errText });
      }

      const contentType = response.headers.get("content-type");
      const contentDisposition = response.headers.get("content-disposition");

      if (contentType) res.setHeader("Content-Type", contentType);
      if (contentDisposition) res.setHeader("Content-Disposition", contentDisposition);

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error("Invoice Attachment Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Bill Attachment (PDF) 
  router.get("/bills/:id/attachment", async (req, res) => {
    try {
      const response = await zoho.request(`/bills/${req.params.id}/attachment`, {
        raw: true,
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: errText });
      }

      const contentType = response.headers.get("content-type");
      const contentDisposition = response.headers.get("content-disposition");

      if (contentType) res.setHeader("Content-Type", contentType);
      if (contentDisposition) res.setHeader("Content-Disposition", contentDisposition);

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error("Bill Attachment Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Customers 
  router.get("/customers", async (req, res) => {
    try {
      const data = await zoho.request("/contacts", {
        params: { contact_type: "customer" },
      });
      res.json(data);
    } catch (err) {
      console.error("Customers Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Vendors 
  router.get("/vendors", async (req, res) => {
    try {
      const data = await zoho.request("/contacts", {
        params: { contact_type: "vendor" },
      });
      res.json(data);
    } catch (err) {
      console.error("Vendors Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
