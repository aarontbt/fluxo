"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Menu, RotateCcw, Cross } from 'lucide-react'
import { WaveformVisualizer } from '@/components/waveform-visualizer'
import { RecordButton } from '@/components/record-button'
import { TranscriptionPanel } from '@/components/transcription-panel'
import { MobileStatusBar } from '@/components/mobile-status-bar'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { motion } from 'framer-motion'

export default function SimpleRecordingPage() {
  const { isRecording, audioLevel, toggleRecording, duration, stopRecording } = useAudioRecorder()
  const recordingTitle = "Record 001"
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [showTranscription, setShowTranscription] = useState(false)

  const handleRecordingComplete = async () => {
    const blob = await stopRecording()
    if (blob) {
      setAudioBlob(blob)
      setShowTranscription(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.00`
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Status Bar */}
      <MobileStatusBar />

      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Menu className="w-6 h-6 text-gray-700" />
        <div className="flex gap-2">
          <Link 
            href="/" 
            className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
          >
            Medical Console
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Title */}
        <motion.h1 
          className="text-2xl font-semibold text-gray-900 mb-8"
          animate={{ scale: isRecording ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
        >
          {recordingTitle}
        </motion.h1>

        {/* Waveform Visualizer */}
        <div className="w-full max-w-md mb-8">
          <WaveformVisualizer isRecording={isRecording} audioLevel={audioLevel} />
        </div>

        {/* Timer */}
        <motion.div 
          className="text-lg font-mono text-gray-600 mb-12"
          animate={{ 
            color: isRecording ? '#ef4444' : '#6b7280',
            scale: isRecording ? 1.1 : 1 
          }}
        >
          {formatTime(duration)}
        </motion.div>

        {/* Record Button */}
        <RecordButton 
          isRecording={isRecording} 
          onToggleRecording={async () => {
            if (isRecording) {
              await handleRecordingComplete()
            } else {
              await toggleRecording()
            }
          }} 
        />
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-center gap-16 p-8">
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-full bg-gray-100"
        >
          <RotateCcw className="w-6 h-6 text-gray-600" />
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-full bg-red-100"
        >
          <Cross className="w-6 h-6 text-red-500" />
        </motion.button>
      </div>

      {/* Healthcare Context Banner */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-4 right-4 bg-blue-100 border border-blue-200 rounded-lg p-4"
        >
          <div className="text-sm text-blue-800 font-medium">
            🏥 Healthcare Mode Active
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Recording patient consultation notes with AI analysis
          </div>
        </motion.div>
      )}

      {/* Transcription Panel */}
      <TranscriptionPanel
        audioBlob={audioBlob}
        isVisible={showTranscription}
        onClose={() => setShowTranscription(false)}
      />
    </main>
  )
}