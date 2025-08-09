import { RecordTranscribe } from '@soniox/speech-to-text-web';

export interface SpeakerSegment {
  speaker: number | null;
  text: string;
  startTime?: number;
  endTime?: number;
}

export interface TranscriptionResult {
  text: string;
  speakerSegments: SpeakerSegment[];
  timestamp: string;
  isPartial: boolean;
}

export interface SonioxConfig {
  apiKey: string;
  model?: string;
  enableSpeakerDiarization?: boolean;
  enableLanguageIdentification?: boolean;
  languageHints?: string[];
}

export class SonioxTranscriptionService {
  private recordTranscribe: RecordTranscribe | null = null;
  private config: SonioxConfig;
  private isRecording = false;

  constructor(config: SonioxConfig) {
    this.config = {
      model: 'stt-rt-preview-v2',
      enableSpeakerDiarization: true,
      enableLanguageIdentification: true,
      languageHints: ['en', 'ms', 'zh', 'ta'],
      ...config,
    };
  }

  private processSpeakerTokens(tokens: any[]): SpeakerSegment[] {
    const segments: SpeakerSegment[] = [];
    let currentSpeaker: number | null = null;
    let currentText = '';

    tokens.forEach(token => {
      const speaker = typeof token.speaker === 'string' ? parseInt(token.speaker, 10) : (token.speaker ?? null);
      if (speaker !== currentSpeaker) {
        // Speaker changed, save previous segment
        if (currentText.trim()) {
          segments.push({
            speaker: currentSpeaker,
            text: currentText.trim()
          });
        }
        currentSpeaker = speaker;
        currentText = token.text;
      } else {
        currentText += token.text;
      }
    });

    // Add the last segment
    if (currentText.trim()) {
      segments.push({
        speaker: currentSpeaker,
        text: currentText.trim()
      });
    }

    return segments;
  }

  private formatSpeakerText(segments: SpeakerSegment[]): string {
    return segments
      .map(segment => 
        segment.speaker !== null 
          ? `[Speaker ${segment.speaker}] ${segment.text}` 
          : segment.text
      )
      .join('\n');
  }

  async startRecording(
    onPartialResult?: (result: TranscriptionResult) => void,
    onFinalResult?: (result: TranscriptionResult) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      this.recordTranscribe = new RecordTranscribe({
        apiKey: this.config.apiKey,
      });

      await this.recordTranscribe.start({
        model: this.config.model || 'stt-rt-preview-v2',
        enableSpeakerDiarization: this.config.enableSpeakerDiarization,
        enableLanguageIdentification: this.config.enableLanguageIdentification,
        languageHints: this.config.languageHints,
        
        onStarted: () => {
          this.isRecording = true;
          console.log('Soniox recording started');
        },

        onPartialResult: (result) => {
          const tokens = result.tokens || [];
          const speakerSegments = this.processSpeakerTokens(tokens);
          const formattedText = this.formatSpeakerText(speakerSegments);

          const transcriptionResult: TranscriptionResult = {
            text: formattedText,
            speakerSegments,
            timestamp: new Date().toISOString(),
            isPartial: true,
          };

          onPartialResult?.(transcriptionResult);
        },

        onFinished: (result: any) => {
          const tokens = result.tokens || [];
          const speakerSegments = this.processSpeakerTokens(tokens);
          const formattedText = this.formatSpeakerText(speakerSegments);

          const transcriptionResult: TranscriptionResult = {
            text: formattedText,
            speakerSegments,
            timestamp: new Date().toISOString(),
            isPartial: false,
          };

          onFinalResult?.(transcriptionResult);
          this.isRecording = false;
        },

        onError: (status, message) => {
          console.error('Soniox error:', status, message);
          this.isRecording = false;
          onError?.(`Transcription error: ${message}`);
        },
      });

    } catch (error) {
      this.isRecording = false;
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.recordTranscribe || !this.isRecording) {
      return;
    }

    try {
      await this.recordTranscribe.stop();
      this.isRecording = false;
    } catch (error) {
      throw new Error(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  static validateApiKey(apiKey: string | undefined): boolean {
    return Boolean(apiKey && apiKey.trim().length > 0);
  }
}

// Utility function to create a service instance
export function createSonioxService(): SonioxTranscriptionService | null {
  const apiKey = process.env.NEXT_PUBLIC_SONIOX_API_KEY;
  
  if (!SonioxTranscriptionService.validateApiKey(apiKey)) {
    console.warn('Soniox API key not configured');
    return null;
  }

  return new SonioxTranscriptionService({
    apiKey: apiKey!,
    model: 'stt-rt-preview-v2',
    enableSpeakerDiarization: true,
    enableLanguageIdentification: true,
    languageHints: ['en', 'ms', 'zh', 'ta'], // Malaysian languages
  });
}
