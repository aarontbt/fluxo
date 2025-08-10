# Browser Compatibility Issue - Chrome vs Brave

## Issue Description
The Soniox transcription service is not receiving audio data in Chrome browser, causing the UI to remain stuck on "Initializing transcription..." indefinitely. The same code works correctly in Brave browser.

## Affected Browsers
- **Chrome**: ❌ Not working (both localhost and production)
- **Brave**: ✅ Working correctly

## Symptoms
1. Recording starts successfully (red recording indicator shows)
2. Microphone permissions are granted
3. Audio level indicators may show activity
4. Transcription remains stuck on "Initializing transcription..."
5. No transcription data is received from Soniox API
6. Console shows "STARTING SONIOX TRANSCRIPTION" but no partial results are logged

## Technical Context
- Using Soniox Web SDK (`@soniox/speech-to-text-web`)
- MediaRecorder API for audio capture
- getUserMedia for microphone access
- Real-time transcription with speaker diarization

## Potential Causes (To Investigate)
1. **Chrome Security Policies**: Chrome may have stricter policies for WebRTC/getUserMedia
2. **Audio Format Issues**: Chrome might encode audio differently than Brave
3. **CORS/Security Headers**: Different handling of cross-origin requests to Soniox API
4. **Autoplay Policy**: Chrome's autoplay policy might affect audio context
5. **MediaRecorder Codec**: Default codec differences between browsers

## Files Involved
- `/src/hooks/use-medical-recording.ts` - Main recording hook (lines 247-689)
- `/src/lib/soniox-service.ts` - Soniox service wrapper
- `/src/app/page.tsx` - UI displaying transcription status (lines 274-283)

## Next Steps
- Add browser detection and detailed logging
- Test with different audio constraints
- Check Chrome DevTools Network tab for Soniox API calls
- Verify MediaRecorder output format
- Test with Chrome flags disabled (e.g., --disable-web-security)
- Check if issue persists in Chrome Incognito mode
- Review Soniox SDK documentation for browser-specific requirements

## Workaround
Currently, users should use Brave browser for reliable transcription functionality.