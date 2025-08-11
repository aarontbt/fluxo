"use client"

import type { MedicalRecording } from '@/types/medical'

interface TranscriptionDisplayProps {
  recording?: MedicalRecording | null
  transcriptionText?: string
}

export function TranscriptionDisplay({ recording, transcriptionText }: TranscriptionDisplayProps) {
  const displayTranscription = recording?.transcription || transcriptionText || ''

  if (!displayTranscription) return null

  return (
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
  )
}