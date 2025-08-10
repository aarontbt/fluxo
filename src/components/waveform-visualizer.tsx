"use client"

import { useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  isRecording: boolean
  audioLevel?: number
}

export function WaveformVisualizer({ isRecording, audioLevel = 0 }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Generate static waveform bars for demo
  const bars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    height: Math.random() * 100 + 20,
    isActive: i < 25, // First 25 bars are "active"
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const barWidth = canvas.width / bars.length
      const centerY = canvas.height / 2

      bars.forEach((bar, index) => {
        const x = index * barWidth
        let height = bar.height

        if (isRecording && bar.isActive) {
          height = height * (0.5 + audioLevel * 0.5) // Animate based on audio level
        }

        const y = centerY - height / 2
        
        ctx.fillStyle = bar.isActive ? '#ef4444' : '#6b7280'
        ctx.fillRect(x + 2, y, barWidth - 4, height)
      })
    }

    drawWaveform()
    
    if (isRecording) {
      const animationId = setInterval(drawWaveform, 50)
      return () => clearInterval(animationId)
    }
  }, [isRecording, audioLevel, bars])

  return (
    <div className="w-full flex justify-center py-8">
      <canvas
        ref={canvasRef}
        width={320}
        height={120}
        className="max-w-full"
      />
    </div>
  )
}