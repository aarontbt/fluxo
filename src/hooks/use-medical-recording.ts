"use client"

import { useState, useRef, useCallback, useEffect } from 'react'

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
  isProcessing: boolean
}

interface UseMedicalRecordingReturn {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioLevel: number
  currentRecording: MedicalRecording | null
  recordings: MedicalRecording[]
  startRecording: (patientName: string) => Promise<void>
  stopRecording: (sessionNotes?: {timestamp: string, note: string}[]) => Promise<void>
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
  const [recordings, setRecordings] = useState<MedicalRecording[]>([
    {
      id: '1',
      patientName: 'Jen Garcia',
      date: 'July 30',
      time: '12:01pm',
      duration: 332, // 5:32
      transcription: "Patient presents with lower back pain for 3 days. Started at new gym doing Pilates. Pain worsened during movement. Patient was able to drive home and crawl to front door. Pain is sharp and stabbing.",
      sessionNotes: [
        {
          timestamp: '1:09:44 AM',
          note: 'I want to add my notes...'
        },
        {
          timestamp: '1:09:52 AM',
          note: 'I like Macdonals..'
        }
      ],
      medicalNotes: {
        subjective: {
          chiefComplaint: "Jen presents today for back pain.",
          history: "Jen states that she's been experiencing lower back pain for 3 days now as she recently started at a new gym and threw her back out during pilates when she was doing a move in class but heard a popping noise in her back. She was barely able to drive home and crawl to the front door and then passed out from the pain."
        },
        objective: "Vital signs stable. Patient ambulating with difficulty. Range of motion limited due to pain.",
        assessment: "Acute lower back pain, likely muscle strain from new exercise regimen.",
        plan: {
          medications: "Pain management with NSAIDs",
          procedures: "No procedures needed at this time",
          followUp: "Follow-up in 1 week. Refer to physical therapy if no improvement."
        },
        ros: {
          cardiovascular: "chest pain",
          respiratory: "shortness of breath", 
          musculoskeletal: "back pain"
        }
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

  const startRecording = useCallback(async (patientName: string) => {
    try {
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

    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }, [currentRecording, isRecording, isPaused])

  const stopRecording = useCallback(async (sessionNotes?: {timestamp: string, note: string}[]) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      setAudioLevel(0)

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }

      if (currentRecording) {
        const finalRecording = {
          ...currentRecording,
          duration,
          sessionNotes,
          isProcessing: true
        }
        setCurrentRecording(finalRecording)
        
        // Simulate processing delay
        setTimeout(() => {
          processRecording(finalRecording)
        }, 2000)
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
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const processedRecording: MedicalRecording = {
      ...recording,
      transcription: "Patient presents with persistent lower back pain for 3 days. Pain started after beginning new exercise routine at gym during Pilates class. Patient heard popping sound and experienced immediate severe pain. Was barely able to drive home, had to crawl to front door due to pain severity. Pain is described as sharp and stabbing, limiting mobility significantly.",
      medicalNotes: {
        subjective: {
          chiefComplaint: "Jen presents today for persistent severe lower back pain.",
          history: "Patient reports onset of lower back pain 3 days ago while attending new gym. Pain began during Pilates class when patient heard audible 'pop' in back. Severity of pain required crawling to enter home. Patient describes pain as sharp and stabbing."
        },
        objective: "Patient ambulating with visible discomfort. Range of motion testing limited by pain. Vital signs within normal limits.",
        assessment: "Acute lumbar strain, likely related to new exercise activity. Rule out disc injury given mechanism and severity.",
        plan: {
          medications: "NSAIDs for pain management",
          procedures: "Activity modification - avoid aggravating movements", 
          followUp: "Follow-up in 1 week. Physical therapy referral if no improvement. Consider imaging if symptoms persist"
        },
        ros: {
          cardiovascular: "chest pain",
          respiratory: "shortness of breath",
          musculoskeletal: "back pain"
        }
      },
      isProcessing: false
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
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    processRecording,
    saveRecording,
  }
}