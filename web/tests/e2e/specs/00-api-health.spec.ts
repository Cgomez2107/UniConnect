import { test, expect } from "@playwright/test";

test.describe("API Health Check", () => {
  test("should be able to login via API", async ({ request }) => {
    const email = process.env.TEST_USER_EMAIL || "estudiante.prueba@ucaldas.edu.co";
    const password = process.env.TEST_USER_PASSWORD || "Test1234";
    const gatewayUrl = process.env.E2E_GATEWAY_URL || "http://localhost:3000";

    console.log(`Testing login for: ${email}`);
    console.log(`Gateway URL: ${gatewayUrl}`);

    const response = await request.post(`${gatewayUrl}/api/v1/auth/signin`, {
      data: { email, password },
    });

    const body = await response.json();
    console.log("Response status:", response.status());
    console.log("Response body:", JSON.stringify(body, null, 2));

    if (!response.ok()) {
      console.error("Login API failed:", await response.text());
    }

    expect(response.status()).toBe(200);
    
    const data = body.data || body;
    expect(data.accessToken).toBeTruthy();
    expect(data.user).toBeTruthy();
    expect(data.user.email).toBe(email);
  });

  test("backend health check", async ({ request }) => {
    const gatewayUrl = process.env.E2E_GATEWAY_URL || "http://localhost:3000";
    
    const response = await request.get(`${gatewayUrl}/health`);
    expect(response.status()).toBe(200);
  });
});