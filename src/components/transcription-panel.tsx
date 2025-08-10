"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { aiTranscriptionService } from '@/lib/ai-transcription'

interface TranscriptionPanelProps {
  audioBlob: Blob | null
  isVisible: boolean
  onClose: () => void
}

interface TranscriptionState {
  isTranscribing: boolean
  transcription: string | null
  insights: {
    summary: string
    keyFindings: string[]
    recommendations: string[]
    urgencyLevel: 'low' | 'medium' | 'high'
    followUpRequired: boolean
  } | null
  error: string | null
}

export function TranscriptionPanel({ audioBlob, isVisible, onClose }: TranscriptionPanelProps) {
  const [state, setState] = useState<TranscriptionState>({
    isTranscribing: false,
    transcription: null,
    insights: null,
    error: null
  })

  const processAudioRecording = useCallback(async () => {
    if (!audioBlob) return

    setState(prev => ({ ...prev, isTranscribing: true, error: null }))

    try {
      // Transcribe audio
      const transcriptionResult = await aiTranscriptionService.transcribeAudio(audioBlob)
      setState(prev => ({ 
        ...prev, 
        transcription: transcriptionResult.text 
      }))

      // Generate healthcare insights
      const insights = await aiTranscriptionService.generateHealthcareInsights(transcriptionResult.text)
      setState(prev => ({ 
        ...prev, 
        insights,
        isTranscribing: false 
      }))
    } catch {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to process recording',
        isTranscribing: false 
      }))
    }
  }, [audioBlob])

  useEffect(() => {
    if (audioBlob && isVisible) {
      processAudioRecording()
    }
  }, [audioBlob, isVisible, processAudioRecording])

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 bg-white z-50 overflow-y-auto"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">AI Analysis</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Loading State */}
            {state.isTranscribing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <div className="text-gray-600">Processing medical notes...</div>
                <div className="text-sm text-gray-400 mt-2">
                  Transcribing speech and analyzing content
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {state.error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 text-red-600"
              >
                <AlertTriangle className="w-8 h-8 mx-auto mb-4" />
                <div>{state.error}</div>
              </motion.div>
            )}

            {/* Results */}
            {state.transcription && !state.isTranscribing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Transcription */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Transcription</h3>
                  </div>
                  <div className="text-gray-700 leading-relaxed">
                    {state.transcription}
                  </div>
                </div>

                {/* Healthcare Insights */}
                {state.insights && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      🏥 Healthcare Analysis
                    </h3>

                    {/* Urgency Level */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(state.insights.urgencyLevel)}`}>
                        {state.insights.urgencyLevel.toUpperCase()} PRIORITY
                      </span>
                      {state.insights.followUpRequired && (
                        <span className="flex items-center gap-1 text-blue-600 text-sm">
                          <Clock className="w-4 h-4" />
                          Follow-up required
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Clinical Summary</h4>
                      <p className="text-blue-800">{state.insights.summary}</p>
                    </div>

                    {/* Key Findings */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Findings</h4>
                      <ul className="space-y-2">
                        {state.insights.keyFindings.map((finding: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {state.insights.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}