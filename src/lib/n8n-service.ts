interface N8nPayload {
  'transcribe-input': string
  'medical-notes': string[]
  'domain-knowledge': string
}

interface N8nAnalysisResponse {
  soa_markdown: string
  risk_hypotheses: string[]
  red_flags: string[]
  next_visit_metrics: string[]
}

interface SendToN8nParams {
  transcription: string
  sessionNotes?: { timestamp: string; note: string }[]
  medicalNotes?: Record<string, unknown>
}

const N8N_ENDPOINT = 'https://n8n.example.com/webhook/webhook-id'
const BEARER_TOKEN = 'your-auth-token-here'

export async function sendToN8n({ 
  transcription, 
  sessionNotes 
}: SendToN8nParams): Promise<N8nAnalysisResponse | null> {
  try {
    // Format session notes as an array of strings
    const formattedSessionNotes = sessionNotes?.map(note => 
      `[${note.timestamp}] ${note.note}`
    ) || []

    // Create the payload according to the n8n webhook format
    const payload: N8nPayload = {
      'transcribe-input': transcription,
      'medical-notes': formattedSessionNotes,
      'domain-knowledge': '' // Empty as per the sample
    }

    console.log('📤 Sending data to n8n endpoint:', payload)

    const response = await fetch(N8N_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`N8n API responded with status: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Successfully sent data to n8n:', result)

    // Parse the n8n response which contains the medical analysis
    if (result.output) {
      try {
        // Extract JSON from the output string (it's wrapped in ```json)
        const jsonMatch = result.output.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          const analysisData = JSON.parse(jsonMatch[1])
          console.log('🩺 Parsed medical analysis:', analysisData)
          return analysisData as N8nAnalysisResponse
        }
      } catch (parseError) {
        console.error('❌ Failed to parse n8n analysis response:', parseError)
      }
    }

    return null
  } catch (error) {
    console.error('❌ Error sending data to n8n:', error)
    return null
  }
}
