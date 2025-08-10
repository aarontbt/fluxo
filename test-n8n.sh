#!/bin/bash

# Test n8n webhook with Malay conversation
echo "🧪 Testing n8n webhook with Malay conversation..."

curl -X POST \
  "https://n8n.example.com/webhook/webhook-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token-here" \
  -d '{
    "transcribe-input": "Dr. Farah: Selamat pagi. Ini Adik Aisyah ke?\nMak Aisyah: Pagi doctor. Ya, ini anak saya. Sejak semalam dia demam, tak nak makan.\nDr. Farah: Aisyah, boleh buka mulut? Doctor nak tengok tekak awak.\nAisyah: Okay doctor.\nDr. Farah: Nampak merah sikit ni. Bila mula demam?\nMak Aisyah: Semalam malam sampai 39 darjah. Dia kata sakit nak telan. Oh, dan dia macam susah bernafas sikit, dada ada lekuk.\nDr. Farah: Okay, jom check temperature. 38.2 darjah. Aisyah, tunjuk tangan dengan kaki.\nAyah Aisyah: Kawan saya kata mungkin hand, foot and mouth disease.\nDr. Farah: Tak nampak ruam. Ni viral throat infection je. Tak perlu antibiotics.\nMak Aisyah: Berapa lama dia akan okay?\nDr. Farah: 3-5 hari. Bagi dia minum air banyak-banyak. Boleh makan ais krim sikit.\nAisyah: Suka ais krim!\nDr. Farah: Kalau demam naik lebih 40 darjah, datang emergency. Otherwise makan ubat demam 4 jam sekali.\nMak Aisyah: Terima kasih doctor.\nDr. Farah: Welcome. Jangan lupa rest okay, Aisyah?",
    "medical-notes": ["[2025-08-10 09:15:00] Child patient Aisyah with fever since yesterday", "[2025-08-10 09:16:30] Temperature peaked at 39°C last night", "[2025-08-10 09:17:45] Complaints of sore throat and difficulty swallowing", "[2025-08-10 09:18:20] Some breathing difficulty noted by parent", "[2025-08-10 09:19:15] Current temperature 38.2°C", "[2025-08-10 09:20:30] Parent concerned about hand, foot and mouth disease", "[2025-08-10 09:21:00] No rash observed on examination"],
    "domain-knowledge": ""
  }' \
  -s > n8n/malay-conversation-response.json

echo -e "\n📊 Response saved to n8n/malay-conversation-response.json"
echo "📋 Response content:"
cat n8n/malay-conversation-response.json | jq .
