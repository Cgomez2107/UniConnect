export function requireEnv(source: NodeJS.ProcessEnv, name: string): string {
  const value = source[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}