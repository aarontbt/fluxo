"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, Edit3, Trash2, Save, User, AlertTriangle, Target, Activity } from 'lucide-react'

interface MedicalRecording {
  id: string
  patientName: string
  date: string
  time: string
  duration: number
  audioBlob?: Blob
  transcription?: string
  sessionNotes?: {
    timestamp: string
    note: string
  }[]
  speakerSegments?: Array<{
    speaker: number | null
    text: string
  }>
  medicalNotes?: {
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
  n8nAnalysis?: {
    soa_markdown: string
    risk_hypotheses: string[]
    red_flags: string[]
    next_visit_metrics: string[]
  }
  isProcessing: boolean
}

interface MedicalNotesPanelProps {
  recording?: MedicalRecording | null
  transcriptionText?: string
  lastSaved?: string
}

export function MedicalNotesPanel({
  recording,
  transcriptionText,
  lastSaved = "a minute ago"
}: MedicalNotesPanelProps) {
  const [activeTab, setActiveTab] = useState('Note')

  const tabs = ['Information', 'Highlights', 'Note']

  // Use actual transcription or fallback to passed text
  const displayTranscription = recording?.transcription || transcriptionText || ''
  
  // Use actual medical notes from recording or provide defaults
  const medicalSections = recording?.medicalNotes || {
    subjective: {
      chiefComplaint: "Loading...",
      history: "Medical notes will appear here after processing."
    },
    objective: "Awaiting examination findings...",
    assessment: "Awaiting clinical assessment...",
    plan: {
      medications: "Awaiting medication recommendations...",
      procedures: "Awaiting procedure recommendations...",
      followUp: "Awaiting follow-up instructions..."
    },
    ros: {
      cardiovascular: "Awaiting review...",
      respiratory: "Awaiting review...",
      musculoskeletal: "Awaiting review..."
    }
  }

  // Parse n8n SOAP markdown if available
  const parseSoapMarkdown = (markdown?: string) => {
    if (!markdown) return null
    
    // Simple parsing - in production, use a markdown parser
    const sections = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    }
    
    const lines = markdown.split('\n')
    let currentSection = ''
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('subjective')) {
        currentSection = 'subjective'
      } else if (line.toLowerCase().includes('objective')) {
        currentSection = 'objective'
      } else if (line.toLowerCase().includes('assessment')) {
        currentSection = 'assessment'
      } else if (line.toLowerCase().includes('plan')) {
        currentSection = 'plan'
      } else if (currentSection && line.trim()) {
        sections[currentSection as keyof typeof sections] += line + '\n'
      }
    })
    
    return sections
  }

  const soapSections = parseSoapMarkdown(recording?.n8nAnalysis?.soa_markdown)

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header with timestamp */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Last saved {lastSaved}</span>
          <span className="text-xs font-mono text-gray-600">00:15</span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Save className="h-3 w-3" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'Note' && (
          <div className="space-y-6">
            {/* Show processing state */}
            {recording?.isProcessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">Processing medical notes...</span>
                </div>
              </div>
            )}

            {/* Display n8n SOAP analysis if available */}
            {soapSections ? (
              <>
                {/* Subjective from n8n */}
                {soapSections.subjective && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Subjective</h3>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {soapSections.subjective}
                    </p>
                  </div>
                )}

                {/* Objective from n8n */}
                {soapSections.objective && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Objective</h3>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {soapSections.objective}
                    </p>
                  </div>
                )}

                {/* Assessment from n8n */}
                {soapSections.assessment && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Assessment</h3>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {soapSections.assessment}
                    </p>
                  </div>
                )}

                {/* Plan from n8n */}
                {soapSections.plan && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Plan</h3>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {soapSections.plan}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Fallback to structured medical notes */}
                {/* Subjective Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Subjective</h3>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Chief Complaint</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {medicalSections.subjective.chiefComplaint}
                      </p>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {medicalSections.subjective.history}
                    </p>

                    {/* Show session notes if available */}
                    {recording?.sessionNotes && recording.sessionNotes.length > 0 && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        <span className="font-medium">Session Notes:</span>
                        {recording.sessionNotes.map((note, idx) => (
                          <div key={idx} className="mt-1">
                            [{note.timestamp}] {note.note}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Objective Section */}
                {medicalSections.objective && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Objective</h3>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {medicalSections.objective}
                    </p>
                  </div>
                )}

                {/* Assessment Section */}
                {medicalSections.assessment && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Assessment</h3>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {medicalSections.assessment}
                    </p>
                  </div>
                )}

                {/* ROS Section */}
                {medicalSections.ros && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Review of Systems</h3>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cardiovascular:</p>
                        <p className="text-sm text-gray-700">{medicalSections.ros.cardiovascular}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Respiratory:</p>
                        <p className="text-sm text-gray-700">{medicalSections.ros.respiratory}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Musculoskeletal:</p>
                        <p className="text-sm text-gray-700">{medicalSections.ros.musculoskeletal}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Plan</h3>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>

                  <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                    <div>
                      <span className="font-medium">Medications: </span>
                      {medicalSections.plan.medications}
                    </div>
                    <div>
                      <span className="font-medium">Procedures: </span>
                      {medicalSections.plan.procedures}
                    </div>
                    <div>
                      <span className="font-medium">Follow-up: </span>
                      {medicalSections.plan.followUp}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'Information' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span className="text-sm">Patient Information</span>
            </div>
            <div className="text-sm text-gray-500">
              Patient demographics and medical history would be displayed here.
            </div>
          </div>
        )}

        {activeTab === 'Highlights' && (
          <div className="space-y-4">
            {/* Red Flags from n8n */}
            {recording?.n8nAnalysis?.red_flags && recording.n8nAnalysis.red_flags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <p className="font-medium text-red-700">Red Flags</p>
                </div>
                <ul className="space-y-1">
                  {recording.n8nAnalysis.red_flags.map((flag, idx) => (
                    <li key={idx} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Hypotheses from n8n */}
            {recording?.n8nAnalysis?.risk_hypotheses && recording.n8nAnalysis.risk_hypotheses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-yellow-500" />
                  <p className="font-medium text-yellow-700">Risk Hypotheses</p>
                </div>
                <ul className="space-y-1">
                  {recording.n8nAnalysis.risk_hypotheses.map((risk, idx) => (
                    <li key={idx} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Visit Metrics from n8n */}
            {recording?.n8nAnalysis?.next_visit_metrics && recording.n8nAnalysis.next_visit_metrics.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <p className="font-medium text-blue-700">Next Visit Metrics</p>
                </div>
                <ul className="space-y-1">
                  {recording.n8nAnalysis.next_visit_metrics.map((metric, idx) => (
                    <li key={idx} className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fallback to key points if no n8n analysis */}
            {(!recording?.n8nAnalysis || 
              (!recording.n8nAnalysis.red_flags?.length && 
               !recording.n8nAnalysis.risk_hypotheses?.length && 
               !recording.n8nAnalysis.next_visit_metrics?.length)) && (
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Key Clinical Points:</p>
                {recording?.transcription ? (
                  <p className="text-gray-500">
                    Analysis will appear here after processing the recording.
                  </p>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-gray-500">
                    <li>Start recording to capture clinical data</li>
                    <li>Medical highlights will be extracted automatically</li>
                    <li>Risk factors and red flags will be identified</li>
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transcription Area */}
      {displayTranscription && (
        <div className="border-t border-gray-100 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Transcription</span>
              <div className="flex gap-2">
                {recording?.duration && (
                  <span className="text-xs text-gray-400">
                    {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            {/* Display speaker segments if available */}
            {recording?.speakerSegments && recording.speakerSegments.length > 0 ? (
              <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto space-y-2">
                {recording.speakerSegments.slice(0, 3).map((segment, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-medium text-blue-600">
                      Speaker {segment.speaker ?? 'Unknown'}:
                    </span>
                    <span className="text-gray-600 ml-1">
                      {segment.text.substring(0, 100)}
                      {segment.text.length > 100 && '...'}
                    </span>
                  </div>
                ))}
                {recording.speakerSegments.length > 3 && (
                  <div className="text-xs text-gray-400 italic">
                    +{recording.speakerSegments.length - 3} more segments
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 leading-relaxed max-h-32 overflow-y-auto">
                {displayTranscription.substring(0, 300)}
                {displayTranscription.length > 300 && '...'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}