import { createGatewayServer } from "./app/createGatewayServer.js";
import { loadGatewayEnv } from "./shared/config/env.js";

function bootstrap(): void {
	const env = loadGatewayEnv();
	const server = createGatewayServer(env);

	// Listen on 0.0.0.0 to accept IPv4 connections from all interfaces (web, iOS, Android)
	(server as any).listen({ port: env.port, host: "0.0.0.0" }, () => {
		// Startup log stays concise and structured for future central logging.
		console.log(
			JSON.stringify({
				service: "gateway",
				level: "info",
				message: "Gateway listening",
				port: env.port,
				host: "0.0.0.0",
				nodeEnv: env.nodeEnv,
			}),
		);
	});
}

bootstrap();
