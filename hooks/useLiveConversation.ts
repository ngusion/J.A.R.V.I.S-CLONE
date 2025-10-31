
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from "@google/genai";

// Funções de codificação/decodificação de áudio
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


export const useLiveConversation = () => {
    const [isLive, setIsLive] = useState(false);
    const [transcript, setTranscript] = useState('');
    
    const sessionPromiseRef = useRef<any>(null);
    const audioContextsRef = useRef<{ input: AudioContext | null, output: AudioContext | null, scriptProcessor: ScriptProcessorNode | null, streamSource: MediaStreamAudioSourceNode | null, mediaStream: MediaStream | null }>({ input: null, output: null, scriptProcessor: null, streamSource: null, mediaStream: null });
    const audioQueueRef = useRef<{ source: AudioBufferSourceNode, buffer: AudioBuffer }[]>([]);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const stopLiveConversation = useCallback(() => {
        setIsLive(false);
        setTranscript('');

        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then((session: any) => session.close());
            sessionPromiseRef.current = null;
        }

        const { input, output, scriptProcessor, streamSource, mediaStream } = audioContextsRef.current;
        if (scriptProcessor) {
            scriptProcessor.disconnect();
        }
        if (streamSource) {
            streamSource.disconnect();
        }
        if (input) {
            input.close();
        }
        if (output) {
            output.close();
        }
        mediaStream?.getTracks().forEach(track => track.stop());

        audioContextsRef.current = { input: null, output: null, scriptProcessor: null, streamSource: null, mediaStream: null };
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

    }, []);

    const startLiveConversation = useCallback(async () => {
        try {
            if (isLive) return;

            setIsLive(true);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextsRef.current.output = outputAudioContext;
            
            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        audioContextsRef.current.mediaStream = stream;

                        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        audioContextsRef.current.input = inputAudioContext;
                        
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        audioContextsRef.current.streamSource = source;

                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        audioContextsRef.current.scriptProcessor = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };

                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session: any) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                         if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                            setTranscript(`Você: ${currentInputTranscription}`);
                        }
                        if (message.serverContent?.outputTranscription) {
                           currentOutputTranscription += message.serverContent.outputTranscription.text;
                           setTranscript(`Gemini: ${currentOutputTranscription}`);
                        }

                        if (message.serverContent?.turnComplete) {
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContext) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });

                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }

                         if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(source => source.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Erro na conversa ao vivo:', e);
                        setTranscript(`Erro: ${e.message}. A conversa será encerrada.`);
                        setTimeout(stopLiveConversation, 3000);
                    },
                    onclose: () => {
                        stopLiveConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                },
            });
        } catch (error) {
            console.error("Falha ao iniciar a conversa ao vivo:", error);
            setTranscript("Não foi possível iniciar a conversa. Verifique as permissões do microfone.");
            setIsLive(false);
        }
    }, [isLive, stopLiveConversation]);

    return { isLive, transcript, startLiveConversation, stopLiveConversation };
};
