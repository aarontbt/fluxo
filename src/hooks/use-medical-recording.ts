"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { createSonioxService, SonioxTranscriptionService, TranscriptionResult } from '@/lib/soniox-service'

// Constants
export const PROCESSING_DELAY_MS = 2000 // 2 seconds for processing

interface MedicalRecording {
  id: string
  patientName: string
  date: string
  time: string
  duration: number
  audioBlob?: Blob
  transcription?: string
  liveTranscription?: string
  speakerSegments?: Array<{
    speaker: number | null
    text: string
  }>
  medicalNotes?: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
  isProcessing: boolean
}

interface UseMedicalRecordingReturn {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioLevel: number
  currentRecording: MedicalRecording | null
  recordings: MedicalRecording[]
  liveTranscription: string
  transcriptionError: string | null
  isTranscribing: boolean
  startRecording: (patientName: string) => Promise<void>
  stopRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  processRecording: (recording: MedicalRecording) => Promise<void>
  saveRecording: (recording: MedicalRecording) => void
}

export function useMedicalRecording(): UseMedicalRecordingReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [currentRecording, setCurrentRecording] = useState<MedicalRecording | null>(null)
  const [liveTranscription, setLiveTranscription] = useState('')
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordings, setRecordings] = useState<MedicalRecording[]>([
    {
      id: '1',
      patientName: 'Jen Garcia',
      date: 'July 30',
      time: '12:01pm',
      duration: 332, // 5:32
      transcription: "Patient presents with lower back pain for 3 days. Started at new gym doing Pilates. Pain worsened during movement. Patient was able to drive home and crawl to front door. Pain is sharp and stabbing.",
      medicalNotes: {
        subjective: "Chief Complaint: Jen presents today for back pain. Jen states that she's been experiencing lower back pain for 3 days now as she recently started at a new gym and threw her back out during pilates when she was doing a move in class but heard a popping noise in her back. She was barely able to drive home and crawl to the front door and then passed out from the pain.",
        objective: "Vital signs stable. Patient ambulating with difficulty. Range of motion limited due to pain.",
        assessment: "Acute lower back pain, likely muscle strain from new exercise regimen.",
        plan: "Pain management with NSAIDs, rest, and follow-up in 1 week. Refer to physical therapy if no improvement."
      },
      isProcessing: false
    },
    {
      id: '2',
      patientName: 'Jen Garcia', 
      date: 'July 30',
      time: '12:16pm',
      duration: 201, // 3:21
      transcription: "Treatment plan discussion. Continued pain management. Patient reports slight improvement with current medication.",
      isProcessing: false
    }
  ])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedDurationRef = useRef<number>(0)
  const sonioxServiceRef = useRef<SonioxTranscriptionService | null>(null)
  const accumulatedSegmentsRef = useRef<Array<{speaker: number | null; text: string}>>([])
  const finalTranscriptionRef = useRef<string>('')

  // Initialize Soniox service on mount (client-side only)
  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      const service = createSonioxService()
      if (service) {
        sonioxServiceRef.current = service
      } else if (!process.env.NEXT_PUBLIC_SONIOX_API_KEY) {
        setTranscriptionError('Soniox API key not configured. Please set NEXT_PUBLIC_SONIOX_API_KEY in your .env file')
      }
    }

    return () => {
      // Cleanup on unmount
      if (sonioxServiceRef.current) {
        sonioxServiceRef.current.stopRecording()
      }
    }
  }, [])

  const startRecording = useCallback(async (patientName: string) => {
    try {
      setTranscriptionError(null)
      setLiveTranscription('')
      setIsTranscribing(false)
      // Reset accumulated transcription
      accumulatedSegmentsRef.current = []
      finalTranscriptionRef.current = ''
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })

      audioStreamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        if (currentRecording) {
          setCurrentRecording(prev => prev ? { ...prev, audioBlob } : null)
        }
      }

      const newRecording: MedicalRecording = {
        id: Date.now().toString(),
        patientName,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        duration: 0,
        isProcessing: false
      }

      setCurrentRecording(newRecording)
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      setDuration(0)
      startTimeRef.current = Date.now()

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000)
          setDuration(elapsed)
        }
      }, 1000)

      // Start audio level monitoring
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      analyser.fftSize = 256
      source.connect(analyser)

      const updateAudioLevel = () => {
        if (isRecording && !isPaused) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
          setAudioLevel(average / 255)
          requestAnimationFrame(updateAudioLevel)
        }
      }
      updateAudioLevel()

      // Start Soniox transcription if available
      if (sonioxServiceRef.current) {
        setIsTranscribing(true)
        
        let lastConfirmedText = '' // Track the last confirmed full text
        let allSegmentsMap = new Map() // Use Map to accumulate unique segments
        
        await sonioxServiceRef.current.startRecording(
          // On partial result - may contain revisions or partial updates
          (result: TranscriptionResult) => {
            // Show current partial as live transcription
            setLiveTranscription(result.text)
            
            // Strategy: Only update if we have MORE content than before
            // This prevents losing content when Soniox sends partial revisions
            if (result.text && result.text.length > lastConfirmedText.length) {
              finalTranscriptionRef.current = result.text
              lastConfirmedText = result.text
            }
            
            // Accumulate speaker segments by speaker
            if (result.speakerSegments && result.speakerSegments.length > 0) {
              result.speakerSegments.forEach(segment => {
                const key = `speaker-${segment.speaker}`
                const existing = allSegmentsMap.get(key)
                // Keep the longer text for each speaker
                if (!existing || segment.text.length > existing.text.length) {
                  allSegmentsMap.set(key, segment)
                }
              })
              accumulatedSegmentsRef.current = Array.from(allSegmentsMap.values())
            }
            
            // Update current recording with the best data we have
            setCurrentRecording(prev => {
              const bestTranscription = finalTranscriptionRef.current || result.text
              return prev ? {
                ...prev,
                liveTranscription: result.text,
                transcription: bestTranscription,
                speakerSegments: accumulatedSegmentsRef.current.length > 0 
                  ? accumulatedSegmentsRef.current 
                  : result.speakerSegments || prev.speakerSegments
              } : null
            })
          },
          // On finished - streaming ended, keep accumulated transcription
          (result: TranscriptionResult) => {
            // Don't overwrite with empty final result!
            if (result.text && result.text.trim().length > 0) {
              // Only update if final has actual content
              if (result.text.length > finalTranscriptionRef.current.length) {
                finalTranscriptionRef.current = result.text
              }
            }
            
            // Final segments update
            if (result.speakerSegments && result.speakerSegments.length > 0) {
              // Only update if we get actual segments
              result.speakerSegments.forEach(segment => {
                const key = `speaker-${segment.speaker}`
                allSegmentsMap.set(key, segment)
              })
              accumulatedSegmentsRef.current = Array.from(allSegmentsMap.values())
            }
            
            // Set final transcription with what we've accumulated
            setCurrentRecording(prev => {
              return prev ? {
                ...prev,
                transcription: finalTranscriptionRef.current,
                speakerSegments: accumulatedSegmentsRef.current,
                liveTranscription: ''
              } : null
            })
            
            setLiveTranscription('')
            setIsTranscribing(false)
          },
          // On error
          (errorMessage: string) => {
            setTranscriptionError(errorMessage)
            setIsTranscribing(false)
          }
        )
      }

    } catch (error) {
      console.error('Error starting recording:', error)
      setTranscriptionError(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [currentRecording, isRecording, isPaused])

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      setAudioLevel(0)

      // Stop Soniox transcription
      if (sonioxServiceRef.current) {
        await sonioxServiceRef.current.stopRecording()
        setIsTranscribing(false)
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }

      if (currentRecording) {
        // Make sure we have the final accumulated transcription
        const finalRecording = {
          ...currentRecording,
          duration,
          isProcessing: true,
          transcription: finalTranscriptionRef.current || currentRecording.transcription,
          speakerSegments: accumulatedSegmentsRef.current.length > 0 
            ? accumulatedSegmentsRef.current 
            : currentRecording.speakerSegments
        }
        
        setCurrentRecording(finalRecording)
        
        // Simulate processing delay
        setTimeout(() => {
          processRecording(finalRecording)
        }, PROCESSING_DELAY_MS)
      }

      pausedDurationRef.current = 0
    }
  }, [isRecording, currentRecording, duration])

  const pauseRecording = useCallback(() => {
    if (isRecording && !isPaused) {
      setIsPaused(true)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.pause()
      }
    }
  }, [isRecording, isPaused])

  const resumeRecording = useCallback(() => {
    if (isRecording && isPaused) {
      setIsPaused(false)
      if (mediaRecorderRef.current?.state === 'paused') {
        mediaRecorderRef.current.resume()
      }
    }
  }, [isRecording, isPaused])

  const processRecording = useCallback(async (recording: MedicalRecording) => {
    // Keep the real transcription from Soniox, just mark as processed
    const processedRecording: MedicalRecording = {
      ...recording,
      isProcessing: false
    }

    // Only generate medical notes if we have a transcription
    if (recording.transcription) {
      // In a real app, this would call an AI service to generate SOAP notes
      // For now, we'll just mark it as processed
      processedRecording.medicalNotes = {
        subjective: "[Medical notes would be generated from the transcription]",
        objective: "[Objective findings would be extracted]",
        assessment: "[Assessment would be derived from the conversation]",
        plan: "[Treatment plan would be suggested based on discussion]"
      }
    }

    setCurrentRecording(processedRecording)
    setRecordings(prev => [processedRecording, ...prev])
  }, [])

  const saveRecording = useCallback((recording: MedicalRecording) => {
    setRecordings(prev => {
      const index = prev.findIndex(r => r.id === recording.id)
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = recording
        return updated
      }
      return [recording, ...prev]
    })
  }, [])

  return {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    currentRecording,
    recordings,
    liveTranscription,
    transcriptionError,
    isTranscribing,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    processRecording,
    saveRecording,
  }
}