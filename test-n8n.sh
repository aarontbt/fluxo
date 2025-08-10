#!/bin/bash

# Test n8n webhook with curl
echo "🧪 Testing n8n webhook with curl..."

curl -X POST \
  "https://n8n.example.com/webhook/webhook-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token-here" \
  -d '{
    "transcribe-input": "Hi, Doctor my kid is having coughing non-stop these few days. The cough seems to get worse at night.",
    "medical-notes": ["[2025-08-10 11:15:23] Patient appears anxious", "[2025-08-10 11:16:45] Child age: 7 years old"],
    "domain-knowledge": ""
  }' \
  -v

echo -e "\n\n📊 Test completed!"
