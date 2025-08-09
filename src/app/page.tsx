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
  
  const patientInfo = {
    name: "Jen Garcia",
    image: "/api/placeholder/40/40",
    visitType: "Follow-up visit"
  }

  const handleSelectRecording = (recording: typeof recordings[0]) => {
    setSelectedRecording(recording)
    setViewMode('transcription')
  }

  const handleStartNewRecording = () => {
    setSelectedRecording(null)
    setViewMode('recording')
  }

  const handleStartRecording = async () => {
    await startRecording(patientInfo.name)
    setViewMode('recording')
  }

  const handleStopRecording = async () => {
    await stopRecording()
    setViewMode('transcription')
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
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Notes</h2>
              <div className="text-sm text-gray-500">
                {isRecording ? 'Recording in progress...' : 'Ready to record patient consultation'}
              </div>
            </div>
            <div className="flex-1 p-6">
              <div className="text-center text-gray-400 mt-12">
                <div className="text-lg mb-2">🎤</div>
                <div>Start recording to generate medical notes</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}