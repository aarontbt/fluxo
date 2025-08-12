// Centralized medical-related type definitions

export interface SessionNote {
  timestamp: string
  note: string
}

export interface SpeakerSegment {
  speaker: number | null
  text: string
}

export interface MedicalNotesSubjective {
  chiefComplaint: string
  history: string
}

export interface MedicalNotesPlan {
  medications: string
  procedures: string
  followUp: string
}

export interface ReviewOfSystems {
  cardiovascular: string
  respiratory: string
  musculoskeletal: string
}

export interface MedicalNotes {
  subjective: MedicalNotesSubjective
  objective: string
  assessment: string
  plan: MedicalNotesPlan
  ros?: ReviewOfSystems
}

export interface N8nAnalysis {
  soa_markdown: string
  risk_hypotheses: string[]
  red_flags: string[]
  next_visit_metrics: string[]
}

export interface MedicalRecording {
  id: string
  patientName: string
  date: string
  time: string
  duration: number
  audioBlob?: Blob
  transcription?: string
  liveTranscription?: string
  sessionNotes?: SessionNote[]
  speakerSegments?: SpeakerSegment[]
  medicalNotes?: MedicalNotes
  n8nAnalysis?: N8nAnalysis
  isProcessing: boolean
}

// View mode types
export type ViewMode = 'recording' | 'transcription'
export type MobileViewMode = 'list' | 'recording' | 'transcription'

// Hook return types
export interface UseMedicalRecordingReturn {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioLevel: number
  currentRecording: MedicalRecording | null
  recordings: MedicalRecording[]
  liveTranscription: string
  transcriptionError: string | null
  isTranscribing: boolean
  startRecording: (patientName: string) => Promise<void>
  stopRecording: (sessionNotes?: SessionNote[]) => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  processRecording: (recording: MedicalRecording) => Promise<void>
  saveRecording: (recording: MedicalRecording) => void
  prepareNewRecording: () => void
}

// N8n service types
export interface N8nPayload {
  'transcribe-input': string
  'medical-notes': string[]
  'domain-knowledge': string
}

export interface N8nAnalysisResponse {
  soa_markdown: string
  risk_hypotheses: string[]
  red_flags: string[]
  next_visit_metrics: string[]
}

export interface SendToN8nParams {
  transcription: string
  sessionNotes?: SessionNote[]
}