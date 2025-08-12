import { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

export class AudioTestHelper {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Mock getUserMedia to play audio from a WAV file
   */
  async injectAudioFile(audioFileName: string) {
    const audioPath = path.join(__dirname, 'fixtures', audioFileName)
    
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Test audio file not found: ${audioPath}`)
    }

    const audioBuffer = fs.readFileSync(audioPath)
    const audioBase64 = audioBuffer.toString('base64')

    await this.page.addInitScript((audioBase64: string) => {
      // Convert base64 to ArrayBuffer
      function base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64)
        const len = binaryString.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes.buffer
      }

      const audioArrayBuffer = base64ToArrayBuffer(audioBase64)

      // Override getUserMedia
      navigator.mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints) => {
        if (!constraints.audio) {
          return new MediaStream()
        }

        try {
          // Create AudioContext and decode the audio
          const audioContext = new AudioContext()
          const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer.slice(0))
          
          // Create audio source
          const source = audioContext.createBufferSource()
          source.buffer = audioBuffer
          
          // Create MediaStream destination
          const destination = audioContext.createMediaStreamDestination()
          source.connect(destination)
          
          // Start playback
          source.start(0)
          
          console.log(`🎵 Playing test audio: ${audioBuffer.duration.toFixed(1)}s`)
          
          return destination.stream
          
        } catch (error) {
          console.error('Failed to setup test audio:', error)
          throw new Error('Could not create audio stream from test file')
        }
      }
    }, audioBase64)
  }

  /**
   * Create a simple test WAV file if none exists (for development)
   */
  static createTestAudioFile(fileName: string, durationSeconds: number = 5) {
    const filePath = path.join(__dirname, 'fixtures', fileName)
    
    // Simple WAV file generation (mono, 16kHz)
    const sampleRate = 16000
    const numSamples = sampleRate * durationSeconds
    const numChannels = 1
    const bytesPerSample = 2
    
    // WAV header
    const buffer = Buffer.alloc(44 + numSamples * bytesPerSample)
    let offset = 0
    
    // RIFF header
    buffer.write('RIFF', offset); offset += 4
    buffer.writeUInt32LE(36 + numSamples * bytesPerSample, offset); offset += 4
    buffer.write('WAVE', offset); offset += 4
    
    // Format chunk
    buffer.write('fmt ', offset); offset += 4
    buffer.writeUInt32LE(16, offset); offset += 4 // PCM chunk size
    buffer.writeUInt16LE(1, offset); offset += 2  // Audio format (PCM)
    buffer.writeUInt16LE(numChannels, offset); offset += 2
    buffer.writeUInt32LE(sampleRate, offset); offset += 4
    buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, offset); offset += 4
    buffer.writeUInt16LE(numChannels * bytesPerSample, offset); offset += 2
    buffer.writeUInt16LE(bytesPerSample * 8, offset); offset += 2
    
    // Data chunk
    buffer.write('data', offset); offset += 4
    buffer.writeUInt32LE(numSamples * bytesPerSample, offset); offset += 4
    
    // Generate simple tone (speech-like frequency pattern)
    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate
      const frequency = 200 + 100 * Math.sin(time * 2 * Math.PI * 0.5) // Varying frequency
      const amplitude = 0.1 * Math.sin(time * Math.PI * 4) // Speech-like envelope
      const sample = Math.floor(amplitude * Math.sin(time * 2 * Math.PI * frequency) * 32767)
      buffer.writeInt16LE(sample, offset)
      offset += 2
    }
    
    fs.writeFileSync(filePath, buffer)
    console.log(`Created test audio file: ${filePath}`)
  }
}