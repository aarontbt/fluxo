"use client"

import { useState } from 'react'
import { Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { SparklesText } from '@/components/ui/sparkles-text'

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

interface PatientRecordingListProps {
  patientName: string
  patientImage?: string
  recordings: MedicalRecording[]
  currentRecording: MedicalRecording | null
  onSelectRecording: (recording: MedicalRecording) => void
  onStartNewRecording: () => void
}

export function PatientRecordingList({
  patientName: _patientName,
  patientImage: _patientImage,
  recordings,
  currentRecording,
  onSelectRecording,
  onStartNewRecording
}: PatientRecordingListProps) {
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null)

  const handleRecordingClick = (recording: MedicalRecording) => {
    setSelectedRecording(recording.id)
    onSelectRecording(recording)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4">
        <div className="mb-6 hidden lg:block">
          <SparklesText
            text="Fluxo Scribe"
            className="text-3xl"
            sparklesCount={4}
            align="left"
          />
        </div>

        <h3 className="text-blue-600 font-medium mb-4">Recordings</h3>
      </div>

      {/* Recording List */}
      <div className="flex-1 overflow-y-auto">
        {/* Current Recording */}
        {currentRecording && (
          <motion.div
            key={`current-${currentRecording.id}`}
            className="p-4 border-b border-gray-50 bg-blue-50 border-blue-100"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-blue-600 font-medium">
                {currentRecording.isProcessing ? 'Processing...' : 'Current Recording'}
              </span>
            </div>
            <div className="text-sm text-gray-700 mb-2">
              {currentRecording.date}, {currentRecording.time}
            </div>
            <div className="text-xs text-blue-600 bg-blue-100 inline-block px-2 py-1 rounded">
              {formatDuration(currentRecording.duration)}
            </div>
          </motion.div>
        )}

        {/* Previous Recordings */}
        {recordings.map((recording) => (
          <motion.div
            key={recording.id}
            whileHover={{ backgroundColor: '#f8fafc' }}
            className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${
              selectedRecording === recording.id ? 'bg-blue-50 border-blue-100' : ''
            }`}
            onClick={() => handleRecordingClick(recording)}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600">{recording.time}</span>
              <span className="text-xs text-gray-500">Medical Consultation</span>
              {recording.transcription && (
                <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded text-[10px]">
                  Transcribed
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mb-2">
              {recording.date}, {recording.time}
            </div>
            <div className="text-xs text-blue-600 bg-blue-100 inline-block px-2 py-1 rounded">
              {formatDuration(recording.duration)}
            </div>
            {recording.transcription && (
              <div className="text-xs text-gray-600 mt-2 line-clamp-2">
                {recording.transcription.substring(0, 80)}...
              </div>
            )}
          </motion.div>
        ))}

        {recordings.length === 0 && !currentRecording && (
          <div className="p-8 text-center text-gray-400">
            <div className="text-2xl mb-2">🎤</div>
            <div className="text-sm">No recordings yet</div>
            <div className="text-xs mt-1">Start your first consultation recording</div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-100">
        <Button
          onClick={onStartNewRecording}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Scribe it
        </Button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Click to initiate scribing of your transcription
        </p>
      </div>
    </div>
  )
}