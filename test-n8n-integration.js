#!/usr/bin/env node

// Test script for n8n webhook integration
const N8N_ENDPOINT = 'https://n8n.example.com/webhook/webhook-id'
const BEARER_TOKEN = 'your-auth-token-here'

// Test data matching the expected format
const testPayload = {
  'transcribe-input': "Hi, Doctor my kid is having coughing non-stop these few days. The cough seems to get worse at night and there's some wheezing sounds.",
  'medical-notes': [
    "[2025-08-10 11:15:23] Patient appears anxious about child's condition",
    "[2025-08-10 11:16:45] Child age: 7 years old",
    "[2025-08-10 11:17:12] Duration of symptoms: 3 days"
  ],
  'domain-knowledge': ""
}

async function testN8nEndpoint() {
  console.log('🧪 Testing n8n webhook endpoint...')
  console.log('📍 Endpoint:', N8N_ENDPOINT)
  console.log('📦 Payload:', JSON.stringify(testPayload, null, 2))
  
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
    console.log('📋 Response Headers:')
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })

    if (response.ok) {
      const result = await response.text()
      console.log('\n✅ Success! Response body:')
      try {
        const jsonResult = JSON.parse(result)
        console.log(JSON.stringify(jsonResult, null, 2))
      } catch {
        console.log(result)
      }
    } else {
      const errorText = await response.text()
      console.log('\n❌ Error response:')
      console.log(errorText)
    }

  } catch (error) {
    console.error('\n💥 Request failed:', error.message)
  }
}

// Run the test
testN8nEndpoint()
