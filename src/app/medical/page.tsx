"use client"

import { useState } from 'react'
import { PatientRecordingList } from '@/components/patient-recording-list'
import { MedicalRecordingInterface } from '@/components/medical-recording-interface'
import { MedicalNotesPanel } from '@/components/medical-notes-panel'
import { MobileMedicalInterface } from '@/components/mobile-medical-interface'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'

interface Recording {
  id: string
  date: string
  time: string
  type: string
  duration?: string
}

export default function MedicalConsultationPage() {
  const { isRecording, audioLevel, toggleRecording, duration } = useAudioRecorder()
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  
  const patientInfo = {
    name: "Jen Garcia",
    image: "/api/placeholder/40/40",
    visitType: "Follow-up visit"
  }

  const handleSelectRecording = (recording: Recording) => {
    setSelectedRecording(recording)
  }

  const handleStartNewRecording = () => {
    setSelectedRecording(null)
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
          duration={duration}
          onToggleRecording={toggleRecording}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen bg-gray-50">
        {/* Left Panel - Patient Recording List */}
        <PatientRecordingList
          patientName={patientInfo.name}
          patientImage={patientInfo.image}
          onSelectRecording={handleSelectRecording}
          onStartNewRecording={handleStartNewRecording}
        />

        {/* Center Panel - Recording Interface */}
        <MedicalRecordingInterface
          patientName={patientInfo.name}
          patientImage={patientInfo.image}
          visitType={patientInfo.visitType}
          isRecording={isRecording}
          duration={duration}
          onToggleRecording={toggleRecording}
        />

        {/* Right Panel - Medical Notes */}
        <MedicalNotesPanel
          transcriptionText="Sample medical transcription text..."
          lastSaved="a minute ago"
        />
      </div>
    </>
  )
}