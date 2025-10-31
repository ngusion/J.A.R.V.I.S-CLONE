import { GoogleGenAI, Modality } from "@google/genai";
import { GroundingChunk } from '../types';

if (!process.env.API_KEY) {
    throw new Error("A variável de ambiente API_KEY não está definida.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getVeoAiClient = async () => {
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Funções de Texto ---

export const generateText = async (prompt: string, modelName: 'gemini-2.5-pro' | 'gemini-flash-lite-latest' = 'gemini-flash-lite-latest'): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Erro na geração de texto:", error);
        throw new Error("Não foi possível gerar texto.");
    }
};

export const generateComplexText = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Erro na geração de texto complexo:", error);
        throw new Error("Não foi possível gerar texto complexo.");
    }
}


export const generateTextWithGoogleSearch = async (prompt: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text, sources: sources as GroundingChunk[] };
    } catch (error) {
        console.error("Erro na busca do Google:", error);
        throw new Error("Não foi possível realizar a busca.");
    }
};

export const generateTextWithGoogleMaps = async (prompt: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocalização não é suportada por este navegador."));
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        tools: [{ googleMaps: {} }],
                        toolConfig: {
                            retrievalConfig: {
                                latLng: { latitude, longitude }
                            }
                        }
                    },
                });
                const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
                resolve({ text: response.text, sources: sources as GroundingChunk[] });
            } catch (error) {
                console.error("Erro na busca do Maps:", error);
                reject(new Error("Não foi possível realizar a busca no Maps."));
            }
        }, () => {
            reject(new Error("Não foi possível obter a sua localização. Por favor, habilite a permissão."));
        });
    });
};


// --- Funções de Imagem ---

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1'): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });
        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        console.error("Erro na geração de imagem:", error);
        throw new Error("Não foi possível gerar a imagem.");
    }
};

export const analyzeImage = async (prompt: string, image: File): Promise<string> => {
    try {
        const base64Image = await toBase64(image) as string;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: image.type, data: base64Image } }
                ]
            },
        });
        return response.text;
    } catch (error) {
        console.error("Erro na análise de imagem:", error);
        throw new Error("Não foi possível analisar a imagem.");
    }
};

export const editImage = async (prompt: string, image: File): Promise<string> => {
    try {
        const base64Image = await toBase64(image) as string;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: image.type, data: base64Image } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (part && part.inlineData) {
            return part.inlineData.data;
        }
        throw new Error("Nenhuma imagem editada foi retornada pela API.");
    } catch (error) {
        console.error("Erro na edição de imagem:", error);
        throw new Error("Não foi possível editar a imagem.");
    }
};

// --- Funções de Vídeo ---

const pollVideoOperation = async (operation: any): Promise<string> => {
    const veoAI = await getVeoAiClient();
    let currentOperation = operation;
    while (!currentOperation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        try {
            // @ts-ignore
             currentOperation = await veoAI.operations.getVideosOperation({ operation: currentOperation });
        } catch (error) {
             console.error("Erro ao verificar a operação de vídeo:", error);
             // @ts-ignore
             if (error.message?.includes("Requested entity was not found.")) {
                 throw new Error("A seleção da chave de API pode ter falhado. Por favor, tente novamente.");
             }
             throw error;
        }
    }
    const downloadLink = currentOperation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("A geração do vídeo falhou ou não retornou um link para download.");
    }
     const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return await toBase64Video(blob) as string;
};

export const generateVideoFromText = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    try {
        const veoAI = await getVeoAiClient();
        // @ts-ignore
        const operation = await veoAI.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        });
        return await pollVideoOperation(operation);
    } catch (error) {
        console.error("Erro na geração de vídeo a partir de texto:", error);
        throw error;
    }
};


export const generateVideoFromImage = async (prompt: string, image: File, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    try {
        const base64Image = await toBase64(image) as string;
        const veoAI = await getVeoAiClient();
        // @ts-ignore
        const operation = await veoAI.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: base64Image,
                mimeType: image.type,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        });
        return await pollVideoOperation(operation);
    } catch (error) {
        console.error("Erro na geração de vídeo a partir de imagem:", error);
        throw error;
    }
};


// --- Funções de Áudio (TTS) ---

export const textToSpeech = async (text: string): Promise<AudioBuffer> => {
     try {
         const response = await ai.models.generateContent({
             model: "gemini-2.5-flash-preview-tts",
             contents: [{ parts: [{ text: text }] }],
             config: {
                 responseModalities: [Modality.AUDIO],
                 speechConfig: {
                     voiceConfig: {
                         prebuiltVoiceConfig: { voiceName: 'Kore' },
                     },
                 },
             },
         });

         const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
         if (!base64Audio) {
             throw new Error("Nenhum dado de áudio retornado.");
         }

         // @ts-ignore
         const outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
         const decodedData = decode(base64Audio);
         return await decodeAudioData(decodedData, outputAudioContext, 24000, 1);
     } catch (error) {
         console.error("Erro na conversão de texto para fala:", error);
         throw new Error("Não foi possível gerar o áudio.");
     }
};


// --- Utilitários ---

const toBase64 = (file: File): Promise<string | ArrayBuffer | null> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const toBase64Video = (blob: Blob): Promise<string | ArrayBuffer | null> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
        resolve(reader.result as string);
    };
    reader.onerror = error => reject(error);
});


function decode(base64: string) {
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