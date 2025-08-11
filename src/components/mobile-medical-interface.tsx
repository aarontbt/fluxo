"use client"

import { useState } from 'react'
import { ChevronLeft, Menu, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SparklesText } from '@/components/ui/sparkles-text'
import { PatientRecordingList } from './patient-recording-list'
import { EnhancedRecordingInterface } from './enhanced-recording-interface'
import { TranscriptionDisplay } from './transcription-display'
import { MedicalNotesPanel } from './medical-notes-panel'
import { motion, AnimatePresence } from 'framer-motion'
import type { MedicalRecording, MobileViewMode } from '@/types/medical'

interface MobileMedicalInterfaceProps {
  patientName: string
  patientImage?: string
  visitType: string
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioLevel: number
  currentRecording: MedicalRecording | null
  recordings: MedicalRecording[]
  onStartRecording: () => Promise<void>
  onStopRecording: () => Promise<void>
  onPauseRecording: () => void
  onResumeRecording: () => void
}


export function MobileMedicalInterface({
  patientName,
  patientImage,
  visitType,
  isRecording,
  isPaused,
  duration,
  audioLevel,
  currentRecording,
  recordings,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
}: MobileMedicalInterfaceProps) {
  const [currentView, setCurrentView] = useState<MobileViewMode>('recording')
  const [selectedRecording, setSelectedRecording] = useState<MedicalRecording | null>(null)
  const [isNotesSheetOpen, setIsNotesSheetOpen] = useState(false)

  const handleSelectRecording = (recording: MedicalRecording) => {
    setSelectedRecording(recording)
    setCurrentView('transcription')
  }

  const handleStartNewRecording = () => {
    setSelectedRecording(null)
    setCurrentView('recording')
  }

  const handleStopRecording = async () => {
    await onStopRecording()
    setCurrentView('transcription')
  }

  const renderView = () => {
    switch (currentView) {
      case 'list':
        return (
          <PatientRecordingList
            patientName={patientName}
            patientImage={patientImage}
            recordings={recordings}
            currentRecording={currentRecording}
            onSelectRecording={handleSelectRecording}
            onStartNewRecording={handleStartNewRecording}
          />
        )
      case 'recording':
        return (
          <EnhancedRecordingInterface
            patientName={patientName}
            patientImage={patientImage}
            visitType={visitType}
            isRecording={isRecording}
            isPaused={isPaused}
            duration={duration}
            audioLevel={audioLevel}
            onStartRecording={onStartRecording}
            onStopRecording={handleStopRecording}
            onPauseRecording={onPauseRecording}
            onResumeRecording={onResumeRecording}
          />
        )
      case 'transcription':
        return (
          <TranscriptionDisplay
            recording={selectedRecording || currentRecording!}
            patientImage={patientImage}
            onEdit={() => setCurrentView('recording')}
            onSave={() => console.log('Save recording')}
            onNewRecording={handleStartNewRecording}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentView !== 'recording' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentView('recording')}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            <SparklesText
              text="Fluxo Scribe"
              className="text-lg"
              sparklesCount={4}
              align="left"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView('list')}
              className={`h-8 w-8 ${currentView === 'list' ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <Menu className="h-4 w-4" />
            </Button>

            <Sheet open={isNotesSheetOpen} onOpenChange={setIsNotesSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${isNotesSheetOpen ? 'bg-blue-100 text-blue-600' : ''}`}
                  disabled={!currentRecording?.transcription && !selectedRecording}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-96 p-0">
                <MedicalNotesPanel
                  recording={selectedRecording || currentRecording}
                  transcriptionText={selectedRecording?.transcription || currentRecording?.transcription}
                  lastSaved="a minute ago"
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-center gap-8">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('list')}
            className={`flex-1 py-3 ${currentView === 'list' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <div className="text-center">
              <Menu className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs">Recordings</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setCurrentView('recording')}
            className={`flex-1 py-3 ${currentView === 'recording' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <div className="text-center">
              <div className={`w-5 h-5 rounded-full mx-auto mb-1 ${isRecording ? 'bg-red-500' : 'border-2 border-current'}`} />
              <span className="text-xs">Record</span>
            </div>
          </Button>

          <Sheet open={isNotesSheetOpen} onOpenChange={setIsNotesSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className={`flex-1 py-3 ${isNotesSheetOpen ? 'text-blue-600' : 'text-gray-500'}`}
                disabled={!currentRecording?.transcription && !selectedRecording}
              >
                <div className="text-center">
                  <Settings className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-xs">Notes</span>
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <MedicalNotesPanel
                recording={selectedRecording || currentRecording}
                transcriptionText={selectedRecording?.transcription || currentRecording?.transcription}
                lastSaved="a minute ago"
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}