# Auth Microservice

Servicio centralizado de autenticación para UniConnect.

## Características

- Signup/Signin con email y contraseña
- JWT token generation (access + refresh)
- Token refresh flow
- Rate limiting
- Audit logging

## Estructura

```
src/
├── domain/
│   ├── entities/        # User, RefreshToken
│   └── repositories/    # IAuthRepository, ITokenRepository
├── application/
│   ├── dtos/           # Input/Output DTOs
│   └── use-cases/      # SignUpUseCase, SignInUseCase, etc
├── infrastructure/
│   ├── repositories/   # PostgreSQL implementations
│   └── jwt/            # JWT token handling
└── interfaces/
    └── http/           # Controllers, routes
```

## Desarrollo

```bash
pnpm install
pnpm dev
```
