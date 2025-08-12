"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit3, Save, Activity } from 'lucide-react'
import type { MedicalRecording } from '@/types/medical'
import { SOAPNotesSection } from './medical-notes/soap-notes-section'
import { RiskAssessmentSection } from './medical-notes/risk-assessment-section'
import { TranscriptionTab } from './medical-notes/transcription-tab'

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

  // Parse n8n SOAP markdown if available
  const parseSoapMarkdown = (markdown?: string) => {
    if (!markdown) return null
    
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
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
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
        {/* Note Tab */}
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

            <SOAPNotesSection recording={recording} soapSections={soapSections} />
          </div>
        )}

        {/* Information Tab */}
        {activeTab === 'Information' && (
          <TranscriptionTab recording={recording} transcriptionText={transcriptionText} />
        )}

        {/* Highlights Tab */}
        {activeTab === 'Highlights' && (
          <RiskAssessmentSection recording={recording} />
        )}
      </div>
    </div>
  )
}