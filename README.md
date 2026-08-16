# Hubbert

Bot de Discord multi-servidor con dashboard web. Monolito modular: una sola
app Next.js (dashboard + API) sobre Postgres sirviendo múltiples `guildId`
de forma aislada.

Arquitectura completa: ver el blueprint de diseño (documento aparte).

## Estructura

```
apps/web/       Dashboard + API (Next.js App Router) — único deployable
packages/db/    Schema de Prisma + cliente compartido (@hubbert/db)
```

## Requisitos

- Node 20+
- pnpm (`npm install -g pnpm`)
- Un proyecto de Supabase (Postgres + Auth)

## Setup local

```bash
pnpm install

# Copiar y completar con las credenciales de tu proyecto Supabase
# (Project Settings → Database → Connection string)
cp apps/web/.env.example apps/web/.env.local

pnpm db:generate   # genera el cliente de Prisma
pnpm db:push       # sincroniza el schema con la base (mientras no haya migraciones formales)

pnpm dev           # http://localhost:3000
```

La página de inicio confirma en vivo si la conexión a la base de datos
funciona — es el checkpoint del Paso 0.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Corre el dashboard en modo desarrollo |
| `pnpm build` | Build de producción |
| `pnpm db:generate` | Regenera el cliente de Prisma tras editar el schema |
| `pnpm db:push` | Aplica el schema a la base sin crear una migración formal |
| `pnpm db:migrate` | Crea y aplica una migración versionada |
| `pnpm db:studio` | Abre Prisma Studio para inspeccionar los datos |

## Estado

- [x] Paso 0 — monorepo, schema inicial, app conectada a la base
- [ ] Paso 1 — login con Discord (Supabase Auth) y listado de servidores
