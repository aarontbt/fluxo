"use client"

import { User, AlertTriangle, Target, Activity } from 'lucide-react'
import type { MedicalRecording } from '@/types/medical'

interface RiskAssessmentSectionProps {
  recording?: MedicalRecording | null
}

export function RiskAssessmentSection({ recording }: RiskAssessmentSectionProps) {
  if (!recording?.n8nAnalysis) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
          <User className="h-4 w-4 text-yellow-600" />
          <div>
            <p className="text-xs font-medium text-gray-700">General Health</p>
            <p className="text-xs text-gray-600">Awaiting assessment...</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div>
            <p className="text-xs font-medium text-gray-700">Red Flags</p>
            <p className="text-xs text-gray-600">No data available</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Target className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-xs font-medium text-gray-700">Risk Hypotheses</p>
            <p className="text-xs text-gray-600">Processing...</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <Activity className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-xs font-medium text-gray-700">Next Visit Metrics</p>
            <p className="text-xs text-gray-600">Pending analysis...</p>
          </div>
        </div>
      </div>
    )
  }

  const { red_flags, risk_hypotheses, next_visit_metrics } = recording.n8nAnalysis

  return (
    <div className="space-y-3">
      {red_flags && red_flags.length > 0 && (
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-xs font-medium text-red-900">Red Flags</p>
          </div>
          <ul className="space-y-1">
            {red_flags.map((flag, index) => (
              <li key={index} className="text-xs text-red-800 flex items-start gap-1">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {risk_hypotheses && risk_hypotheses.length > 0 && (
        <div className="p-3 bg-amber-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-medium text-amber-900">Risk Hypotheses</p>
          </div>
          <ul className="space-y-1">
            {risk_hypotheses.map((hypothesis, index) => (
              <li key={index} className="text-xs text-amber-800 flex items-start gap-1">
                <span className="text-amber-500 mt-0.5">{index + 1}.</span>
                <span>{hypothesis}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {next_visit_metrics && next_visit_metrics.length > 0 && (
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-green-600" />
            <p className="text-xs font-medium text-green-900">Next Visit Monitoring</p>
          </div>
          <ul className="space-y-1">
            {next_visit_metrics.map((metric, index) => (
              <li key={index} className="text-xs text-green-800 flex items-start gap-1">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{metric}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}