# UniConnect — Pruebas E2E con Maestro

## Requisitos previos

| Herramienta | Versión mínima | Instalación |
|---|---|---|
| Node.js | 18+ | `winget install OpenJS.NodeJS.LTS` |
| Java (JDK) | 17+ | `winget install EclipseAdoptium.Temu.17.JDK` |
| Android Studio | Hedgehog+ | [developer.android.com/studio](https://developer.android.com/studio) |
| Maestro CLI | 1.x | `curl -Ls "https://get.maestro.mobile.dev" \| bash` |
| Expo CLI | latest | `pnpm add -g expo-cli` |

## Preparación del emulador

```bash
# 1. Iniciar emulador Android
emulator -avd Pixel_6_API_34 -no-snapshot

# 2. Construir e instalar la app
cd frontend
pnpm install
npx expo run:android

# 3. Colocar archivo de prueba para la subida de recursos
adb push test.pdf /sdcard/Download/test.pdf
```

## Ejecutar pruebas

```bash
# Todas las suites
pnpm run test:maestro

# Suite específica
maestro test maestro/flows/login-to-resource.yaml

# Con reporte JUnit (CI)
maestro --device android test maestro/flows/ --format junit --output maestro-report/
```

## Flujos disponibles

| Archivo | Descripción |
|---|---|
| `flows/login-to-resource.yaml` | Login → Solicitudes → Mis Recursos → Subir Recurso → Verificación |
| `flows/onboarding-login.yaml` | Onboarding + Login + persistencia de sesión |
| `flows/login-error.yaml` | 3 escenarios de error en login |
| `flows/login-register-resource.yaml` | Login → Subir recurso desde Feed → Verificar |
| `shared/skip-onboarding.yaml` | Paso compartido para saltar onboarding |

## Estructura

```
maestro/
├── config.yaml              # Config global (appId, env)
├── README.md
├── flows/
│   ├── login-to-resource.yaml
│   ├── login-error.yaml
│   ├── login-register-resource.yaml
│   └── onboarding-login.yaml
├── shared/
│   └── skip-onboarding.yaml
└── data/
```

## Troubleshooting

- **`appId not found`**: la app no está instalada. Ejecuta `npx expo run:android`.
- **`filePath not found`**: el archivo de prueba no existe en el emulador. Usa `adb push`.
- **`text "X" not found`**: verifica que el usuario mock tenga datos (materias inscritas).
- **Timeout en login**: la API no responde. Confirma que `API_BASE_URL` en `config.yaml` sea correcto.
