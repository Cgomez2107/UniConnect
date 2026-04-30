import { createGatewayServer } from "./app/createGatewayServer.js";
import { loadGatewayEnv } from "./shared/config/env.js";

function bootstrap(): void {
	const env = loadGatewayEnv();
	const server = createGatewayServer(env);

	// Cast to any to allow :: binding for network access (IPv4 and IPv6)
	(server as any).listen({ port: env.port, host: "::" }, () => {
		// Startup log stays concise and structured for future central logging.
		console.log(
			JSON.stringify({
				service: "gateway",
				level: "info",
				message: "Gateway listening",
				port: env.port,
				host: "::",
				nodeEnv: env.nodeEnv,
			}),
		);
	});
}

bootstrap();
