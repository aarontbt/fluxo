"use client"

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  sessionNotes?: {
    timestamp: string
    note: string
  }[]
  liveTranscription?: string
  speakerSegments?: Array<{
    speaker: number | null
    text: string
  }>
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
  n8nAnalysis?: {
    soa_markdown: string
    risk_hypotheses: string[]
    red_flags: string[]
    next_visit_metrics: string[]
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
  const [planMode, setPlanMode] = useState(false)

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

        {/* No transcription available */}
        {!recording.isProcessing && !recording.transcription && (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transcription Available</h3>
              <p className="text-gray-500 mb-6">This recording doesn&apos;t have a transcription yet.</p>
              <Button onClick={onNewRecording} className="bg-blue-600 text-white hover:bg-blue-700">
                Start New Recording
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {!recording.isProcessing && recording.transcription && (
          <>
            {/* Tab Navigation */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between">
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
                
                {/* Plan Mode Switch */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Plan Mode</span>
                  <Switch 
                    checked={planMode} 
                    onCheckedChange={setPlanMode}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>
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
                      <h3 className="text-lg font-medium text-gray-900">
                        Audio Transcription
                        {recording.speakerSegments && recording.speakerSegments.length > 0 && (
                          <span className="ml-2 text-sm text-gray-500">
                            ({new Set(recording.speakerSegments.map(s => s.speaker).filter(s => s !== null)).size} speakers detected)
                          </span>
                        )}
                      </h3>
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
                    
                    {/* Display speaker segments if available */}
                    {recording.speakerSegments && recording.speakerSegments.length > 0 ? (
                      <div className="space-y-3">
                        {recording.speakerSegments.map((segment, index) => {
                          const speakerColors = [
                            'bg-blue-50 text-blue-900 border-blue-300',
                            'bg-green-50 text-green-900 border-green-300',
                            'bg-purple-50 text-purple-900 border-purple-300',
                            'bg-orange-50 text-orange-900 border-orange-300',
                            'bg-pink-50 text-pink-900 border-pink-300',
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
                      <p className="text-gray-700 leading-relaxed">{recording.transcription}</p>
                    )}
                  </div>

                  {/* Session Notes */}
                  {recording.sessionNotes && recording.sessionNotes.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Session Notes</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(
                            recording.sessionNotes!.map(note => `[${note.timestamp}] ${note.note}`).join('\n'),
                            'sessionNotes'
                          )}
                        >
                          {copiedSection === 'sessionNotes' ? (
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          Copy All
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {recording.sessionNotes.map((note, index) => (
                          <div key={index} className="bg-white p-4 rounded-md border border-green-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-xs text-green-700 font-mono mb-1">{note.timestamp}</div>
                                <div className="text-sm text-gray-800 leading-relaxed">{note.note}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(note.note, `sessionNote-${index}`)}
                                className="ml-2 h-6 w-6 p-0"
                              >
                                {copiedSection === `sessionNote-${index}` ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-green-700">
                        Notes added during recording session
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'soap' && (recording.medicalNotes || recording.n8nAnalysis) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* AI Generated SOAP Notes from n8n */}
                  {recording.n8nAnalysis?.soa_markdown && (
                    <div className="bg-blue-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">AI Generated SOA Assessment</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(recording.n8nAnalysis!.soa_markdown, 'soap-analysis')}
                          className="flex items-center gap-2"
                        >
                          {copiedSection === 'soap-analysis' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          Copy SOAP Notes
                        </Button>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <div 
                          className="whitespace-pre-line text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: recording.n8nAnalysis.soa_markdown
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                              .replace(/- /g, '• ')
                              .replace(/^\d+\./gm, '• ')
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Extracted Entities - Plan Mode */}
                  {planMode && (
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
                  )}

                  {/* SOAP Notes - Plan Mode */}
                  {planMode && (
                    <>
                      {/* Subjective */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                        Subjective
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(
                          typeof recording.medicalNotes!.subjective === 'string'
                            ? recording.medicalNotes!.subjective
                            : `Chief Complaint: ${recording.medicalNotes!.subjective.chiefComplaint}\n\nHistory: ${recording.medicalNotes!.subjective.history}`,
                          'subjective'
                        )}
                      >
                        {copiedSection === 'subjective' ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>
                    {typeof recording.medicalNotes?.subjective === 'string' ? (
                      <p className="text-gray-700 leading-relaxed">{recording.medicalNotes?.subjective}</p>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Chief Complaint</p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {recording.medicalNotes?.subjective?.chiefComplaint}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">History</p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {recording.medicalNotes?.subjective?.history}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Objective */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                        Objective
                      </h3>
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
                    <p className="text-gray-700 leading-relaxed">{recording.medicalNotes?.objective}</p>
                  </div>

                  {/* Assessment */}
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-yellow-900 flex items-center gap-2">
                        Assessment
                      </h3>
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
                    <p className="text-gray-700 leading-relaxed">{recording.medicalNotes?.assessment}</p>
                  </div>

                  {/* Plan */}
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                        Plan
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(
                          typeof recording.medicalNotes!.plan === 'string'
                            ? recording.medicalNotes!.plan
                            : `Medications: ${recording.medicalNotes!.plan.medications}\n\nProcedures: ${recording.medicalNotes!.plan.procedures}\n\nFollow-up: ${recording.medicalNotes!.plan.followUp}`,
                          'plan'
                        )}
                      >
                        {copiedSection === 'plan' ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>
                    {typeof recording.medicalNotes?.plan === 'string' ? (
                      <p className="text-gray-700 leading-relaxed">{recording.medicalNotes?.plan}</p>
                    ) : (
                      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Medications</p>
                          <p>{recording.medicalNotes?.plan?.medications}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Procedures</p>
                          <p>{recording.medicalNotes?.plan?.procedures}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Follow-up</p>
                          <p>{recording.medicalNotes?.plan?.followUp}</p>
                        </div>
                      </div>
                    )}
                  </div>
                    </>
                  )}
                </motion.div>
              )}

            </div>

            {/* AI Risk Analysis - Outside of tabs */}
            {recording.n8nAnalysis && (recording.n8nAnalysis.risk_hypotheses?.length > 0 || recording.n8nAnalysis.red_flags?.length > 0 || recording.n8nAnalysis.next_visit_metrics?.length > 0) && (
              <div className="px-6 pb-6 space-y-6">
                {/* Red Flags - First Priority */}
                {recording.n8nAnalysis.red_flags && recording.n8nAnalysis.red_flags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Red Flags - Monitor Closely</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(recording.n8nAnalysis!.red_flags.join('\n'), 'red-flags')}
                        className="flex items-center gap-2"
                      >
                        {copiedSection === 'red-flags' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {recording.n8nAnalysis.red_flags.map((flag, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Risk Hypotheses */}
                {recording.n8nAnalysis.risk_hypotheses && recording.n8nAnalysis.risk_hypotheses.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-amber-50 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Risk Hypotheses</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(recording.n8nAnalysis!.risk_hypotheses.join('\n'), 'risk-hypotheses')}
                        className="flex items-center gap-2"
                      >
                        {copiedSection === 'risk-hypotheses' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {recording.n8nAnalysis.risk_hypotheses.map((hypothesis, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Badge variant="secondary" className="mt-0.5 text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-gray-700">{hypothesis}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Next Visit Metrics */}
                {recording.n8nAnalysis.next_visit_metrics && recording.n8nAnalysis.next_visit_metrics.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-green-50 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Next Visit Monitoring</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(recording.n8nAnalysis!.next_visit_metrics.join('\n'), 'next-visit')}
                        className="flex items-center gap-2"
                      >
                        {copiedSection === 'next-visit' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recording.n8nAnalysis.next_visit_metrics.map((metric, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-white rounded-md">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-700 text-sm">{metric}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

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