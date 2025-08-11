"use client"

import { AlertTriangle, Activity, Target } from 'lucide-react'
import type { MedicalRecording } from '@/types/medical'

interface RiskAssessmentSectionProps {
  recording?: MedicalRecording | null
}

export function RiskAssessmentSection({ recording }: RiskAssessmentSectionProps) {
  const hasN8nAnalysis = recording?.n8nAnalysis && (
    recording.n8nAnalysis.red_flags?.length ||
    recording.n8nAnalysis.risk_hypotheses?.length ||
    recording.n8nAnalysis.next_visit_metrics?.length
  )

  return (
    <div className="space-y-4">
      {/* Red Flags from n8n */}
      {recording?.n8nAnalysis?.red_flags && recording.n8nAnalysis.red_flags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="font-medium text-red-700">Red Flags</p>
          </div>
          <ul className="space-y-1">
            {recording.n8nAnalysis.red_flags.map((flag, idx) => (
              <li key={idx} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Hypotheses from n8n */}
      {recording?.n8nAnalysis?.risk_hypotheses && recording.n8nAnalysis.risk_hypotheses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-yellow-500" />
            <p className="font-medium text-yellow-700">Risk Hypotheses</p>
          </div>
          <ul className="space-y-1">
            {recording.n8nAnalysis.risk_hypotheses.map((risk, idx) => (
              <li key={idx} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Visit Metrics from n8n */}
      {recording?.n8nAnalysis?.next_visit_metrics && recording.n8nAnalysis.next_visit_metrics.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-500" />
            <p className="font-medium text-blue-700">Next Visit Metrics</p>
          </div>
          <ul className="space-y-1">
            {recording.n8nAnalysis.next_visit_metrics.map((metric, idx) => (
              <li key={idx} className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                {metric}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fallback to key points if no n8n analysis */}
      {!hasN8nAnalysis && (
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">Key Clinical Points:</p>
          {recording?.transcription ? (
            <p className="text-gray-500">
              Analysis will appear here after processing the recording.
            </p>
          ) : (
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Start recording to capture clinical data</li>
              <li>Medical highlights will be extracted automatically</li>
              <li>Risk factors and red flags will be identified</li>
            </ul>
          )}
        </div>
      )}
    </div>
  )
}