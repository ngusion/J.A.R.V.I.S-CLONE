import React, { useState } from 'react';
import { marked } from 'marked';
import { Message } from '../types';
import { textToSpeech } from '../services/geminiService';

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isModel = message.role === 'model';
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);

    const handlePlayAudio = async (text: string) => {
        if (isPlaying && audioSource) {
            audioSource.stop();
            if (audioContext) {
                audioContext.close();
            }
            setIsPlaying(false);
            setAudioSource(null);
            setAudioContext(null);
            return;
        }

        try {
            setIsPlaying(true);
            const buffer = await textToSpeech(text);
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.onended = () => {
                setIsPlaying(false);
                context.close();
            };
            source.start(0);
            setAudioContext(context);
            setAudioSource(source);
        } catch (error) {
            console.error("Erro ao reproduzir áudio:", error);
            setIsPlaying(false);
        }
    };

    return (
        <div className={`flex items-start gap-4 my-6 ${!isModel ? 'justify-end' : ''}`}>
             <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white ${isModel ? 'bg-gradient-to-br from-blue-400 to-purple-500' : 'bg-gray-500'}`}>
                {isModel ? '🤖' : '👤'}
            </div>
            <div className="flex flex-col max-w-full">
                {message.parts.map((part, index) => {
                    if (part.text) {
                        const htmlContent = marked.parse(part.text);
                        return (
                            <div key={index} className="prose dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-black dark:prose-strong:text-white">
                                <div dangerouslySetInnerHTML={{ __html: htmlContent as string }} />
                                {isModel && (
                                     <button
                                        onClick={() => handlePlayAudio(part.text || '')}
                                        className="mt-2 p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                                        disabled={isPlaying && audioSource !== null}
                                    >
                                        {isPlaying ? (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 5h10v10H5z"/></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 5.14A1 1 0 005 6v8a1 1 0 001.3.89l6-4a1 1 0 000-1.78l-6-4z"/></svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    }
                    if (part.inlineData) {
                         if(part.inlineData.data.startsWith('data:video')) {
                            return <video key={index} controls src={part.inlineData.data} className="max-w-md rounded-lg mt-2" />;
                        }
                        return <img key={index} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="Conteúdo gerado" className="max-w-md rounded-lg mt-2" />;
                    }
                    return null;
                })}
                {message.sources && message.sources.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Fontes:</h4>
                        <ul className="list-disc list-inside text-sm">
                            {message.sources.map((source, i) => {
                                const info = source.web || source.maps;
                                return info ? (
                                    <li key={i}>
                                        <a href={info.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            {info.title}
                                        </a>
                                    </li>
                                ) : null;
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;