# Architecture notes (config-level)

Target architecture:
- gateway as BFF entrypoint
- five domain microservices by vertical: study-groups, resources, messaging, profiles-catalog, events
- clean architecture per service
- Supabase used as Postgres during migration

Migration rule:
- no direct frontend access to Supabase in final state
- move authorization and business rules to backend services
- roll out by vertical with feature flags

Service boundary decisions:
- applications stays inside study-groups as a subdomain, not as an independent microservice
- admin is treated as authorization/capability within each domain or as gateway orchestration, not as a standalone microservice
