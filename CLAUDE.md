# MediVoice Project Configuration

## Package Manager
- **IMPORTANT**: This project uses `npm`, NOT pnpm
- Always use `npm install` for dependencies
- Run scripts with `npm run <script>`

## Pre-Commit Checks (ALWAYS RUN)
Before ANY commit, run these commands:
```bash
npm run lint         # Fix linting errors
npm run build        # Ensure production build works
```

## Development Commands
```bash
npm run dev          # Start dev server on localhost:3000
```

## Code Standards
- TypeScript strict mode - ALL code must be properly typed
- Use absolute imports: `@/*` instead of relative paths
- Import types from `@/types/*` centralized definitions
- Liberally use existing shadcn/ui components from `@/components/ui`, add new ones if necessary
- NO COMMENTS unless explicitly requested

## Common File Locations
- Components: `src/components/`
- Types: `src/types/` (medical.ts, recording.ts, n8n.ts)
- Hooks: `src/hooks/`
- Services: `src/lib/services/`

## Testing Changes
After making changes to:
- Recording functionality: Test audio recording manually
- UI components: Check mobwebhook responses
