// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'hooks/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/supabase', '@/lib/services/*Service'],
              message:
                'Usa casos de uso/DI de la capa de aplicacion. No importes Supabase o servicios legacy desde app/hooks/application.',
            },
          ],
        },
      ],
    },
  },
]);
