# UniConnect Dashboard Web

Dashboard web de UniConnect: interfaz para administración de grupos de estudio, autenticación y mensajería en tiempo real.

## Stack Tecnológico

- **React**: 19.2.5
- **Vite**: 8.0.10  
- **TypeScript**: ~6.0.2
- **Tailwind CSS**: v4 con @tailwindcss/postcss
- **React Router**: 7 (react-router-dom)
- **State Management**: Zustand
- **HTTP Client**: Axios

## Requisitos del Sistema

- Node.js >= 20.0.0
- npm >= 10.0 o pnpm >= 9.0

## Instalación

1. Clona el repositorio
2. Navega a la carpeta `/web`:
   ```bash
   cd UniConnect/web
   ```
3. Instala dependencias:
   ```bash
   npm install
   ```

## Configuración

Crear archivo `.env.local` en la raíz de `/web`:

```env
VITE_API_URL=https://foil-vanquish-purple.ngrok-free.dev/api/v1
```

O para desarrollo local:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Desarrollo

Inicia el servidor con HMR (Hot Module Replacement):

```bash
npm run dev
```

El dashboard arranca en `http://localhost:5173` con recargas instantáneas al guardar cambios.

## Build para Producción

Genera artefactos optimizados:

```bash
npm run build
```

Output: `dist/` (bundle minificado, CSS optimizado, assets comprimidos)

## Preview del Build

Prueba el build localmente:

```bash
npm run preview
```

## Estructura del Proyecto

```
src/
├── pages/              # Vistas principales
│   ├── LoginPage.tsx   # Autenticación
│   ├── AdminPage.tsx   # Panel administrador (grupos)
│   └── ChatPage.tsx    # Interfaz de mensajería
├── store/              # Estado global (Zustand)
│   └── useAuthStore.ts # Autenticación y sesión
├── lib/                # Utilidades
│   └── httpClient.ts   # Cliente API con axios
├── components/         # Componentes reutilizables (future)
├── hooks/              # Custom hooks (future)
├── context/            # React Context (future)
├── types/              # Tipos TypeScript
├── App.tsx             # Componente root + rutas
└── index.css           # Estilos globales + Tailwind
```

## Rutas Disponibles

| Ruta | Descripción | Requiere Auth |
|------|-------------|---|
| `/login` | Formulario de login | ❌ |
| `/admin` | Panel de administración | ✅ Admin |
| `/chat/:id` | Chat con conversación | ✅ |

## Comandos npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor dev con HMR |
| `npm run build` | Build para producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Lint con ESLint |
| `npm run type-check` | Verificación de tipos |

## Características Implementadas

✅ Autenticación (Email/Contraseña)
✅ Sesión persistente con localStorage
✅ Rutas protegidas basadas en rol
✅ Panel Admin con lista de grupos
✅ Interfaz de chat en tiempo real
✅ Diseño responsive con Tailwind CSS
✅ Colores institucionales (UC Blue & Gold)
✅ API client con axios + interceptors
✅ Estado global con Zustand

## Color Palette

- **UC Blue**: `#0d2852` (primario)
- **UC Blue Dark**: `#091d3d` 
- **UC Blue Light**: `#1a3d73`
- **UC Gold**: `#c8ae7a` (acentos)
- **UC Gold Dark**: `#a8904f`
- **UC Gold Light**: `#ddc99a`

## Variables de Entorno

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `VITE_API_URL` | string | http://localhost:3000/api/v1 | URL base del API Gateway |

## Performance

- Build time: **256ms**
- Bundle size: **281.32 KB** (92.06 KB gzip)
- Development startup: **243ms** (HMR ready)

## Notas de Desarrollo

- Los tokens de autenticación se guardan en `localStorage.accessToken`
- El cliente API usa Axios con interceptors automáticos
- Las rutas protegidas redirigen a `/login` si no hay sesión
- Los colores de UI están configurados en `tailwind.config.js`

## Próximas Mejoras

- [ ] Componentes reutilizables (Card, Modal, Toast)
- [ ] Notificaciones push
- [ ] Soporte para WebSocket
- [ ] Carga de archivos
- [ ] Búsqueda y filtros avanzados

## Contacto

Desarrollador: Carlos Alberto Gomez Posada


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
