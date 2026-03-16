import { createGatewayServer } from "./app/createGatewayServer.js";
import { loadGatewayEnv } from "./shared/config/env.js";

function bootstrap(): void {
	const env = loadGatewayEnv();
	const server = createGatewayServer(env);

	server.listen(env.port, () => {
		// Startup log stays concise and structured for future central logging.
		console.log(
			JSON.stringify({
				service: "gateway",
				level: "info",
				message: "Gateway listening",
				port: env.port,
				nodeEnv: env.nodeEnv,
			}),
		);
	});
}

bootstrap();
