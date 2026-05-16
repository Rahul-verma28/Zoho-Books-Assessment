const ZOHO_DOMAIN = process.env.ZOHO_DOMAIN || ".in";
const ACCOUNTS_URL = `https://accounts.zoho${ZOHO_DOMAIN}/oauth/v2/token`;

class ZohoAuth {
  constructor() {
    this.clientId = process.env.ZOHO_CLIENT_ID;
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET;
    this.refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    this.organizationId = process.env.ZOHO_ORGANIZATION_ID;
    this.baseUrl = `https://www.zohoapis${ZOHO_DOMAIN}/books/v3`;

    this.accessToken = null;
    this.tokenExpiry = 0;
    this._orgResolved = this.organizationId && this.organizationId !== "auto";

    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      console.error(
        "Missing Zoho credentials. Please set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN in .env"
      );
    }
  }

  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log("🔄 Refreshing Zoho access token...");

    const params = new URLSearchParams({
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "refresh_token",
    });

    const response = await fetch(ACCOUNTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();
    console.log("🔑 Token response:", JSON.stringify(data, null, 2));

    if (data.error) {
      console.error(`Zoho OAuth Error: ${data.error}`);
      throw new Error(`Zoho OAuth Error: ${data.error}`);
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    console.log("Access token refreshed successfully");

    if (!this._orgResolved) {
      await this._discoverOrganizationId();
    }

    return this.accessToken;
  }


  async _discoverOrganizationId() {
    console.log("Auto-discovering Organization ID...");

    try {
      const response = await fetch(`${this.baseUrl}/organizations`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${this.accessToken}`,
        },
      });

      const data = await response.json();
      console.log("Organizations response:", JSON.stringify(data, null, 2));

      if (data.organizations && data.organizations.length > 0) {
        this.organizationId = data.organizations[0].organization_id;
        this._orgResolved = true;
        console.log(`Organization ID discovered: ${this.organizationId} (${data.organizations[0].name})`);
      } else {
        throw new Error("No organizations found in Zoho Books");
      }
    } catch (err) {
      console.error("Failed to discover Organization ID:", err.message);
      throw err;
    }
  }

  async request(endpoint, options = {}) {
    const token = await this.getAccessToken();
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (this.organizationId && this.organizationId !== "auto") {
      url.searchParams.set("organization_id", this.organizationId);
    }

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, value);
      }
    }

    console.log(`API Request: ${options.method || "GET"} ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: options.method || "GET",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        ...(options.headers || {}),
      },
      ...(options.body ? { body: options.body } : {}),
    });

    if (options.raw) {
      return response;
    }

    const data = await response.json();

    if (data.code !== 0 && data.code !== undefined) {
      console.error(`Zoho API Error [${endpoint}]:`, JSON.stringify(data));
      throw new Error(`Zoho API Error: ${data.message || JSON.stringify(data)}`);
    }

    return data;
  }
}

export const zohoAuth = new ZohoAuth();
