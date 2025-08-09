"use client"

import { motion } from 'framer-motion'
import { Mic, Square, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecordButtonProps {
  isRecording: boolean
  onToggleRecording: () => void
  disabled?: boolean
}

export function RecordButton({ isRecording, onToggleRecording, disabled }: RecordButtonProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      <motion.button
        onClick={onToggleRecording}
        disabled={disabled}
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center",
          "border-4 transition-all duration-300 shadow-lg",
          isRecording
            ? "bg-red-500 border-red-400 shadow-red-500/50"
            : "bg-white border-gray-200 hover:border-red-300 shadow-gray-300/50"
        )}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        animate={{
          boxShadow: isRecording 
            ? "0 0 30px rgba(239, 68, 68, 0.5)" 
            : "0 10px 25px rgba(0, 0, 0, 0.1)"
        }}
      >
        {isRecording && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-red-400"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
        
        <motion.div
          animate={{ scale: isRecording ? 0.7 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {isRecording ? (
            <Square className="w-6 h-6 text-white fill-current" />
          ) : (
            <Mic className="w-8 h-8 text-gray-600" />
          )}
        </motion.div>
      </motion.button>

      <div className="flex items-center gap-4 text-gray-600">
        <Stethoscope className="w-5 h-5" />
        <div className="text-sm">
          {isRecording ? 'Recording medical notes...' : 'Tap to record'}
        </div>
      </div>
    </div>
  )
}