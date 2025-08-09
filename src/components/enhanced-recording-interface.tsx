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
  const animationFrameRef = useRef<number>()
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const frequencyDataRef = useRef<Uint8Array | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('prompt')
  const waveformHistoryRef = useRef<number[]>([])
  const lastUpdateTimeRef = useRef<number>(0)

  // Initialize audio context and microphone
  useEffect(() => {
    if (isRecording && !isPaused) {
      initializeAudio()
    } else {
      cleanupAudio()
    }

    return () => cleanupAudio()
  }, [isRecording, isPaused])

  const initializeAudio = async () => {
    try {
      setMicPermission('checking')
      setAudioError(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      setMicPermission('granted')

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const analyzer = audioContext.createAnalyser()
      analyzer.fftSize = 256
      analyzer.smoothingTimeConstant = 0.8
      analyzerRef.current = analyzer

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyzer)

      frequencyDataRef.current = new Uint8Array(analyzer.frequencyBinCount)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setMicPermission('denied')
          setAudioError('Microphone access denied. Please allow microphone permission and try again.')
        } else if (error.name === 'NotFoundError') {
          setAudioError('No microphone found. Please connect a microphone and try again.')
        } else if (error.name === 'NotSupportedError') {
          setAudioError('Audio recording is not supported in this browser.')
        } else {
          setAudioError('Failed to access microphone. Please try again.')
        }
      }
    }
  }

  const cleanupAudio = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyzerRef.current = null
    frequencyDataRef.current = null
  }

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
      const currentTime = Date.now()

      // Get real-time audio data if available
      let currentAmplitude = 0
      if (analyzerRef.current && frequencyDataRef.current && isRecording && !isPaused) {
        analyzerRef.current.getByteFrequencyData(frequencyDataRef.current)
        const frequencyData = frequencyDataRef.current
        
        // Calculate average amplitude from frequency data
        let sum = 0
        for (let i = 0; i < frequencyData.length / 4; i++) {
          sum += frequencyData[i]
        }
        currentAmplitude = (sum / (frequencyData.length / 4)) / 255
      }

      // Update waveform history every 50ms for smooth scrolling
      if (currentTime - lastUpdateTimeRef.current > 50) {
        if (isRecording && !isPaused) {
          // Add new amplitude to history
          waveformHistoryRef.current.push(currentAmplitude)
          
          // Keep only the last barCount values
          if (waveformHistoryRef.current.length > barCount) {
            waveformHistoryRef.current.shift()
          }
        }
        lastUpdateTimeRef.current = currentTime
      }

      // Create scrolling waveform visualization
      for (let i = 0; i < barCount; i++) {
        const progress = i / barCount
        const time = currentTime / 1000 + progress * 2

        let barHeight
        if (isRecording && !isPaused) {
          // Use historical data for scrolling effect
          const historyIndex = waveformHistoryRef.current.length - barCount + i
          if (historyIndex >= 0 && waveformHistoryRef.current[historyIndex] !== undefined) {
            // Use stored amplitude data
            const amplitude = waveformHistoryRef.current[historyIndex]
            const smoothWave = Math.sin(time * 0.5 + i * 0.2) * 0.05
            barHeight = Math.max((amplitude * 0.8 + smoothWave + 0.05) * maxBarHeight, 2)
          } else {
            // Fill with minimal activity for empty history
            const baseWave = Math.sin(time * 1.5 + i * 0.3) * 0.1 + 0.1
            barHeight = baseWave * maxBarHeight * 0.3
          }
        } else {
          // Static waveform for idle state
          const staticWave = Math.sin(progress * Math.PI * 4) * 0.3 + 0.3
          barHeight = staticWave * maxBarHeight * 0.4
        }

        const x = i * barWidth
        const y = centerY - barHeight / 2

        // Dynamic colors with fade effect for older data
        let color
        if (isRecording && !isPaused) {
          const intensity = Math.min(barHeight / maxBarHeight, 1)
          const fadeEffect = Math.max(0.3, i / barCount) // Fade older data on the left
          const red = Math.floor((59 + intensity * 100) * fadeEffect)
          const green = Math.floor((130 + intensity * 125) * fadeEffect)  
          const blue = Math.floor((246 - intensity * 50) * fadeEffect)
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
            {/* Microphone status indicator */}
            {isRecording && (
              <div className="flex items-center justify-center mb-4">
                {micPermission === 'checking' && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Requesting microphone access...</span>
                  </div>
                )}
                {micPermission === 'granted' && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Microphone active</span>
                  </div>
                )}
                {micPermission === 'denied' && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Microphone access denied</span>
                  </div>
                )}
              </div>
            )}
            
            <canvas
              ref={canvasRef}
              width={600}
              height={120}
              className="w-full h-24 max-w-full"
            />
            
            {/* Error message */}
            {audioError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 text-center">
                {audioError}
              </div>
            )}
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