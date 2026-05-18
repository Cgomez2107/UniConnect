import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { AuthController } from "../interfaces/http/AuthController.js";

function sendOAuthUrl(res: ServerResponse, redirectTo?: string): void {
  const supabaseUrl = process.env.SUPABASE_URL || "https://becitrklvpadvjwdbmck.supabase.co";
  const hd = "ucaldas.edu.co";

  let authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&hd=${hd}`;

  if (redirectTo) {
    authUrl += `&redirect_to=${encodeURIComponent(redirectTo)}`;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ url: authUrl }));
}

export function createAuthServer(authController: AuthController) {
  return createServer(async (req, res) => {
    const path = req.url?.split("?")[0] || "";
    const method = req.method || "GET";
    const isAuthContractPath = path.startsWith("/api/v1/auth/");
    const normalizedPath = isAuthContractPath ? path.replace("/api/v1/auth", "") : path;

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, bypass-tunnel-reminder, ngrok-skip-browser-warning",
    );

    if (method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (method === "GET" && path === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "auth" }));
      return;
    }

    if (method === "POST" && (normalizedPath === "/signup" || normalizedPath === "/register")) {
      await authController.signup(req, res);
      return;
    }

    if (method === "POST" && (normalizedPath === "/signin" || normalizedPath === "/login")) {
      await authController.signin(req, res);
      return;
    }

    if (method === "POST" && (normalizedPath === "/refresh" || normalizedPath === "/refresh-token")) {
      await authController.refreshToken(req, res);
      return;
    }

    if (method === "GET" && path === "/session") {
      const auth = req.headers.authorization;

      if (auth?.startsWith("Bearer ")) {
        res.writeHead(200);
        res.end(JSON.stringify({
          session: { user: { email: "usuario@ucaldas.edu.co" }, access_token: auth.substring(7) },
        }));
        return;
      }

      res.writeHead(401);
      res.end(JSON.stringify({ error: "No session found" }));
      return;
    }

    if ((method === "POST" || method === "GET") && path === "/google") {
      let redirectTo: string | undefined;

      if (method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body) as { redirectTo?: string };
            redirectTo = parsed.redirectTo;
            sendOAuthUrl(res, redirectTo);
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON body" }));
          }
        });
        return;
      }

      const urlObj = new URL(req.url || "", "http://localhost");
      redirectTo = urlObj.searchParams.get("redirectTo") || undefined;
      sendOAuthUrl(res, redirectTo);
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  });
}
