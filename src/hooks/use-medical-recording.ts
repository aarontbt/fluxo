"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { createSonioxService, SonioxTranscriptionService, TranscriptionResult } from '@/lib/soniox-service'
import { sendToN8n } from '@/lib/n8n-service'

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
  const sonioxServiceRef = useRef<SonioxTranscriptionService | null>(null)
  const accumulatedSegmentsRef = useRef<Array<{speaker: number | null; text: string}>>([])
  const finalTranscriptionRef = useRef<string>('')
  
  // Token-based accumulation - like Soniox playground
  const finalTokensRef = useRef<Array<{text: string; speaker?: string}>>([])
  const lastReceivedTextRef = useRef<string>('')
  
  // Track recent speakers for live display (only show 2 most recent)
  const recentSpeakersRef = useRef<string[]>([]) // Track speaker order

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
      // Reset token-based tracking
      finalTokensRef.current = []
      lastReceivedTextRef.current = ''
      // Reset recent speakers tracking
      recentSpeakersRef.current = []
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
        console.log('🚀 STARTING SONIOX TRANSCRIPTION')
        setIsTranscribing(true)
        
        let allSegments: Array<{speaker: number | null; text: string}> = [] // Preserve chronological segments
        
        await sonioxServiceRef.current.startRecording(
          // On partial result - may contain revisions or partial updates
          (result: TranscriptionResult) => {
            console.log('🔵 PARTIAL RESULT:', {
              text: result.text,
              textLength: result.text.length,
              tokensCount: result.tokens?.length || 0,
              finalTokensCount: finalTokensRef.current.length,
              speakerSegmentsCount: result.speakerSegments?.length || 0,
              rawSpeakerSegments: result.speakerSegments
            })
            
            // Debug speaker data in tokens
            if (result.tokens && result.tokens.length > 0) {
              const speakerInfo = result.tokens.map(token => ({
                text: token.text.substring(0, 10) + '...',
                speaker: token.speaker,
                is_final: token.is_final
              }))
              console.log('🎤 TOKEN SPEAKERS:', {
                totalTokens: result.tokens.length,
                uniqueSpeakers: [...new Set(result.tokens.map(t => t.speaker).filter(s => s !== undefined))],
                speakerBreakdown: speakerInfo.slice(0, 5) // First 5 tokens
              })
            }
            
            // Variable to hold live display text for the sidebar
            let liveFormattedText = ''
            
            // Token-based accumulation (like Soniox playground)
            if (result.tokens && result.tokens.length > 0) {
              // Separate final and non-final tokens
              const newFinalTokens: Array<{text: string; speaker?: string}> = []
              let nonFinalText = ''
              
              for (const token of result.tokens) {
                if (token.is_final) {
                  newFinalTokens.push({
                    text: token.text,
                    speaker: token.speaker
                  })
                } else {
                  nonFinalText += token.text
                }
              }
              
              // Append new final tokens to our permanent collection
              if (newFinalTokens.length > 0) {
                finalTokensRef.current.push(...newFinalTokens)
                
                // Update recent speakers tracking for live display
                newFinalTokens.forEach(token => {
                  if (token.speaker) {
                    const speakerId = token.speaker
                    // Remove speaker if already in list
                    recentSpeakersRef.current = recentSpeakersRef.current.filter(s => s !== speakerId)
                    // Add to front (most recent)
                    recentSpeakersRef.current.unshift(speakerId)
                    // Keep only 2 most recent speakers
                    recentSpeakersRef.current = recentSpeakersRef.current.slice(0, 2)
                  }
                })
                
                console.log('✅ NEW FINAL TOKENS:', {
                  count: newFinalTokens.length,
                  totalFinal: finalTokensRef.current.length,
                  sample: newFinalTokens.slice(0, 3).map(t => t.text).join(''),
                  speakers: [...new Set(newFinalTokens.map(t => t.speaker).filter(s => s !== undefined))],
                  allFinalSpeakers: [...new Set(finalTokensRef.current.map(t => t.speaker).filter(s => s !== undefined))],
                  recentSpeakers: recentSpeakersRef.current
                })
              }
              
              // Build complete transcription from final tokens + current non-final
              const finalText = finalTokensRef.current.map(t => t.text).join('')
              const completeText = finalText + nonFinalText
              
              // Format with speaker labels if available
              let formattedText = completeText
              if (finalTokensRef.current.some(t => t.speaker)) {
                // Group by speaker for formatting
                const segments: Array<{speaker: string | undefined; text: string}> = []
                let currentSpeaker: string | undefined = undefined
                let currentText = ''
                
                for (const token of finalTokensRef.current) {
                  if (token.speaker !== currentSpeaker && currentText) {
                    segments.push({ speaker: currentSpeaker, text: currentText })
                    currentText = ''
                  }
                  currentSpeaker = token.speaker
                  currentText += token.text
                }
                if (currentText) {
                  segments.push({ speaker: currentSpeaker, text: currentText })
                }
                if (nonFinalText) {
                  segments.push({ speaker: undefined, text: nonFinalText })
                }
                
                formattedText = segments.map(s => 
                  s.speaker ? `[Speaker ${s.speaker}] ${s.text}` : s.text
                ).join(' ')
              }
              
              // Store full transcription internally
              finalTranscriptionRef.current = formattedText
              
              // For live display in sidebar, show only content from 2 most recent speakers
              const recentSpeakersSet = new Set(recentSpeakersRef.current)
              console.log('🎯 FILTERING LIVE DISPLAY:', {
                recentSpeakers: recentSpeakersRef.current,
                totalFinalTokens: finalTokensRef.current.length
              })
              
              // Filter final tokens to only include recent speakers
              const recentSpeakerTokens = finalTokensRef.current.filter(token => 
                !token.speaker || recentSpeakersSet.has(token.speaker)
              )
              
              // Build live display from filtered tokens + non-final
              const recentFinalText = recentSpeakerTokens.slice(-15).map(t => t.text).join('') // Last 15 tokens from recent speakers
              const liveDisplayText = recentFinalText + nonFinalText
              
              // Format with speaker segments for recent speakers only
              if (recentSpeakerTokens.some(t => t.speaker)) {
                const segments: Array<{speaker: string | undefined; text: string}> = []
                let currentSpeaker: string | undefined = undefined
                let currentText = ''
                
                // Build segments from filtered tokens
                const tokensToProcess = [...recentSpeakerTokens.slice(-15)] // Recent tokens from recent speakers
                if (nonFinalText) {
                  // Add non-final text with current speaker context
                  const lastSpeaker = tokensToProcess[tokensToProcess.length - 1]?.speaker
                  tokensToProcess.push({ text: nonFinalText, speaker: lastSpeaker })
                }
                
                for (const token of tokensToProcess) {
                  if (token.speaker !== currentSpeaker && currentText) {
                    segments.push({ speaker: currentSpeaker, text: currentText })
                    currentText = ''
                  }
                  currentSpeaker = token.speaker
                  currentText += token.text
                }
                if (currentText) {
                  segments.push({ speaker: currentSpeaker, text: currentText })
                }
                
                // Format only recent speaker segments
                liveFormattedText = segments
                  .filter(s => !s.speaker || recentSpeakersSet.has(s.speaker))
                  .map(s => s.speaker ? `[Speaker ${s.speaker}] ${s.text}` : s.text)
                  .join(' ')
                  
                console.log('🎯 LIVE DISPLAY FORMATTED:', {
                  segmentCount: segments.length,
                  filteredSegments: segments.filter(s => !s.speaker || recentSpeakersSet.has(s.speaker)).length,
                  preview: liveFormattedText.substring(0, 100) + '...'
                })
              } else {
                liveFormattedText = liveDisplayText
              }
              
              setLiveTranscription(liveFormattedText)
              
              console.log('📝 TOKEN-BASED TRANSCRIPTION:', {
                finalTokens: finalTokensRef.current.length,
                nonFinalLength: nonFinalText.length,
                totalLength: formattedText.length,
                preview: formattedText.substring(0, 100) + '...'
              })
            } else {
              // Fallback to text if no tokens
              setLiveTranscription(result.text)
              if (!finalTokensRef.current.length) {
                finalTranscriptionRef.current = result.text
              }
            }
            
            lastReceivedTextRef.current = result.text
            
            // Accumulate speaker segments by speaker
            if (result.speakerSegments && result.speakerSegments.length > 0) {
              console.log('🎤 SPEAKER SEGMENTS RECEIVED:', {
                count: result.speakerSegments.length,
                speakers: result.speakerSegments.map(s => s.speaker),
                uniqueSpeakers: [...new Set(result.speakerSegments.map(s => s.speaker))],
                segments: result.speakerSegments.map(s => ({
                  speaker: s.speaker,
                  textLength: s.text.length,
                  textPreview: s.text.substring(0, 50) + '...'
                }))
              })
              
              // Replace with new segments (Soniox provides complete current state)
              allSegments = result.speakerSegments.map(segment => ({
                speaker: segment.speaker,
                text: segment.text
              }))
              
              console.log('📝 UPDATING ALL SPEAKER SEGMENTS:', {
                newSegmentCount: allSegments.length,
                speakers: allSegments.map(s => s.speaker),
                segmentPreviews: allSegments.map((s, i) => ({
                  index: i,
                  speaker: s.speaker,
                  textPreview: s.text.substring(0, 30) + '...'
                }))
              })
              
              accumulatedSegmentsRef.current = allSegments
              
              console.log('📊 ACCUMULATED SEGMENTS:', {
                totalSegments: accumulatedSegmentsRef.current.length,
                speakers: accumulatedSegmentsRef.current.map(s => s.speaker),
                uniqueSpeakers: [...new Set(accumulatedSegmentsRef.current.map(s => s.speaker))]
              })
            }
            
            // Update current recording with the best data we have
            setCurrentRecording(prev => {
              const bestTranscription = finalTranscriptionRef.current || result.text
              console.log('📝 UPDATING RECORDING:', {
                live: liveFormattedText?.substring(0, 50) + '...',
                best: bestTranscription?.substring(0, 50) + '...',
                finalRef: finalTranscriptionRef.current?.substring(0, 50) + '...'
              })
              return prev ? {
                ...prev,
                liveTranscription: liveFormattedText || result.text, // Show only recent content in live
                transcription: bestTranscription, // Keep full transcription for saved recording
                speakerSegments: accumulatedSegmentsRef.current.length > 0 
                  ? accumulatedSegmentsRef.current 
                  : result.speakerSegments || prev.speakerSegments
              } : null
            })
          },
          // On finished - streaming ended, keep accumulated transcription
          (result: TranscriptionResult) => {
            console.log('🟢 FINAL RESULT:', {
              text: result.text,
              textLength: result.text?.length || 0,
              speakerSegments: result.speakerSegments?.length || 0,
              finalTokensCount: finalTokensRef.current.length,
              finalSpeakerSegments: result.speakerSegments,
              finalUniqueSpeakers: result.speakerSegments ? [...new Set(result.speakerSegments.map(s => s.speaker))] : []
            })
            
            // Debug final tokens speaker data
            if (result.tokens && result.tokens.length > 0) {
              console.log('🎤 FINAL TOKEN SPEAKERS:', {
                totalTokens: result.tokens.length,
                uniqueSpeakers: [...new Set(result.tokens.map(t => t.speaker).filter(s => s !== undefined))],
                speakerDistribution: result.tokens.reduce((acc, token) => {
                  const speaker = token.speaker || 'undefined'
                  acc[speaker] = (acc[speaker] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              })
            }
            
            // Process any remaining tokens if provided
            if (result.tokens && result.tokens.length > 0) {
              // All tokens should be final now
              const remainingFinalTokens = result.tokens
                .filter(t => t.is_final && !finalTokensRef.current.some(ft => ft.text === t.text))
                .map(t => ({ text: t.text, speaker: t.speaker }))
              
              if (remainingFinalTokens.length > 0) {
                finalTokensRef.current.push(...remainingFinalTokens)
                console.log('✅ FINAL TOKENS ADDED:', remainingFinalTokens.length)
              }
            }
            
            // Build final transcription from all final tokens with proper speaker formatting
            let bestTranscription = ''
            
            if (finalTokensRef.current.length > 0) {
              // Group tokens by speaker for proper formatting
              const segments: Array<{speaker: string | undefined; text: string}> = []
              let currentSpeaker: string | undefined = undefined
              let currentText = ''
              
              for (const token of finalTokensRef.current) {
                if (token.speaker !== currentSpeaker && currentText) {
                  segments.push({ speaker: currentSpeaker, text: currentText.trim() })
                  currentText = ''
                }
                currentSpeaker = token.speaker
                currentText += token.text
              }
              if (currentText) {
                segments.push({ speaker: currentSpeaker, text: currentText.trim() })
              }
              
              // Format with speaker labels
              bestTranscription = segments.map(s => 
                s.speaker ? `[Speaker ${s.speaker}] ${s.text}` : s.text
              ).join('\n')
            } else {
              bestTranscription = result.text
            }
            
            // Update finalTranscriptionRef with the complete formatted text
            finalTranscriptionRef.current = bestTranscription
            
            console.log('📊 FINAL TRANSCRIPTION:', {
              finalTokensCount: finalTokensRef.current.length,
              resultLength: result.text?.length || 0,
              using: finalTokensRef.current.length > 0 ? 'tokens' : 'text',
              preview: bestTranscription?.substring(0, 100) + '...'
            })
            
            // Final segments update for speaker segments display
            const speakerSegments: Array<{speaker: number | null; text: string}> = []
            if (finalTokensRef.current.length > 0) {
              // Build speaker segments from our final tokens
              let currentSpeaker: string | undefined = undefined
              let currentText = ''
              
              console.log('🔧 BUILDING FINAL SPEAKER SEGMENTS FROM TOKENS:', {
                totalTokens: finalTokensRef.current.length,
                uniqueSpeakers: [...new Set(finalTokensRef.current.map(t => t.speaker).filter(s => s !== undefined))]
              })
              
              for (const token of finalTokensRef.current) {
                if (token.speaker !== currentSpeaker && currentText) {
                  const segment = { 
                    speaker: currentSpeaker ? parseInt(currentSpeaker) : null, 
                    text: currentText.trim() 
                  }
                  speakerSegments.push(segment)
                  console.log('➕ ADDED SPEAKER SEGMENT:', {
                    speaker: segment.speaker,
                    textLength: segment.text.length,
                    textPreview: segment.text.substring(0, 30) + '...'
                  })
                  currentText = ''
                }
                currentSpeaker = token.speaker
                currentText += token.text
              }
              if (currentText) {
                const segment = { 
                  speaker: currentSpeaker ? parseInt(currentSpeaker) : null, 
                  text: currentText.trim() 
                }
                speakerSegments.push(segment)
                console.log('➕ ADDED FINAL SPEAKER SEGMENT:', {
                  speaker: segment.speaker,
                  textLength: segment.text.length,
                  textPreview: segment.text.substring(0, 30) + '...'
                })
              }
              
              console.log('✅ FINAL SPEAKER SEGMENTS BUILT:', {
                totalSegments: speakerSegments.length,
                speakers: speakerSegments.map(s => s.speaker),
                uniqueSpeakers: [...new Set(speakerSegments.map(s => s.speaker))]
              })
              
              accumulatedSegmentsRef.current = speakerSegments
                
               console.log('🎯 FINAL SEGMENTS SET TO ACCUMULATED REF:', {
                 segmentCount: accumulatedSegmentsRef.current.length,
                 segments: accumulatedSegmentsRef.current.map((s, i) => ({
                   index: i,
                   speaker: s.speaker,
                   textLength: s.text.length,
                   textPreview: s.text.substring(0, 30) + '...'
                 }))
               })
             } else if (result.speakerSegments && result.speakerSegments.length > 0) {
              console.log('🎤 FINAL SPEAKER SEGMENTS FROM API:', {
                count: result.speakerSegments.length,
                speakers: result.speakerSegments.map(s => s.speaker),
                uniqueSpeakers: [...new Set(result.speakerSegments.map(s => s.speaker))],
                segments: result.speakerSegments.map(s => ({
                  speaker: s.speaker,
                  textLength: s.text.length,
                  textPreview: s.text.substring(0, 50) + '...'
                }))
              })
              allSegments = result.speakerSegments.map(segment => ({
                speaker: segment.speaker,
                text: segment.text
              }))
              accumulatedSegmentsRef.current = allSegments
              
              console.log('📊 FINAL ACCUMULATED SEGMENTS:', {
                totalSegments: accumulatedSegmentsRef.current.length,
                speakers: accumulatedSegmentsRef.current.map(s => s.speaker),
                uniqueSpeakers: [...new Set(accumulatedSegmentsRef.current.map(s => s.speaker))]
              })
            }
            
            // Set final transcription with what we've accumulated
            console.log('📄 FINAL TRANSCRIPTION SAVED:', {
              text: bestTranscription,
              segments: accumulatedSegmentsRef.current.length,
              length: bestTranscription?.length || 0
            })
            
            // Update currentRecording with complete final data
            setCurrentRecording(prev => {
              return prev ? {
                ...prev,
                transcription: bestTranscription,
                speakerSegments: accumulatedSegmentsRef.current.length > 0 
                  ? accumulatedSegmentsRef.current 
                  : speakerSegments,  // Use the properly built segments if accumulated is empty
                liveTranscription: ''
              } : null
            })
            
            // IMPORTANT: Update the accumulated segments with the properly built ones for stopRecording
            if (speakerSegments.length > 0) {
              accumulatedSegmentsRef.current = speakerSegments
              console.log('🔧 UPDATED ACCUMULATED SEGMENTS WITH BUILT SEGMENTS:', {
                count: speakerSegments.length,
                uniqueSpeakers: [...new Set(speakerSegments.map(s => s.speaker))]
              })
            }
            
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

  const stopRecording = useCallback(async (sessionNotes?: {timestamp: string, note: string}[]) => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 STOPPING RECORDING')
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      setAudioLevel(0)

      // Stop Soniox transcription and wait for final result
      if (sonioxServiceRef.current) {
        console.log('🛑 STOPPING SONIOX TRANSCRIPTION')
        await sonioxServiceRef.current.stopRecording()
        setIsTranscribing(false)
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }

      // Wait a bit to ensure final result callback has been processed
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (currentRecording) {
        // Make sure we have the final accumulated transcription and segments
        const finalRecording = {
          ...currentRecording,
          duration,
          sessionNotes,
          isProcessing: true,
          transcription: finalTranscriptionRef.current || currentRecording.transcription,
          speakerSegments: accumulatedSegmentsRef.current.length > 0 
            ? accumulatedSegmentsRef.current 
            : currentRecording.speakerSegments
        }
        
        console.log('🏁 FINAL RECORDING BEFORE PROCESSING (AFTER WAIT):', {
          transcriptionLength: finalRecording.transcription?.length || 0,
          transcriptionPreview: finalRecording.transcription?.substring(0, 100) + '...',
          speakerSegmentsCount: finalRecording.speakerSegments?.length || 0,
          finalTranscriptionRefLength: finalTranscriptionRef.current?.length || 0,
          currentRecordingTranscriptionLength: currentRecording.transcription?.length || 0,
          accumulatedSegmentsCount: accumulatedSegmentsRef.current.length
        })
        
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
    console.log('🔄 PROCESSING RECORDING INPUT:', {
      transcriptionLength: recording.transcription?.length || 0,
      transcriptionPreview: recording.transcription?.substring(0, 100) + '...',
      speakerSegmentsCount: recording.speakerSegments?.length || 0,
      hasTranscription: !!recording.transcription
    })
    
    // Keep the real transcription from Soniox, just mark as processed
    const processedRecording: MedicalRecording = {
      ...recording,
      isProcessing: false
    }

    // Only generate medical notes if we have a transcription
    if (recording.transcription) {
      // In a real app, this would call an AI service to generate SOAP notes
      // Enhanced medical notes structure with detailed fields
      processedRecording.medicalNotes = {
        subjective: {
          chiefComplaint: "[Chief complaint would be extracted from transcription]",
          history: "[Medical history would be derived from the conversation]"
        },
        objective: "[Physical examination findings would be documented]",
        assessment: "[Clinical assessment would be derived from the conversation]",
        plan: {
          medications: "[Prescribed medications would be listed]",
          procedures: "[Recommended procedures would be documented]",
          followUp: "[Follow-up instructions would be provided]"
        },
        ros: {
          cardiovascular: "[Cardiovascular review would be noted]",
          respiratory: "[Respiratory review would be documented]",
          musculoskeletal: "[Musculoskeletal findings would be recorded]"
        }
      }
    }

    console.log('✅ PROCESSING RECORDING OUTPUT:', {
      transcriptionLength: processedRecording.transcription?.length || 0,
      transcriptionPreview: processedRecording.transcription?.substring(0, 100) + '...',
      speakerSegmentsCount: processedRecording.speakerSegments?.length || 0,
      hasTranscription: !!processedRecording.transcription,
      isProcessing: processedRecording.isProcessing
    })
    
    setCurrentRecording(processedRecording)
    setRecordings(prev => [processedRecording, ...prev])

    // Send transcription and medical notes to n8n endpoint
    if (processedRecording.transcription) {
      try {
        const n8nAnalysis = await sendToN8n({
          transcription: processedRecording.transcription,
          sessionNotes: processedRecording.sessionNotes,
          medicalNotes: processedRecording.medicalNotes
        })
        
        // Update recording with n8n analysis if received
        if (n8nAnalysis) {
          processedRecording.n8nAnalysis = n8nAnalysis
          setCurrentRecording(processedRecording)
          setRecordings(prev => [processedRecording, ...prev.slice(1)])
        }
      } catch (error) {
        console.error('Failed to send data to n8n:', error)
        // Continue with normal processing even if n8n fails
      }
    }
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