"use client"

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Clock, Mic, Square, Settings, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

interface MedicalRecordingInterfaceProps {
  patientName: string
  patientImage?: string
  visitType: string
  isRecording: boolean
  duration: number
  onToggleRecording: () => void
}

export function MedicalRecordingInterface({
  patientName,
  patientImage,
  visitType,
  isRecording,
  duration,
  onToggleRecording,
}: MedicalRecordingInterfaceProps) {
  const [audioLevel, setAudioLevel] = useState(0)

  // Simulate audio level fluctuation
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random())
      }, 100)
      return () => clearInterval(interval)
    } else {
      setAudioLevel(0)
    }
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const generateWaveform = () => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      height: isRecording ? 
        Math.random() * 40 + 10 * (audioLevel + 0.2) : 
        Math.random() * 20 + 5,
      isActive: i < (duration / 10 * 60) // Progress based on time
    }))
  }

  const waveformBars = generateWaveform()

  return (
    <div className="flex-1 bg-white flex flex-col items-center justify-center p-8">
      {/* Patient Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={patientImage} alt={patientName} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
              {patientName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900">{patientName}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-3 w-3" />
              <span>12:00PM</span>
              <span>{visitType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recording Status */}
      <div className="text-center mb-8">
        <div className="text-sm text-gray-500 mb-2">
          Recording 1: July 30, 9:40pm
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-600">
            {isRecording ? 'Recording...' : 'Ready to record'}
          </span>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-center h-24">
        <div className="flex items-end justify-center gap-1 h-full w-full">
          {waveformBars.map((bar) => (
            <motion.div
              key={bar.id}
              className={`w-1 rounded-full transition-colors ${
                bar.isActive && isRecording
                  ? 'bg-blue-500'
                  : bar.isActive
                  ? 'bg-blue-300'
                  : 'bg-gray-200'
              }`}
              style={{ height: `${bar.height}px` }}
              animate={{
                height: isRecording ? 
                  `${bar.height * (1 + audioLevel * 0.5)}px` : 
                  `${bar.height}px`
              }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-3xl font-mono text-gray-900 mb-8">
        {formatTime(duration)}
      </div>

      {/* Recording Button */}
      <motion.button
        onClick={onToggleRecording}
        className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all shadow-lg ${
          isRecording
            ? 'bg-blue-600 border-blue-500 text-white shadow-blue-200'
            : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
        }`}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        animate={{
          boxShadow: isRecording
            ? '0 0 20px rgba(59, 130, 246, 0.5)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        {isRecording ? (
          <Square className="w-6 h-6 fill-current" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </motion.button>

      <div className="text-sm text-gray-500 text-center mt-4">
        {isRecording ? 'Recording' : 'Recording'}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-8 mt-12">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Settings className="h-5 w-5 text-gray-400" />
          </motion.div>
        </Button>
        
        <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
          <ChevronDown className="h-4 w-4 mr-2" />
          Additional Options
        </Button>
      </div>
    </div>
  )
}