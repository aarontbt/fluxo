"use client"

import { ChevronDown } from 'lucide-react'
import type { MedicalRecording } from '@/types/medical'

interface SOAPNotesSectionProps {
  recording?: MedicalRecording | null
  soapSections?: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  } | null
}

export function SOAPNotesSection({ recording, soapSections }: SOAPNotesSectionProps) {
  // Use actual medical notes from recording or provide defaults
  const medicalSections = recording?.medicalNotes || {
    subjective: {
      chiefComplaint: "Loading...",
      history: "Medical notes will appear here after processing."
    },
    objective: "Awaiting examination findings...",
    assessment: "Awaiting clinical assessment...",
    plan: {
      medications: "Awaiting medication recommendations...",
      procedures: "Awaiting procedure recommendations...",
      followUp: "Awaiting follow-up instructions..."
    },
    ros: {
      cardiovascular: "Awaiting review...",
      respiratory: "Awaiting review...",
      musculoskeletal: "Awaiting review..."
    }
  }

  if (soapSections) {
    return (
      <>
        {/* Subjective from n8n */}
        {soapSections.subjective && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Subjective</h3>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {soapSections.subjective}
            </p>
          </div>
        )}

        {/* Objective from n8n */}
        {soapSections.objective && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Objective</h3>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {soapSections.objective}
            </p>
          </div>
        )}

        {/* Assessment from n8n */}
        {soapSections.assessment && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Assessment</h3>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {soapSections.assessment}
            </p>
          </div>
        )}

        {/* Plan from n8n */}
        {soapSections.plan && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Plan</h3>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {soapSections.plan}
            </p>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* Fallback to structured medical notes */}
      {/* Subjective Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Subjective</h3>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Chief Complaint</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {medicalSections.subjective.chiefComplaint}
            </p>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            {medicalSections.subjective.history}
          </p>

          {/* Show session notes if available */}
          {recording?.sessionNotes && recording.sessionNotes.length > 0 && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              <span className="font-medium">Session Notes:</span>
              {recording.sessionNotes.map((note, idx) => (
                <div key={idx} className="mt-1">
                  [{note.timestamp}] {note.note}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Objective Section */}
      {medicalSections.objective && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Objective</h3>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {medicalSections.objective}
          </p>
        </div>
      )}

      {/* Assessment Section */}
      {medicalSections.assessment && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Assessment</h3>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {medicalSections.assessment}
          </p>
        </div>
      )}

      {/* ROS Section */}
      {medicalSections.ros && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Review of Systems</h3>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">Cardiovascular:</p>
              <p className="text-sm text-gray-700">{medicalSections.ros.cardiovascular}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Respiratory:</p>
              <p className="text-sm text-gray-700">{medicalSections.ros.respiratory}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Musculoskeletal:</p>
              <p className="text-sm text-gray-700">{medicalSections.ros.musculoskeletal}</p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Plan</h3>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>

        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <div>
            <span className="font-medium">Medications: </span>
            {medicalSections.plan.medications}
          </div>
          <div>
            <span className="font-medium">Procedures: </span>
            {medicalSections.plan.procedures}
          </div>
          <div>
            <span className="font-medium">Follow-up: </span>
            {medicalSections.plan.followUp}
          </div>
        </div>
      </div>
    </>
  )
}