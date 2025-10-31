import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatView from './components/ChatView';
import PromptInput from './components/PromptInput';
import WelcomeScreen from './components/WelcomeScreen';
import { Message, Tool, Model, AspectRatio, GroundingChunk, Conversation } from './types';
import { 
    generateText, 
    generateTextWithGoogleSearch, 
    generateTextWithGoogleMaps, 
    generateImage, 
    analyzeImage, 
    editImage, 
    generateVideoFromText, 
    generateVideoFromImage,
    generateComplexText
} from './services/geminiService';
import { useLiveConversation } from './hooks/useLiveConversation';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentModel, setCurrentModel] = useState<Model>(Model.FLASH);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [theme, setTheme] = useState<Theme>('dark');

    const { isLive, transcript, startLiveConversation, stopLiveConversation } = useLiveConversation();

    useEffect(() => {
        try {
            const savedConversations = localStorage.getItem('gemini-conversations');
            if (savedConversations) {
                setConversations(JSON.parse(savedConversations));
            }

            const savedTheme = localStorage.getItem('gemini-theme') as Theme;
             if (savedTheme) {
                setTheme(savedTheme);
            } else {
                 // Detectar preferência do sistema
                 const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                 setTheme(prefersDark ? 'dark' : 'light');
            }
        } catch (error) {
            console.error("Erro ao carregar dados do localStorage:", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('gemini-conversations', JSON.stringify(conversations));
        } catch (error) {
            console.error("Erro ao salvar conversas no localStorage:", error);
        }
    }, [conversations]);

     useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('gemini-theme', theme);
    }, [theme]);

    const activeConversation = conversations.find(c => c.id === activeConversationId);
    useEffect(() => {
        setMessages(activeConversation?.messages || []);
    }, [activeConversationId, conversations]);

    const handleNewChat = () => {
        setActiveConversationId(null);
        setMessages([]);
    };

    const handleSelectConversation = (id: string) => {
        setActiveConversationId(id);
    };

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const addMessageToConversation = (id: string, message: Message) => {
        setConversations(prev =>
            prev.map(conv =>
                conv.id === id
                    ? { ...conv, messages: [...conv.messages, message] }
                    : conv
            )
        );
    };
    
    const handleSend = async (prompt: string, tool: Tool, file?: File, aspectRatio?: AspectRatio) => {
        if (!prompt && !file) return;
    
        setIsLoading(true);
        const userMessageParts: Message['parts'] = [];
        if (prompt) userMessageParts.push({ text: prompt });
        if (file) {
            const base64File = await toBase64(file);
            userMessageParts.push({ inlineData: { mimeType: file.type, data: base64File as string } });
        }
    
        const userMessage: Message = { role: 'user', parts: userMessageParts };
    
        let currentConvId = activeConversationId;
    
        // Se for uma nova conversa, crie-a primeiro
        if (!currentConvId) {
            const newConvId = Date.now().toString();
            const newConversation: Conversation = {
                id: newConvId,
                title: prompt.substring(0, 30) || 'Nova Conversa',
                messages: [userMessage],
            };
            setConversations(prev => [newConversation, ...prev]);
            setActiveConversationId(newConvId);
            currentConvId = newConvId;
        } else {
            addMessageToConversation(currentConvId, userMessage);
        }
    
        try {
            let responseText: string | null = null;
            let responseParts: Message['parts'] = [];
            let sources: GroundingChunk[] = [];
    
            // ... (switch case para as ferramentas, igual ao anterior)
            switch (tool) {
                case Tool.CHAT:
                    try {
                        const response = await fetch('/api/chat', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                prompt: prompt,
                                conversation_id: activeConversationId
                            }),
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                        }

                        const result = await response.json();
                        responseText = result.text;

                        // O backend agora gerencia o ID, mas podemos garantir que o frontend está sincronizado
                        if (result.conversation_id && !activeConversationId) {
                            // Esta parte pode ser ajustada dependendo de como você gerencia a criação de conversas
                            // A lógica atual já cria uma nova conversa, então apenas garantimos a consistência.
                            console.log("Backend retornou conversation_id:", result.conversation_id);
                        }

                    } catch (fetchError) {
                        console.error("Erro ao chamar o backend do JARVIS:", fetchError);
                        responseText = `Não foi possível conectar ao JARVIS. ${fetchError.message}`;
                    }
                    break;
                case Tool.SEARCH:
                    const searchResult = await generateTextWithGoogleSearch(prompt);
                    responseText = searchResult.text;
                    sources = searchResult.sources;
                    break;
                case Tool.MAPS:
                    const mapsResult = await generateTextWithGoogleMaps(prompt);
                    responseText = mapsResult.text;
                    sources = mapsResult.sources;
                    break;
                case Tool.IMAGE_GEN:
                    const imageUrl = await generateImage(prompt, aspectRatio || '1:1');
                    responseParts.push({ inlineData: { mimeType: 'image/jpeg', data: imageUrl } });
                    break;
                case Tool.ANALYZE_IMAGE:
                    if (file) {
                        responseText = await analyzeImage(prompt, file);
                    }
                    break;
                case Tool.EDIT_IMAGE:
                    if (file) {
                        const editedImageUrl = await editImage(prompt, file);
                        responseParts.push({ inlineData: { mimeType: file.type, data: editedImageUrl } });
                    }
                    break;
                case Tool.VIDEO_GEN_TEXT:
                     if(currentConvId) addMessageToConversation(currentConvId, { role: 'model', parts: [{ text: 'Iniciando a geração do vídeo. Isso pode levar alguns minutos...' }] });
                    const videoUrlText = await generateVideoFromText(prompt, aspectRatio as '16:9' | '9:16' || '16:9');
                    responseParts.push({ text: `Vídeo gerado com sucesso!`, inlineData: { mimeType: 'video/mp4', data: videoUrlText } });
                    break;
                case Tool.VIDEO_GEN_IMAGE:
                     if (file && currentConvId) {
                        addMessageToConversation(currentConvId, { role: 'model', parts: [{ text: 'Iniciando a geração do vídeo a partir da imagem. Isso pode levar alguns minutos...' }] });
                        const videoUrlImage = await generateVideoFromImage(prompt, file, aspectRatio as '16:9' | '9:16' || '16:9');
                        responseParts.push({ text: `Vídeo gerado com sucesso!`, inlineData: { mimeType: 'video/mp4', data: videoUrlImage } });
                    }
                    break;
            }
    
            if (responseText) {
                responseParts.push({ text: responseText });
            }
    
            if (responseParts.length > 0 && currentConvId) {
                const modelMessage: Message = { role: 'model', parts: responseParts, sources };
                addMessageToConversation(currentConvId, modelMessage);
            }
    
        } catch (error) {
            console.error("Erro ao se comunicar com a API Gemini:", error);
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            if (currentConvId) {
                addMessageToConversation(currentConvId, { role: 'model', parts: [{ text: `Desculpe, ocorreu um erro: ${errorMessage}` }] });
            }
        } finally {
            setIsLoading(false);
        }
    };
    

     const toBase64 = (file: File): Promise<string | ArrayBuffer | null> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });

    return (
        <div className="flex h-screen w-screen text-gray-800 dark:text-gray-200 bg-white dark:bg-[#131314] overflow-hidden">
            <Sidebar 
                isOpen={isSidebarOpen} 
                onNewChat={handleNewChat} 
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                theme={theme}
                onToggleTheme={toggleTheme}
            />
            <div className="flex flex-col flex-1 h-full">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
                    {isLive && (
                         <div className="absolute inset-0 bg-white/90 dark:bg-[#131314]/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                            <div className="w-24 h-24 border-4 border-blue-500 rounded-full animate-pulse flex items-center justify-center">
                                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                            </div>
                            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">Ouvindo...</p>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md text-center">{transcript}</p>
                            <button onClick={stopLiveConversation} className="mt-8 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-full text-white font-semibold">Parar</button>
                        </div>
                    )}
                    {messages.length === 0 ? (
                        <WelcomeScreen />
                    ) : (
                        <ChatView chatHistory={messages} isLoading={isLoading} />
                    )}
                </main>
                <div className="w-full px-4 md:px-6 pb-4 md:pb-6">
                    <PromptInput 
                        onSend={handleSend} 
                        isLoading={isLoading}
                        currentModel={currentModel}
                        setCurrentModel={setCurrentModel}
                        startLiveConversation={startLiveConversation}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;