"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, Edit3, Trash2, Save, User } from 'lucide-react'

interface MedicalNotesPanelProps {
  transcriptionText?: string
  lastSaved?: string
}

export function MedicalNotesPanel({ 
  transcriptionText: _transcriptionText = "", 
  lastSaved = "a minute ago" 
}: MedicalNotesPanelProps) {
  const [activeTab, setActiveTab] = useState('Note')
  const [_selectedCategory, _setSelectedCategory] = useState('')

  const tabs = ['Information', 'Highlights', 'Note']
  
  const sampleTranscription = `on hypercholesterolemia, hypertension, and worsening heart failure. All right, so let's get started. Let's start with your heart condition. We've been taking the lisinopril ten slash five milligrams once a day. How long have you had`

  const medicalSections = {
    subjective: {
      chiefComplaint: "Brenda presents today for persistent severe low back pain.",
      history: "Brenda is coming also for another injection of Toradol that has been helping. Brenda has been taking the lisinopril ten/five milligrams once a day. Denies any chest pain or shortness of breath. The patient has been in touch with Doctor Agola regarding her orthopedics."
    },
    ros: {
      cardiovascular: "chest pain",
      respiratory: "shortness of breath", 
      musculoskeletal: "back pain"
    },
    plan: {
      medications: "Contacted Dr. Agola and apparently he is not seeing patients.",
      procedures: "Unless they need procedures.",
      followUp: "Referred patient to another spine specialist. Brenda will be started on Skelaxin 800 BID. Instructed just to take it at that time. Brenda to be followed as needed. No more injections."
    }
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header with timestamp */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Last saved {lastSaved}</span>
          <span className="text-xs font-mono text-gray-600">00:15</span>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Save className="h-3 w-3" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'Note' && (
          <div className="space-y-6">
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
                
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  <span className="font-medium">Note:</span> Brenda has been taking the lisinopril ten / hydrochlorothiazide 12.5 milligrams once a day.
                </div>
              </div>
            </div>

            {/* ROS Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">ROS</h3>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cardiovascular:</p>
                  <p className="text-sm text-gray-700">-{medicalSections.ros.cardiovascular}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Respiratory:</p>
                  <p className="text-sm text-gray-700">-{medicalSections.ros.respiratory}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Musculoskeletal:</p>
                  <p className="text-sm text-gray-700">+{medicalSections.ros.musculoskeletal}</p>
                </div>
              </div>
            </div>

            {/* Plan Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Plan</h3>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                <p>{medicalSections.plan.medications}</p>
                <p>{medicalSections.plan.procedures}</p>
                <p>{medicalSections.plan.followUp}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Information' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span className="text-sm">Patient Information</span>
            </div>
            <div className="text-sm text-gray-500">
              Patient demographics and medical history would be displayed here.
            </div>
          </div>
        )}

        {activeTab === 'Highlights' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Key Clinical Points:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>Persistent severe low back pain</li>
                <li>Hypertension managed with lisinopril</li>
                <li>Previous Toradol injections helpful</li>
                <li>Referral to spine specialist needed</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Transcription Area */}
      <div className="border-t border-gray-100 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Subcategory</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Trash2 className="h-3 w-3 text-gray-400" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <select className="w-full p-2 border border-gray-200 rounded text-sm text-gray-600">
              <option>Type or select subcategory</option>
              <option>Chief Complaint</option>
              <option>History of Present Illness</option>
              <option>Review of Systems</option>
              <option>Assessment & Plan</option>
            </select>
          </div>

          <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 leading-relaxed max-h-20 overflow-y-auto">
            {sampleTranscription}
          </div>

          <div className="text-xs text-gray-400 text-center">
            08:10
          </div>
        </div>
      </div>
    </div>
  )
}