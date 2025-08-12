"use client"

import { Button } from '@/components/ui/button'
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

  if (recording?.n8nAnalysis?.soa_markdown && soapSections) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">AI Generated SOAP Notes</h3>
          
          {soapSections.subjective && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-1">Subjective</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line">{soapSections.subjective}</p>
            </div>
          )}
          
          {soapSections.objective && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-1">Objective</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line">{soapSections.objective}</p>
            </div>
          )}
          
          {soapSections.assessment && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-1">Assessment</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line">{soapSections.assessment}</p>
            </div>
          )}
          
          {soapSections.plan && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Plan</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line">{soapSections.plan}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Subjective</h3>
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Chief Complaint</p>
            <p className="text-sm text-gray-600">
              {typeof medicalSections.subjective === 'string' 
                ? medicalSections.subjective 
                : medicalSections.subjective?.chiefComplaint}
            </p>
          </div>
          {typeof medicalSections.subjective !== 'string' && medicalSections.subjective?.history && (
            <div>
              <p className="text-sm font-medium text-gray-700">History</p>
              <p className="text-sm text-gray-600">{medicalSections.subjective.history}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Objective</h3>
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">{medicalSections.objective}</p>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Assessment</h3>
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">{medicalSections.assessment}</p>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Plan</h3>
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {typeof medicalSections.plan === 'string' ? (
            <p className="text-sm text-gray-600">{medicalSections.plan}</p>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700">Medications</p>
                <p className="text-sm text-gray-600">{medicalSections.plan?.medications}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Procedures</p>
                <p className="text-sm text-gray-600">{medicalSections.plan?.procedures}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Follow-up</p>
                <p className="text-sm text-gray-600">{medicalSections.plan?.followUp}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {medicalSections.ros && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Review of Systems</h3>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Cardiovascular:</span> {medicalSections.ros.cardiovascular}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Respiratory:</span> {medicalSections.ros.respiratory}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Musculoskeletal:</span> {medicalSections.ros.musculoskeletal}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}