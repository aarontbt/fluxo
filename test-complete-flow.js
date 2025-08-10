#!/usr/bin/env node

// Complete test of the medical recording -> n8n -> analysis display flow
const N8N_ENDPOINT = 'https://n8n.example.com/webhook/webhook-id'
const BEARER_TOKEN = 'your-auth-token-here'

// Simulate the complete medical consultation data
const testPayload = {
  'transcribe-input': `Doctor: Good morning! What brings you here today?
Patient: Hi Doctor, my kid has been having a bad cough for the last 5 days. It's really concerning me.
Doctor: I understand your concern. Can you tell me more about the cough? Is it dry or does your child produce any phlegm?
Patient: It's mostly dry, but sometimes there's a little clear mucus. The cough gets worse at night and my child has trouble sleeping.
Doctor: How old is your child?
Patient: She's 5 years old.
Doctor: Has there been any fever?
Patient: Yes, on and off fever, around 38 degrees. I've been giving her paracetamol.
Doctor: Any breathing difficulties or wheezing?
Patient: Sometimes she seems to breathe a bit fast, especially when coughing a lot.
Doctor: Any contact with anyone who's been sick recently?
Patient: Her classmates have been having similar symptoms, so probably picked it up from school.
Doctor: I see. Let me examine her. The throat looks a bit red, and I can hear some wheezing in the chest. This looks like a viral respiratory infection that's quite common in children.`,
  
  'medical-notes': [
    "[2025-08-10 11:15:23] Patient appears worried about child's persistent cough",
    "[2025-08-10 11:16:45] Child age: 5 years old, symptoms for 5 days",
    "[2025-08-10 11:17:12] Dry cough, worse at night, affecting sleep",
    "[2025-08-10 11:18:30] Intermittent fever 38°C, managed with paracetamol",
    "[2025-08-10 11:19:15] Some fast breathing during coughing episodes",
    "[2025-08-10 11:20:45] School outbreak - similar symptoms in classmates",
    "[2025-08-10 11:21:30] Physical exam: red throat, chest wheezing detected"
  ],
  
  'domain-knowledge': ""
}

async function testCompleteFlow() {
  console.log('🏥 Testing Complete Medical Flow - Recording → n8n → Analysis Display')
  console.log('=' * 80)
  
  // Step 1: Simulate stopRecording being called
  console.log('\n📹 Step 1: Recording stopped, processing transcription...')
  console.log('  ✓ Audio transcription completed')
  console.log('  ✓ Session notes collected during recording')
  
  // Step 2: Send to n8n (what happens after the 2-second delay)
  console.log('\n📤 Step 2: Sending data to n8n endpoint after processing delay...')
  console.log('📍 Endpoint:', N8N_ENDPOINT)
  console.log('📊 Payload summary:')
  console.log(`  - Transcription: ${testPayload['transcribe-input'].length} characters`)
  console.log(`  - Medical notes: ${testPayload['medical-notes'].length} entries`)
  
  try {
    const response = await fetch(N8N_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      body: JSON.stringify(testPayload)
    })

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`)

    if (response.ok) {
      const result = await response.json()
      console.log('\n✅ Step 3: Received n8n response successfully!')
      
      // Step 3: Parse the medical analysis
      if (result.output) {
        try {
          const jsonMatch = result.output.match(/```json\n([\s\S]*?)\n```/)
          if (jsonMatch) {
            const analysisData = JSON.parse(jsonMatch[1])
            
            console.log('\n🩺 Step 4: Parsed Medical Analysis:')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            
            console.log('\n📋 SOA MARKDOWN SUMMARY:')
            console.log('────────────────────────────')
            console.log(analysisData.soa_markdown.substring(0, 300) + '...')
            
            console.log('\n⚠️  RISK HYPOTHESES:')
            console.log('────────────────────')
            analysisData.risk_hypotheses.forEach((hypothesis, index) => {
              console.log(`  ${index + 1}. ${hypothesis}`)
            })
            
            console.log('\n🚨 RED FLAGS:')
            console.log('─────────────')
            analysisData.red_flags.forEach((flag, index) => {
              console.log(`  • ${flag}`)
            })
            
            console.log('\n📊 NEXT VISIT METRICS:')
            console.log('──────────────────────')
            analysisData.next_visit_metrics.forEach((metric, index) => {
              console.log(`  ✓ ${metric}`)
            })
            
            console.log('\n🎉 Step 5: Analysis would now be displayed in the UI!')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('\n✅ COMPLETE FLOW SUCCESSFUL:')
            console.log('  📹 Recording → 🔄 Processing → 📤 n8n Analysis → 🖥️  UI Display')
            
          } else {
            console.log('❌ Could not extract JSON from n8n response')
          }
        } catch (parseError) {
          console.error('❌ Failed to parse analysis:', parseError.message)
        }
      } else {
        console.log('ℹ️  No analysis output in response:', result)
      }

    } else {
      const errorText = await response.text()
      console.log('\n❌ Error response:', errorText)
    }

  } catch (error) {
    console.error('\n💥 Request failed:', error.message)
  }
}

// Run the complete flow test
testCompleteFlow()
