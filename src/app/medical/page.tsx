"use client"

import { useState } from 'react'
import { PatientRecordingList } from '@/components/patient-recording-list'
import { MedicalRecordingInterface } from '@/components/medical-recording-interface'
import { MedicalNotesPanel } from '@/components/medical-notes-panel'
import { MobileMedicalInterface } from '@/components/mobile-medical-interface'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'

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
  isProcessing: boolean
}

export default function MedicalConsultationPage() {
  const { isRecording, audioLevel, toggleRecording, duration } = useAudioRecorder()
  const [_selectedRecording, setSelectedRecording] = useState<MedicalRecording | null>(null)

  const patientInfo = {
    name: "Jen Garcia",
    image: "/api/placeholder/40/40",
    visitType: "Follow-up visit"
  }

  const handleSelectRecording = (recording: MedicalRecording) => {
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
          isPaused={false}
          duration={duration}
          audioLevel={audioLevel}
          currentRecording={null}
          recordings={[]}
          onStartRecording={async () => toggleRecording()}
          onStopRecording={async () => toggleRecording()}
          onPauseRecording={() => {}}
          onResumeRecording={() => {}}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen bg-gray-50">
        {/* Left Panel - Patient Recording List */}
        <PatientRecordingList
          patientName={patientInfo.name}
          patientImage={patientInfo.image}
          recordings={[]}
          currentRecording={null}
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