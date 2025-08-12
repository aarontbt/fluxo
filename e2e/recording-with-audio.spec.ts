import { test, expect } from '@playwright/test'
import { AudioTestHelper } from './audio-helper'

test.describe('Medical Recording with Real Audio', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone'])
    
    // Mock n8n webhook to return predictable SOAP notes
    await page.route('**/webhook/**', async route => {
      const request = route.request()
      const body = await request.postDataJSON()
      
      // Verify the payload structure
      expect(body).toHaveProperty('transcribe-input')
      expect(body['transcribe-input']).toBeTruthy()
      
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          output: {
            soa_markdown: `## Subjective
Patient presents with lower back pain for 3 days following exercise.

## Objective  
Patient appears uncomfortable, limited range of motion.

## Assessment
Acute lumbar strain, exercise-related injury.

## Plan
1. NSAIDs for pain management
2. Rest and avoid heavy lifting
3. Follow-up in 1 week`,
            risk_hypotheses: [
              'Possible muscle strain progression if not properly rested',
              'Risk of chronic pain if untreated'
            ],
            red_flags: [
              'Monitor for neurological symptoms',
              'Watch for worsening pain'
            ],
            next_visit_metrics: [
              'Pain scale improvement',
              'Range of motion assessment'
            ]
          }
        }])
      })
    })
  })

  test('complete recording flow with medical consultation audio', async ({ page }) => {
    const audioHelper = new AudioTestHelper(page)
    
    // Setup audio injection (you'll need to add medical-consultation.mp3 to fixtures/)
    await audioHelper.injectAudioFile('medical-consultation.mp3')
    
    await page.goto('/')
    
    // Start recording
    await page.fill('[data-testid="patient-name"]', 'John Smith')
    await page.click('[data-testid="start-recording"]')
    
    // Verify recording indicators appear
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="duration"]')).toBeVisible()
    
    // Wait for some transcription to appear (Soniox should start streaming)
    await expect(page.locator('[data-testid="live-transcription"]'))
      .toContainText(/patient|pain|back|doctor/i, { timeout: 15000 })
    
    console.log('✅ Live transcription detected')
    
    // Let it record for a bit to get meaningful transcription
    await page.waitForTimeout(8000)
    
    // Add a session note during recording
    await page.click('[data-testid="add-note"]')
    await page.fill('[data-testid="note-input"]', 'Patient shows signs of discomfort during examination')
    await page.keyboard.press('Enter')
    
    // Stop recording
    await page.click('[data-testid="stop-recording"]')
    
    // Verify recording stopped
    await expect(page.locator('[data-testid="recording-indicator"]')).not.toBeVisible()
    
    // Wait for processing to complete
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="processing-indicator"]')).not.toBeVisible({ timeout: 20000 })
    
    // Verify final transcription is preserved
    const finalTranscription = page.locator('[data-testid="final-transcription"]')
    await expect(finalTranscription).toBeVisible()
    await expect(finalTranscription).not.toBeEmpty()
    
    // Verify SOAP notes were generated and displayed
    const soapNotes = page.locator('[data-testid="soap-notes"]')
    await expect(soapNotes).toBeVisible()
    await expect(soapNotes).toContainText('Subjective')
    await expect(soapNotes).toContainText('Objective')  
    await expect(soapNotes).toContainText('Assessment')
    await expect(soapNotes).toContainText('Plan')
    
    // Verify risk assessment sections
    await expect(page.locator('[data-testid="risk-hypotheses"]')).toBeVisible()
    await expect(page.locator('[data-testid="red-flags"]')).toBeVisible()
    
    // Verify session notes were captured
    await expect(page.locator('[data-testid="session-notes"]'))
      .toContainText('Patient shows signs of discomfort')
    
    console.log('✅ Complete recording workflow verified')
  })

  test('handles short audio recording', async ({ page }) => {
    const audioHelper = new AudioTestHelper(page)
    
    // Use a shorter audio file for quick test
    await audioHelper.injectAudioFile('single-speaker.mp3')
    
    await page.goto('/')
    
    await page.fill('[data-testid="patient-name"]', 'Jane Doe')
    await page.click('[data-testid="start-recording"]')
    
    // Short recording
    await page.waitForTimeout(3000)
    await page.click('[data-testid="stop-recording"]')
    
    // Should still process and generate some output
    await expect(page.locator('[data-testid="final-transcription"]')).toBeVisible({ timeout: 15000 })
    
    // Even short recordings should attempt SOAP generation
    await expect(page.locator('[data-testid="soap-notes"]')).toBeVisible({ timeout: 10000 })
  })

  test('multi-speaker conversation handling', async ({ page }) => {
    const audioHelper = new AudioTestHelper(page)
    
    // Audio file with doctor-patient conversation
    await audioHelper.injectAudioFile('multi-speaker.mp3')
    
    await page.goto('/')
    
    await page.fill('[data-testid="patient-name"]', 'Test Patient')  
    await page.click('[data-testid="start-recording"]')
    
    // Wait for conversation to play and be transcribed
    await page.waitForTimeout(10000)
    await page.click('[data-testid="stop-recording"]')
    
    // Wait for processing
    await expect(page.locator('[data-testid="processing-indicator"]')).not.toBeVisible({ timeout: 20000 })
    
    // Check if speaker segments are detected and displayed
    const speakerSegments = page.locator('[data-testid="speaker-segments"]')
    if (await speakerSegments.isVisible()) {
      await expect(speakerSegments).toContainText(/Speaker [0-9]/)
      console.log('✅ Speaker diarization detected')
    }
    
    // Verify SOAP notes generation
    await expect(page.locator('[data-testid="soap-notes"]')).toBeVisible()
  })
})

// Utility test to create audio files if they don't exist
test.describe('Audio File Setup', () => {
  test.skip('create test audio files', async () => {
    // Run this manually to create basic WAV test files if needed
    // Note: MP3 files are preferred - record real audio and convert to MP3
    AudioTestHelper.createTestAudioFile('single-speaker.wav', 5)
    AudioTestHelper.createTestAudioFile('medical-consultation.wav', 10)
    AudioTestHelper.createTestAudioFile('multi-speaker.wav', 15)
  })
})