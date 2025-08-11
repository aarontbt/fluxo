# Refactoring Plan - Medical Interface n8n Integration

## Overview
Following the successful n8n webhook integration with the mobile medical interface, this document outlines refactoring opportunities to improve code quality, maintainability, and performance.

## 1. Extract Shared Types 🎯

### Problem
- `MedicalRecording` interface is duplicated across multiple components
- Type definitions scattered throughout the codebase
- Risk of type inconsistencies

### Solution
Create a centralized type definition file: `/src/types/medical.ts`

```typescript
// Centralize all medical-related types
export interface MedicalRecording {
  id: string
  patientName: string
  date: string
  time: string
  duration: number
  audioBlob?: Blob
  transcription?: string
  sessionNotes?: SessionNote[]
  speakerSegments?: SpeakerSegment[]
  medicalNotes?: MedicalNotes
  n8nAnalysis?: N8nAnalysis
  isProcessing: boolean
}

export interface N8nAnalysis {
  soa_markdown: string
  risk_hypotheses: string[]
  red_flags: string[]
  next_visit_metrics: string[]
}

export interface SessionNote {
  timestamp: string
  note: string
}

export interface SpeakerSegment {
  speaker: number | null
  text: string
}

export interface MedicalNotes {
  subjective: {
    chiefComplaint: string
    history: string
  }
  objective: string
  assessment: string
  plan: {
    medications: string
    procedures: string
    followUp: string
  }
  ros?: {
    cardiovascular: string
    respiratory: string
    musculoskeletal: string
  }
}
```

### Impact
- **Priority**: HIGH
- **Effort**: Low
- **Benefits**: Type safety, prevents bugs, single source of truth

---

## 2. Create Reusable SOAP Parser 📝

### Problem
- Basic string manipulation for SOAP markdown parsing
- No error handling for malformed markdown
- Logic embedded in component

### Solution
Create a dedicated parser module: `/src/lib/soap-parser.ts`

```typescript
export interface SoapSections {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export function parseSoapMarkdown(markdown: string): SoapSections | null {
  // Implement robust markdown parsing with error handling
  // Consider using a markdown parser library
}

export function formatSoapSection(section: string, content: string): string {
  // Format individual sections consistently
}

export function validateSoapStructure(sections: SoapSections): boolean {
  // Validate required sections are present
}
```

### Impact
- **Priority**: MEDIUM
- **Effort**: Medium
- **Benefits**: Reliable parsing, reusable across components, testable

---

## 3. Extract N8n Display Components 🧩

### Problem
- `MedicalNotesPanel` component is 476 lines (too large)
- Mixed concerns (display logic, data transformation, UI)
- Difficult to maintain and test

### Solution
Break into smaller, focused components:

#### `/src/components/medical/SoapNotesDisplay.tsx`
- Displays parsed SOAP notes
- Handles section expansion/collapse
- Formats medical terminology

#### `/src/components/medical/RiskFlagsPanel.tsx`
- Displays red flags, risk hypotheses
- Visual severity indicators
- Alert prioritization

#### `/src/components/medical/TranscriptionSegments.tsx`
- Speaker-aware transcription display
- Timestamp formatting
- Segment navigation

#### `/src/components/medical/SessionNotesViewer.tsx`
- Display session notes
- Note filtering/search
- Timestamp formatting

### Impact
- **Priority**: HIGH
- **Effort**: Medium
- **Benefits**: Better maintainability, reusability, easier testing

---

## 4. Consolidate Desktop/Mobile Logic 📱

### Problem
- Duplicate recording workflow logic in `page.tsx` and `mobile-medical-interface.tsx`
- View state management repeated
- Note handling logic duplicated

### Solution
Create shared hook: `/src/hooks/use-recording-workflow.ts`

```typescript
export function useRecordingWorkflow() {
  const [viewMode, setViewMode] = useState<ViewMode>('recording')
  const [selectedRecording, setSelectedRecording] = useState<MedicalRecording | null>(null)
  const [noteHistory, setNoteHistory] = useState<SessionNote[]>([])
  
  const handleSelectRecording = (recording: MedicalRecording) => {
    // Shared logic
  }
  
  const handleStartNewRecording = () => {
    // Shared logic
  }
  
  const handleAddNote = (note: string) => {
    // Shared logic
  }
  
  return {
    viewMode,
    selectedRecording,
    noteHistory,
    handlers: {
      handleSelectRecording,
      handleStartNewRecording,
      handleAddNote
    }
  }
}
```

### Impact
- **Priority**: MEDIUM
- **Effort**: Medium
- **Benefits**: DRY principle, consistent behavior, easier updates

---

## 5. Add Loading & Error States ⚡

### Problem
- Limited error handling for n8n webhook failures
- No retry mechanism
- Basic loading states

### Solution

#### Enhanced n8n Service
```typescript
// /src/lib/n8n-service.ts
export async function sendToN8nWithRetry(
  data: SendToN8nParams,
  retries = 3
): Promise<N8nAnalysisResponse | null> {
  // Implement exponential backoff
  // Add timeout handling
  // Better error messages
}
```

#### Error Boundary Component
```typescript
// /src/components/ErrorBoundary.tsx
export function MedicalErrorBoundary({ children }) {
  // Catch and display errors gracefully
  // Provide fallback UI
  // Log errors for debugging
}
```

#### Skeleton Loaders
```typescript
// /src/components/medical/SkeletonLoaders.tsx
export function SoapNotesSkeleton() { }
export function TranscriptionSkeleton() { }
export function RiskFlagsSkeleton() { }
```

### Impact
- **Priority**: MEDIUM
- **Effort**: Medium
- **Benefits**: Better UX, resilience, debugging

---

## 6. Environment Configuration 🔐

### Problem
- N8n endpoint and tokens directly in code
- No centralized configuration
- Difficult to manage different environments

### Solution
Create configuration module: `/src/config/environment.ts`

```typescript
export const config = {
  n8n: {
    endpoint: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL,
    authToken: process.env.NEXT_PUBLIC_N8N_WEBHOOK_AUTH_TOKEN,
    timeout: 30000,
    retries: 3,
    enabled: process.env.NEXT_PUBLIC_N8N_ENABLED === 'true'
  },
  soniox: {
    apiKey: process.env.NEXT_PUBLIC_SONIOX_API_KEY,
    wsEndpoint: process.env.NEXT_PUBLIC_SONIOX_WS_URL
  },
  features: {
    enableSpeakerDiarization: true,
    enableLiveTranscription: true,
    enableN8nAnalysis: true
  }
}

export function validateConfig() {
  // Validate required environment variables
  // Throw clear errors for missing config
}
```

### Impact
- **Priority**: LOW
- **Effort**: Low
- **Benefits**: Better configuration management, environment flexibility

---

## 7. Test Coverage 🧪

### Problem
- No tests for n8n integration
- SOAP parsing untested
- Component rendering not verified

### Solution
Add comprehensive test coverage:

#### Unit Tests
```typescript
// /src/lib/__tests__/soap-parser.test.ts
// /src/lib/__tests__/n8n-service.test.ts
```

#### Component Tests
```typescript
// /src/components/medical/__tests__/MedicalNotesPanel.test.tsx
// /src/components/medical/__tests__/RiskFlagsPanel.test.tsx
```

#### Integration Tests
```typescript
// /src/__tests__/integration/recording-workflow.test.ts
// /src/__tests__/integration/n8n-webhook.test.ts
```

### Test Scenarios
- SOAP markdown parsing edge cases
- N8n webhook timeout/failure
- Component rendering with various data states
- User interaction flows

### Impact
- **Priority**: LOW
- **Effort**: High
- **Benefits**: Reliability, confidence in changes, documentation

---

## 8. Performance Optimizations 🚀

### Problem
- Re-parsing on every render
- Large component bundles
- Unnecessary re-renders

### Solution

#### Memoization
```typescript
// Use React.memo and useMemo
const parsedSoap = useMemo(() => 
  parseSoapMarkdown(recording?.n8nAnalysis?.soa_markdown),
  [recording?.n8nAnalysis?.soa_markdown]
)
```

#### Code Splitting
```typescript
// Lazy load heavy components
const MedicalNotesPanel = lazy(() => 
  import('@/components/medical/MedicalNotesPanel')
)
```

#### Debouncing
```typescript
// Debounce session note updates
const debouncedNoteUpdate = useDebouncedCallback(
  (note: string) => updateSessionNote(note),
  500
)
```

### Impact
- **Priority**: LOW
- **Effort**: Medium
- **Benefits**: Better performance, reduced bundle size

---

## Implementation Priority

### Phase 1 - Critical (Week 1)
1. **Extract shared types** - Foundation for other changes
2. **Break up MedicalNotesPanel** - Improve maintainability

### Phase 2 - Important (Week 2)
3. **Create SOAP parser** - Better reliability
4. **Add error handling** - Improve UX
5. **Consolidate logic** - Reduce duplication

### Phase 3 - Nice to Have (Week 3+)
6. **Environment configuration** - Better ops
7. **Test coverage** - Long-term reliability
8. **Performance optimizations** - Polish

---

## Success Metrics
- [ ] Reduce component size to <200 lines
- [ ] Zero type-related bugs
- [ ] 80% test coverage for critical paths
- [ ] <3s load time for medical notes
- [ ] Graceful handling of all error states

---

## Notes
- Each refactoring should be done in a separate PR
- Maintain backward compatibility during refactoring
- Update documentation as changes are made
- Consider feature flags for gradual rollout