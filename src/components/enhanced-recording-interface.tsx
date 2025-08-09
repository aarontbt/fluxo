"use client"

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Clock, Mic, Square, Pause, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface EnhancedRecordingInterfaceProps {
  patientName: string
  patientImage?: string
  visitType: string
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioLevel: number
  onStartRecording: () => void
  onStopRecording: () => void
  onPauseRecording: () => void
  onResumeRecording: () => void
}

export function EnhancedRecordingInterface({
  patientName,
  patientImage,
  visitType,
  isRecording,
  isPaused,
  duration,
  audioLevel,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
}: EnhancedRecordingInterfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = () => {
    const now = new Date()
    return `Recording 1: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  }

  // Enhanced waveform drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawWaveform = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      const centerY = height / 2
      const barCount = 60
      const barWidth = width / barCount
      const maxBarHeight = height * 0.8

      // Create smooth, flowing waveform
      for (let i = 0; i < barCount; i++) {
        const progress = i / barCount
        const time = Date.now() / 1000 + progress * 2

        let barHeight
        if (isRecording && !isPaused) {
          // Active recording with audio level influence
          const baseWave = Math.sin(time * 2) * 0.3
          const detailWave = Math.sin(time * 8) * 0.2
          const noiseWave = (Math.random() - 0.5) * 0.1
          const audioInfluence = audioLevel * 0.5
          
          const amplitude = (baseWave + detailWave + noiseWave + audioInfluence) * 0.5 + 0.5
          barHeight = Math.max(amplitude * maxBarHeight, 4)
        } else {
          // Static waveform for idle state
          const staticWave = Math.sin(progress * Math.PI * 4) * 0.3 + 0.3
          barHeight = staticWave * maxBarHeight * 0.4
        }

        const x = i * barWidth
        const y = centerY - barHeight / 2

        // Gradient colors based on activity
        let color
        if (isRecording && !isPaused) {
          const intensity = Math.min(barHeight / maxBarHeight + audioLevel, 1)
          const red = Math.floor(59 + intensity * 100)  // 59 to 159
          const green = Math.floor(130 + intensity * 100) // 130 to 230
          const blue = Math.floor(246) // Constant blue
          color = `rgb(${red}, ${green}, ${blue})`
        } else if (isPaused) {
          color = '#94a3b8' // Slate gray for paused
        } else {
          color = '#cbd5e1' // Light gray for idle
        }

        ctx.fillStyle = color
        ctx.fillRect(x + 1, y, barWidth - 2, Math.max(barHeight, 2))
      }

      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(drawWaveform)
      }
    }

    drawWaveform()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRecording, isPaused, audioLevel])

  const handleMainButtonClick = () => {
    if (!isRecording) {
      onStartRecording()
    } else {
      onStopRecording()
    }
  }

  const handlePauseResumeClick = () => {
    if (isPaused) {
      onResumeRecording()
    } else {
      onPauseRecording()
    }
  }

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Patient Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={patientImage} alt={patientName} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
              {patientName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{patientName}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>12:00PM</span>
              <span>{visitType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recording Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Recording Info */}
        <div className="text-center mb-8">
          <div className="text-sm text-gray-500 mb-2">
            {formatDate()}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={isRecording ? 'recording' : 'ready'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2"
            >
              <span className="text-sm text-gray-600">
                {isRecording ? (isPaused ? 'Recording Paused' : 'Recording...') : 'Ready to record'}
              </span>
              {isRecording && (
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enhanced Waveform */}
        <div className="w-full max-w-2xl mb-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <canvas
              ref={canvasRef}
              width={600}
              height={120}
              className="w-full h-24 max-w-full"
            />
          </div>
        </div>

        {/* Timer Display */}
        <motion.div
          className="text-4xl font-mono font-medium text-blue-600 mb-8"
          animate={{
            scale: isRecording && !isPaused ? [1, 1.02, 1] : 1
          }}
          transition={{
            duration: 1,
            repeat: isRecording && !isPaused ? Infinity : 0
          }}
        >
          {formatTime(duration)}
        </motion.div>

        {/* Recording Status */}
        <div className="text-center mb-8">
          <div className="text-lg font-medium text-gray-900 mb-1">
            {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}
          </div>
          <div className="text-sm text-gray-500">
            {isRecording ? 'Medical consultation in progress' : 'Tap to start recording patient consultation'}
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-6">
          {/* Pause/Resume Button */}
          {isRecording && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handlePauseResumeClick}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              {isPaused ? (
                <Play className="w-5 h-5 text-gray-600 ml-0.5" />
              ) : (
                <Pause className="w-5 h-5 text-gray-600" />
              )}
            </motion.button>
          )}

          {/* Main Record/Stop Button */}
          <motion.button
            onClick={handleMainButtonClick}
            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all shadow-lg ${
              isRecording
                ? 'bg-red-500 border-red-400 text-white shadow-red-200 hover:bg-red-600'
                : 'bg-blue-500 border-blue-400 text-white shadow-blue-200 hover:bg-blue-600'
            }`}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            animate={{
              boxShadow: isRecording && !isPaused
                ? [
                    '0 0 20px rgba(239, 68, 68, 0.3)',
                    '0 0 30px rgba(239, 68, 68, 0.5)',
                    '0 0 20px rgba(239, 68, 68, 0.3)'
                  ]
                : '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity }
            }}
          >
            {isRecording ? (
              <Square className="w-6 h-6 fill-current" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </motion.button>
        </div>

        <div className="text-sm text-gray-500 text-center mt-4">
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </div>
      </div>
    </div>
  )
}