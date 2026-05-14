import { createServer } from "node:http";

import { loadAcademicQnaEnv } from "./config/env.js";
import { Database } from "./infrastructure/database/Database.js";
import { PostgresForumQuestionRepository } from "./infrastructure/database/PostgresForumQuestionRepository.js";
import { PostgresForumAnswerRepository } from "./infrastructure/database/PostgresForumAnswerRepository.js";
import { PostgresForumVoteRepository } from "./infrastructure/database/PostgresForumVoteRepository.js";
import { PostgresEnrollmentRepository } from "./infrastructure/database/PostgresEnrollmentRepository.js";
import { CreateQuestion } from "./application/use-cases/CreateQuestion.js";
import { CreateAnswer } from "./application/use-cases/CreateAnswer.js";
import { CastVote } from "./application/use-cases/CastVote.js";
import { ListQuestions } from "./application/use-cases/ListQuestions.js";
import { GetQuestionDetail } from "./application/use-cases/GetQuestionDetail.js";
import { ListAnswers } from "./application/use-cases/ListAnswers.js";
import { ForumController } from "./interfaces/http/controllers/ForumController.js";
import { handleForumRoutes } from "./interfaces/http/routes/forumRoutes.js";
import { ForumSubject } from "./domain/events/ForumSubject.js";
import { ForumRealtimeObserver } from "./domain/events/observers/ForumRealtimeObserver.js";
import { SupabaseRealtimeGateway } from "./infrastructure/realtime/SupabaseRealtimeGateway.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message, statusCode });
}

function bootstrap(): void {
  const env = loadAcademicQnaEnv();

  const hasDatabaseConfig =
    !!env.dbHost && !!env.dbPort && !!env.dbName && !!env.dbUser && !!env.dbPassword;
  const pool = hasDatabaseConfig ? Database.getInstance(env).getPool() : null;

  if (!pool) {
    console.warn(
      JSON.stringify({
        service: "academic-qna",
        level: "warn",
        message: "Database config missing; service will not persist data",
      }),
    );
    return;
  }

  const questionRepo = new PostgresForumQuestionRepository(pool);
  const answerRepo = new PostgresForumAnswerRepository(pool);
  const voteRepo = new PostgresForumVoteRepository(pool);
  const enrollmentRepo = new PostgresEnrollmentRepository(pool);

  const forumSubject = new ForumSubject();

  const realtimeGateway = (env.supabaseUrl && env.supabaseServiceRoleKey)
    ? new SupabaseRealtimeGateway(env.supabaseUrl, env.supabaseServiceRoleKey)
    : null;

  if (realtimeGateway) {
    const realtimeObserver = new ForumRealtimeObserver(realtimeGateway);
    forumSubject.subscribe(realtimeObserver);
  } else {
    console.warn(
      JSON.stringify({
        service: "academic-qna",
        level: "warn",
        message: "Supabase credentials missing; realtime notifications disabled",
      }),
    );
  }

  const createQuestion = new CreateQuestion(questionRepo, enrollmentRepo);
  const createAnswer = new CreateAnswer(answerRepo, questionRepo, enrollmentRepo);
  const castVote = new CastVote(voteRepo, questionRepo, answerRepo, forumSubject);
  const listQuestions = new ListQuestions(questionRepo);
  const getQuestionDetail = new GetQuestionDetail(questionRepo, answerRepo);
  const listAnswers = new ListAnswers(answerRepo);

  const controller = new ForumController(
    createQuestion,
    createAnswer,
    castVote,
    listQuestions,
    getQuestionDetail,
    listAnswers,
  );

  const server = createServer((req, res) => {
    void (async () => {
      const handled = await handleForumRoutes(req, res, controller);
      if (!handled) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(sendJsonError(404, "Route not found"));
      }
    })().catch((error: unknown) => {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(sendJsonError(500, error instanceof Error ? error.message : "Unexpected service error"));
    });
  });

  server.listen({ port: env.port, host: "::" }, () => {
    console.log(
      JSON.stringify({
        service: "academic-qna",
        level: "info",
        message: "Service listening",
        port: env.port,
        host: "::",
        nodeEnv: env.nodeEnv,
      }),
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Iniciando cierre controlado (Graceful Shutdown) del servicio academic-qna...`);

    server.close(() => {
      console.log("[Shutdown] Servidor HTTP cerrado.");
    });

    try {
      forumSubject.clearAllObservers();

      if (realtimeGateway) {
        realtimeGateway.dispose();
      }

      if (hasDatabaseConfig) {
        await Database.getInstance().close();
      }

      console.log("[Shutdown] Limpieza de recursos completada con éxito.");
      process.exit(0);
    } catch (error) {
      console.error("[Shutdown] Error durante el cierre de recursos:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap();
