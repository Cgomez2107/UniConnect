import { createServer } from "node:http";

import { CreateStudyResource } from "./application/use-cases/CreateStudyResource.js";
import { DeleteStudyResource } from "./application/use-cases/DeleteStudyResource.js";
import { GetStudyResourceById } from "./application/use-cases/GetStudyResourceById.js";
import { ListStudyResources } from "./application/use-cases/ListStudyResources.js";
import { UpdateStudyResource } from "./application/use-cases/UpdateStudyResource.js";
import { loadResourcesEnv } from "./config/env.js";
import { InMemoryStudyResourceRepository } from "./infrastructure/database/InMemoryStudyResourceRepository.js";
import { PostgresStudyResourceRepository } from "./infrastructure/database/PostgresStudyResourceRepository.js";
import { SupabaseStorageCleaner } from "./infrastructure/storage/SupabaseStorageCleaner.js";
import { ResourcesController } from "./interfaces/http/controllers/ResourcesController.js";
import { handleResourcesRoutes } from "./interfaces/http/routes/resourcesRoutes.js";
import type { IStudyResourceRepository } from "./domain/repositories/IStudyResourceRepository.js";

function sendJsonError(statusCode: number, message: string): string {
	return JSON.stringify({ error: message, statusCode });
}

function createRepository(env: ReturnType<typeof loadResourcesEnv>): IStudyResourceRepository {
	const hasDatabaseConfig =
		!!env.dbHost &&
		!!env.dbPort &&
		!!env.dbName &&
		!!env.dbUser &&
		!!env.dbPassword &&
		env.dbPassword !== "replace_me";

	if (hasDatabaseConfig) {
		return new PostgresStudyResourceRepository(env);
	}

	console.log(
		JSON.stringify({
			service: "resources",
			level: "warn",
			message: "Database config missing or placeholder detected; using in-memory repository",
		}),
	);

	return new InMemoryStudyResourceRepository();
}

function bootstrap(): void {
	const env = loadResourcesEnv();

	const repository = createRepository(env);
	const listStudyResources = new ListStudyResources(repository);
	const getStudyResourceById = new GetStudyResourceById(repository);
	const createStudyResource = new CreateStudyResource(repository);
	const updateStudyResource = new UpdateStudyResource(repository);
	const storageCleaner = new SupabaseStorageCleaner(env);
	const deleteStudyResource = new DeleteStudyResource(repository, storageCleaner);

	const controller = new ResourcesController(
		listStudyResources,
		getStudyResourceById,
		createStudyResource,
		updateStudyResource,
		deleteStudyResource,
	);

	const server = createServer((req, res) => {
		void (async () => {
			const handled = await handleResourcesRoutes(req, res, controller);
			if (!handled) {
				res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
				res.end(sendJsonError(404, "Route not found"));
			}
		})().catch((error: unknown) => {
			res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
			res.end(sendJsonError(500, error instanceof Error ? error.message : "Unexpected service error"));
		});
	});

	server.listen(env.port, () => {
		console.log(
			JSON.stringify({
				service: "resources",
				level: "info",
				message: "Service listening",
				port: env.port,
				nodeEnv: env.nodeEnv,
			}),
		);
	});
}

bootstrap();
