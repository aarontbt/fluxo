"use client"

import { useState } from 'react'
import { PatientRecordingList } from '@/components/patient-recording-list'
import { EnhancedRecordingInterface } from '@/components/enhanced-recording-interface'
import { TranscriptionDisplay } from '@/components/transcription-display'
import { MobileMedicalInterface } from '@/components/mobile-medical-interface'
import { useMedicalRecording } from '@/hooks/use-medical-recording'

type ViewMode = 'recording' | 'transcription'

export default function Home() {
  const {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    currentRecording,
    recordings,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  } = useMedicalRecording()

  const [viewMode, setViewMode] = useState<ViewMode>('recording')
  const [selectedRecording, setSelectedRecording] = useState<typeof recordings[0] | null>(null)
  const [medicalNotes, setMedicalNotes] = useState('')
  const [noteHistory, setNoteHistory] = useState<{timestamp: string, note: string}[]>([])

  const patientInfo = {
    name: "Aisha",
    image: "/api/placeholder/40/40",
    visitType: "First visit"
  }

  const handleSelectRecording = (recording: typeof recordings[0]) => {
    setSelectedRecording(recording)
    setViewMode('transcription')
  }

  const handleStartNewRecording = () => {
    setSelectedRecording(null)
    setViewMode('recording')
    setMedicalNotes('')
    setNoteHistory([])
  }

  const handleStartRecording = async () => {
    await startRecording(patientInfo.name)
    setViewMode('recording')
  }

  const handleStopRecording = async () => {
    const allNotes = [...noteHistory]
    if (medicalNotes.trim()) {
      allNotes.push({
        timestamp: new Date().toLocaleTimeString(),
        note: medicalNotes
      })
    }

    if (allNotes.length > 0) {
      const notesForTranscriber = allNotes.map(note => `[${note.timestamp}] ${note.note}`).join('\n')
      console.log('Sending notes to transcriber:', notesForTranscriber)
    }

    await stopRecording(allNotes.length > 0 ? allNotes : undefined)
    setViewMode('transcription')
  }

  const handleAddNote = () => {
    if (medicalNotes.trim()) {
      const newNote = {
        timestamp: new Date().toLocaleTimeString(),
        note: medicalNotes
      }
      setNoteHistory(prev => [...prev, newNote])
      setMedicalNotes('')
    }
  }

  const handleRemoveNote = (indexToRemove: number) => {
    setNoteHistory(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className="block lg:hidden">
        <MobileMedicalInterface
          patientName={patientInfo.name}
          patientImage={patientInfo.image}
          visitType={patientInfo.visitType}
          isRecording={isRecording}
          isPaused={isPaused}
          duration={duration}
          audioLevel={audioLevel}
          currentRecording={currentRecording}
          recordings={recordings}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen bg-gray-50">
        {/* Left Panel - Patient Recording List */}
        <PatientRecordingList
          patientName={patientInfo.name}
          patientImage={patientInfo.image}
          recordings={recordings}
          currentRecording={currentRecording}
          onSelectRecording={handleSelectRecording}
          onStartNewRecording={handleStartNewRecording}
        />

        {/* Center Panel - Recording or Transcription */}
        {viewMode === 'recording' ? (
          <EnhancedRecordingInterface
            patientName={patientInfo.name}
            patientImage={patientInfo.image}
            visitType={patientInfo.visitType}
            isRecording={isRecording}
            isPaused={isPaused}
            duration={duration}
            audioLevel={audioLevel}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onPauseRecording={pauseRecording}
            onResumeRecording={resumeRecording}
          />
        ) : (
          <TranscriptionDisplay
            recording={selectedRecording || currentRecording!}
            patientImage={patientInfo.image}
            onEdit={() => setViewMode('recording')}
            onSave={() => console.log('Save recording')}
            onNewRecording={handleStartNewRecording}
          />
        )}

        {/* Right Panel - Medical Notes (hidden when viewing transcription) */}
        {viewMode === 'recording' && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Notes</h2>
              <div className="text-sm text-gray-500">
                {isRecording ? 'Add notes during recording...' : 'Ready to add patient notes'}
              </div>
            </div>

            {/* Notes Input Section */}
            <div className="p-6 border-b border-gray-100">
              <textarea
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="Add medical observations, symptoms, or notes..."
                className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddNote}
                disabled={!medicalNotes.trim()}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add Note
              </button>
            </div>

            {/* Notes History */}
            <div className="flex-1 p-6 overflow-y-auto">
              {noteHistory.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Session Notes</h3>
                  {noteHistory.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg group hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">{note.timestamp}</div>
                          <div className="text-sm text-gray-800">{note.note}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveNote(index)}
                          className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-400 hover:text-red-500 transition-all"
                          title="Remove note"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 mt-12">
                  <div className="text-lg mb-2">📝</div>
                  <div className="text-sm">Your notes will appear here</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}