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
    liveTranscription,
    transcriptionError,
    isTranscribing,
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

        {/* Right Panel - Medical Notes / Live Transcription */}
        {viewMode === 'recording' && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Medical Notes</h2>
              <div className="text-sm text-gray-500">
                {isRecording ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Recording in progress...
                  </div>
                ) : (
                  'Ready to record patient consultation'
                )}
              </div>
              {transcriptionError && (
                <div className="mt-2 text-xs text-red-600">
                  {transcriptionError}
                </div>
              )}
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {!isRecording && !liveTranscription && !currentRecording?.transcription && (
                <div className="text-center text-gray-400 mt-12">
                  <div className="text-lg mb-2">🎤</div>
                  <div>Start recording to generate medical notes</div>
                </div>
              )}
              
              {/* Live Transcription */}
              {(liveTranscription || currentRecording?.liveTranscription) && (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    Live Transcription
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {liveTranscription || currentRecording?.liveTranscription}
                  </div>
                </div>
              )}
              
              {/* Final Transcription with Speaker Segments */}
              {currentRecording?.transcription && !isRecording && (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-green-600 uppercase tracking-wide">
                    Final Transcription
                  </div>
                  {currentRecording.speakerSegments && currentRecording.speakerSegments.length > 0 ? (
                    <div className="space-y-3">
                      {currentRecording.speakerSegments.map((segment, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border-l-4 ${
                            segment.speaker !== null
                              ? `bg-blue-50 text-blue-900 border-blue-400`
                              : 'bg-gray-50 text-gray-800 border-gray-300'
                          }`}
                        >
                          <div className="text-xs font-medium mb-1">
                            {segment.speaker !== null ? `Speaker ${segment.speaker}` : 'Unknown Speaker'}
                          </div>
                          <div className="text-sm leading-relaxed">
                            {segment.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {currentRecording.transcription}
                    </div>
                  )}
                </div>
              )}
              
              {/* Loading indicator */}
              {isTranscribing && !liveTranscription && (
                <div className="text-center text-gray-500 mt-8">
                  <div className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm">Initializing transcription...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}