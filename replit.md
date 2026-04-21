# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## RevenueCat (FastPlan iOS/Android)

- Project: `proj14b00847`, Bundle ID: `com.altfast.app`
- Entitlement: `premium`
- Offering: `default` (current) with packages: `$rc_lifetime`, `$rc_annual`, `$rc_monthly`
- Tiers: Monthly £2.99 (`premium_monthly`), Yearly £29.99 (`premium_yearly`), Lifetime £39.99 (`premium_lifetime`, non-consumable)
- Re-seed via: `pnpm --filter @workspace/scripts exec tsx src/seedRevenueCat.ts`
- Public API keys live in env vars: `EXPO_PUBLIC_REVENUECAT_TEST/IOS/ANDROID_API_KEY`
- Client wrapper: `artifacts/fast-tracker/lib/revenuecat.tsx` (`SubscriptionProvider`, `useSubscription`, `initializeRevenueCat`)
- Paywall UI: `artifacts/fast-tracker/components/Paywall.tsx`
- Gated features so far: AI Food Scanner (locked icon + paywall trigger). Premium card in Settings to launch paywall any time.
- Note: `react-native-purchases` requires a custom dev build; in Expo Go / web the SDK calls fail gracefully.
