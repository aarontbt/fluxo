"use client"

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, FileText, Copy, Download, Edit3, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface MedicalRecording {
  id: string
  patientName: string
  date: string
  time: string
  duration: number
  audioBlob?: Blob
  transcription?: string
  medicalNotes?: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
  isProcessing: boolean
}

interface TranscriptionDisplayProps {
  recording: MedicalRecording
  patientImage?: string
  onEdit?: () => void
  onSave?: () => void
  onNewRecording?: () => void
}

export function TranscriptionDisplay({
  recording,
  patientImage,
  onEdit,
  onSave,
  onNewRecording,
}: TranscriptionDisplayProps) {
  const [activeTab, setActiveTab] = useState<'transcription' | 'soap'>('transcription')
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCopy = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const extractedEntities = {
    symptoms: ['lower back pain', 'sharp and stabbing pain', 'limited mobility'],
    conditions: ['acute lumbar strain', 'possible disc injury'],
    treatments: ['NSAIDs', 'activity modification', 'physical therapy'],
    timeline: ['3 days ago', 'new gym', 'Pilates class']
  }

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={patientImage} alt={recording.patientName} />
              <AvatarFallback className="bg-green-100 text-green-600 font-medium">
                {recording.patientName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{recording.patientName}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{recording.date}, {recording.time}</span>
                <span>•</span>
                <span>{formatDuration(recording.duration)}</span>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Processed
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" onClick={onSave}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Processing Animation */}
        {recording.isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <FileText className="h-6 w-6 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-lg font-medium text-gray-900 mb-2">Processing Recording</div>
              <div className="text-sm text-gray-500">Analyzing audio and generating medical notes...</div>
              <div className="mt-4">
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {!recording.isProcessing && recording.transcription && (
          <>
            {/* Tab Navigation */}
            <div className="px-6 pt-4">
              <div className="flex gap-1 bg-gray-50 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab('transcription')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'transcription'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Transcription
                </button>
                <button
                  onClick={() => setActiveTab('soap')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'soap'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  SOAP Notes
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6">
              {activeTab === 'transcription' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Raw Transcription */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Audio Transcription</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(recording.transcription!, 'transcription')}
                      >
                        {copiedSection === 'transcription' ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{recording.transcription}</p>
                  </div>

                  {/* Extracted Entities */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Extracted Medical Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Symptoms</h4>
                        <div className="flex flex-wrap gap-1">
                          {extractedEntities.symptoms.map((symptom, index) => (
                            <Badge key={index} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Conditions</h4>
                        <div className="flex flex-wrap gap-1">
                          {extractedEntities.conditions.map((condition, index) => (
                            <Badge key={index} variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Treatments</h4>
                        <div className="flex flex-wrap gap-1">
                          {extractedEntities.treatments.map((treatment, index) => (
                            <Badge key={index} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              {treatment}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Timeline</h4>
                        <div className="flex flex-wrap gap-1">
                          {extractedEntities.timeline.map((time, index) => (
                            <Badge key={index} variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'soap' && recording.medicalNotes && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Subjective */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-blue-900">Subjective</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(recording.medicalNotes!.subjective, 'subjective')}
                      >
                        {copiedSection === 'subjective' ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{recording.medicalNotes.subjective}</p>
                  </div>

                  {/* Objective */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-green-900">Objective</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(recording.medicalNotes!.objective, 'objective')}
                      >
                        {copiedSection === 'objective' ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{recording.medicalNotes.objective}</p>
                  </div>

                  {/* Assessment */}
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-yellow-900">Assessment</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(recording.medicalNotes!.assessment, 'assessment')}
                      >
                        {copiedSection === 'assessment' ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{recording.medicalNotes.assessment}</p>
                  </div>

                  {/* Plan */}
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-purple-900">Plan</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(recording.medicalNotes!.plan, 'plan')}
                      >
                        {copiedSection === 'plan' ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{recording.medicalNotes.plan}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Processed using AI medical transcription • Review for accuracy
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onEdit}>
                    Make Corrections
                  </Button>
                  <Button onClick={onNewRecording} className="bg-blue-600 hover:bg-blue-700">
                    New Recording
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}