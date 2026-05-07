# UniConnect Dashboard Web

Dashboard web de UniConnect migrado de Expo a React + Vite.

## Stack

- **React**: 19.2.5
- **Vite**: 8.0.10  
- **TypeScript**: ~6.0.2
- **Tailwind CSS**: Latest
- **React Router**: dom v7
- **State**: Zustand
- **HTTP Client**: Axios

## Requisitos

- Node.js >= 20.0.0
- npm o pnpm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor arranca en `http://localhost:5173` con HMR (Hot Module Replacement) funcional.

## Build

```bash
npm run build
```

Genera artefactos optimizados en `dist/`.

## Estructura

```
src/
├── pages/        # Vistas principales (Login, Admin, Chat, etc)
├── components/   # Componentes reutilizables
├── hooks/        # Custom hooks
├── context/      # React Context (Auth, Notifications)
├── store/        # Zustand stores
├── lib/          # Utilidades (API client, etc)
├── types/        # Tipos TypeScript
└── App.tsx       # Componente root
```

## Variables de entorno

Crear `.env.local`:

```env
VITE_API_URL=https://foil-vanquish-purple.ngrok-free.dev/api/v1
```

## Comandos

- `npm run dev` - Desarrollo con HMR
- `npm run build` - Build para producción
- `npm run preview` - Preview del build
- `npm run lint` - Linting con ESLint

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
