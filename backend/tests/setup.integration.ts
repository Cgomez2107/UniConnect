import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";

let container: StartedPostgreSqlContainer | null = null;
let client: Client | null = null;

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS forum_questions (
  id UUID PRIMARY KEY,
  subject_id UUID NOT NULL,
  author_id UUID NOT NULL,
  title VARCHAR(300) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  answer_count INTEGER NOT NULL DEFAULT 0,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_answers (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES forum_questions(id),
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  is_solution BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_votes (
  id UUID PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  voter_id UUID NOT NULL,
  vote_type VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(target_type, target_id, voter_id)
);

CREATE TABLE IF NOT EXISTS study_resources (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL,
  url TEXT,
  uploader_user_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(200),
  creator_id UUID NOT NULL,
  capacity INTEGER,
  attendee_count INTEGER NOT NULL DEFAULT 0,
  is_online BOOLEAN NOT NULL DEFAULT false,
  event_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export async function setupTestcontainers(): Promise<{
  connectionString: string;
  pool: import("pg").Pool;
  teardown: () => Promise<void>;
}> {
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("uniconnect_test")
    .withUsername("test")
    .withPassword("test")
    .withExposedPorts(5432)
    .start();

  const connectionString = `postgresql://test:test@${container.getHost()}:${container.getMappedPort(5432)}/uniconnect_test`;

  client = new Client({ connectionString });
  await client.connect();
  await client.query(MIGRATION_SQL);
  await client.end();
  client = null;

  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString, max: 1 });

  const teardown = async () => {
    await pool.end();
    if (container) {
      await container.stop();
      container = null;
    }
  };

  return { connectionString, pool, teardown };
}

export function getTestContainerConnection(): string | null {
  return container
    ? `postgresql://test:test@${container.getHost()}:${container.getMappedPort(5432)}/uniconnect_test`
    : null;
}
