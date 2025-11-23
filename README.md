# Legacy Field Command

A white-labeled field service management platform for restoration contractors.

## Project Structure

This is a monorepo containing:

- **`apps/web`**: Next.js admin dashboard and CRM.
- **`apps/mobile`**: React Native (Expo) field application for technicians.
- **`supabase`**: Database schema, migrations, and edge functions.
- **`packages`**: Shared TypeScript libraries and UI components.

## MVP Roadmap

### Phase 0: Foundations
- [x] Project structure setup
- [x] Initial Database Schema (`supabase/schema.sql`)
- [ ] Auth & RLS configuration

### Phase 1: Field App (Offline First)
- [ ] React Native shell
- [ ] WatermelonDB setup
- [ ] Job list & Detail view
- [ ] Photo capture flow

## Getting Started

1. **Database**: Apply `supabase/schema.sql` to your Supabase project.
2. **Mobile**: `cd apps/mobile` and run `npx expo start`.
3. **Web**: `cd apps/web` and run `npm run dev`.

