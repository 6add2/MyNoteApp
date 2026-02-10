# Project Scaffold (per Improved Proposal)

This repository now includes a lightweight skeleton that matches the proposal. All classes and methods are defined with TODOs so they are safe to build without logic yet.

## Frontend (apps/frontend)
- `src/app.svelte`, `src/main.ts` – entry shell
- Controllers: `lib/controllers/*` (Auth, Notes, Edit, Collab, Share)
- Managers: `lib/managers/*` (YDocManager, ConnectionManager, UserManager)
- Commands: `lib/commands/*` (AbstractCommand, InsertSpecialSignCommand, InsertSpecialElementCommand, CommandProcessor)
- States: `lib/states/*` (EditingState + Word/PPT/Handwrite, ModeContext; ScreenAskingState + AskingModeState)
- Factory: `lib/factories/FrameFactory`
- Services: `lib/services/*` (AIFacade, PopupManager, ValidationStrategy)
- Stores: `src/stores/*` (notesStore, authStore, editStore)
- Components: layout/UI placeholders; routes for `signin`, `workplace`, `edit`

## Backend (apps/backend)
- Entry: `src/index.ts`, `src/server.ts`
- Routes: `api/routes/*` (notes, auth, ai)
- Controllers: `api/controllers/*` (NotesAPIController, AuthAPIController, AIWebhookController)
- WebSocket stub: `websocket/WSController.ts`
- Persistence: `persistence/PersistenceSingleton.ts`
- Middleware: `middleware/auth.ts`, `middleware/errorHandler.ts`

## Shared Packages
- `packages/shared-types/src/index.ts` – shared interfaces (NoteMetadata, Frame, StrokePoint, AwarenessUser)
- `packages/utils/src/validators.ts` – simple validation helpers

## Next Steps
- Wire real Yjs types and WebSocket provider in managers
- Implement API calls in controllers (frontend) and business logic (backend)
- Add tsconfig path aliases/monorepo config if desired
- Connect Svelte routes to controllers/stores
- Add tests and linting per proposal

