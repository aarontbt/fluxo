"use client"

import type { MedicalRecording } from '@/types/medical'

interface TranscriptionTabProps {
  recording?: MedicalRecording | null
  transcriptionText?: string
}

export function TranscriptionTab({ recording, transcriptionText }: TranscriptionTabProps) {
  const displayTranscription = recording?.transcription || transcriptionText || ''
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!displayTranscription) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">No transcription available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {recording?.duration && (
        <div className="text-xs text-gray-500">
          Duration: {formatDuration(recording.duration)}
        </div>
      )}
      
      {recording?.speakerSegments && recording.speakerSegments.length > 0 ? (
        <div className="space-y-3">
          {recording.speakerSegments.map((segment, index) => {
            const speakerColors = [
              'bg-blue-50 text-blue-900 border-blue-300',
              'bg-green-50 text-green-900 border-green-300',
              'bg-purple-50 text-purple-900 border-purple-300',
              'bg-orange-50 text-orange-900 border-orange-300',
            ]
            const colorClass = segment.speaker !== null
              ? speakerColors[segment.speaker % speakerColors.length]
              : 'bg-gray-50 text-gray-800 border-gray-300'

            return (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${colorClass}`}
              >
                <div className="text-xs font-medium mb-1 opacity-75">
                  {segment.speaker !== null ? `Speaker ${segment.speaker + 1}` : 'Unknown Speaker'}
                </div>
                <div className="text-sm leading-relaxed">
                  {segment.text}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {displayTranscription}
        </div>
      )}
    </div>
  )
}