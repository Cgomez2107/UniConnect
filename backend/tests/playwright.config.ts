import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  workers: 1, // Evita conflictos en la base de datos al correr en paralelo
  reporter: 'list',
  use: {
    // Asegúrate de que este sea el puerto donde corre el Gateway o los servicios del back
    baseURL: 'http://localhost:3000', 
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
});