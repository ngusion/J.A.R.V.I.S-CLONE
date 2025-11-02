import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatView from './components/ChatView';
import PromptInput from './components/PromptInput';
import WelcomeScreen from './components/WelcomeScreen';
import { Message, Model, GroundingChunk, Conversation } from './types';
import { 
    generateText, 
    generateTextWithGoogleSearch, 
    generateTextWithGoogleMaps, 
    generateImage, 
    analyzeImage, 
    editImage, 
    generateVideoFromText, 
    generateVideoFromImage,
    generateComplexText,
    textToSpeech
} from './services/geminiService';
import { geminiTools, toolStatusMessages } from './services/geminiTools';
import { useLiveConversation } from './hooks/useLiveConversation';
import { GoogleGenAI } from "@google/genai";

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
    
    /**
     * Nova implementação do handleSend com loop de agente autônomo
     * A IA decide qual ferramenta usar através de Function Calling
     */
    const handleSend = async (prompt: string, file?: File) => {
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
            // Inicializar o cliente Gemini
            if (!process.env.API_KEY) {
                throw new Error("A variável de ambiente API_KEY não está definida.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Selecionar o modelo baseado na escolha do usuário
            const modelName = currentModel === Model.PRO ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
            const model = ai.models.getGenerativeModel({ model: modelName });
            
            // Preparar o histórico de mensagens para o contexto
            const conversationHistory = activeConversation?.messages || [];
            const historyForGemini = conversationHistory.map(msg => ({
                role: msg.role,
                parts: msg.parts
            }));
            
            // Iniciar chat com histórico e ferramentas
            const chat = model.startChat({
                history: historyForGemini,
                tools: geminiTools,
            });
            
            // Enviar a mensagem do usuário
            let result = await chat.sendMessage(userMessage.parts);
            
            // Loop de agente: processar functionCalls até obter resposta final
            let maxIterations = 10; // Prevenir loops infinitos
            let iteration = 0;
            
            while (iteration < maxIterations) {
                iteration++;
                
                const response = result.response;
                const functionCall = response.candidates?.[0]?.content?.parts?.find(part => part.functionCall);
                
                // Se não houver functionCall, a IA retornou a resposta final
                if (!functionCall) {
                    // Extrair texto e fontes da resposta final
                    const responseText = response.text;
                    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
                    
                    if (responseText && currentConvId) {
                        const modelMessage: Message = { 
                            role: 'model', 
                            parts: [{ text: responseText }],
                            sources: sources as GroundingChunk[]
                        };
                        addMessageToConversation(currentConvId, modelMessage);
                    }
                    break;
                }
                
                // Processar o functionCall
                const functionName = functionCall.functionCall.name;
                const functionArgs = functionCall.functionCall.args;
                
                console.log(`🤖 Agente decidiu usar: ${functionName}`, functionArgs);
                
                // Adicionar mensagem de status ao chat
                const statusMessage = toolStatusMessages[functionName] || "🤖 Processando...";
                if (currentConvId) {
                    addMessageToConversation(currentConvId, { 
                        role: 'model', 
                        parts: [{ text: statusMessage }] 
                    });
                }
                
                // Executar a função correspondente com tratamento de erros
                let functionResult: any;
                try {
                    functionResult = await executeFunctionCall(functionName, functionArgs, file);
                } catch (error) {
                    console.error(`Erro ao executar ${functionName}:`, error);
                    functionResult = { 
                        error: error instanceof Error ? error.message : "Erro desconhecido ao executar a ferramenta." 
                    };
                }
                
                // Enviar o resultado da função de volta para a IA
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: functionName,
                        response: functionResult
                    }
                }]);
            }
            
            if (iteration >= maxIterations) {
                console.warn("Loop de agente atingiu o limite máximo de iterações");
                if (currentConvId) {
                    addMessageToConversation(currentConvId, { 
                        role: 'model', 
                        parts: [{ text: "Desculpe, encontrei dificuldades para processar sua solicitação completamente." }] 
                    });
                }
            }
    
        } catch (error) {
            console.error("Erro ao se comunicar com a API Gemini:", error);
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            if (currentConvId) {
                addMessageToConversation(currentConvId, { 
                    role: 'model', 
                    parts: [{ text: `Desculpe, ocorreu um erro: ${errorMessage}` }] 
                });
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    /**
     * Executa a função correspondente ao functionCall da IA
     */
    const executeFunctionCall = async (functionName: string, args: any, file?: File): Promise<any> => {
        switch (functionName) {
            case 'generateText':
                const textResult = await generateText(args.prompt);
                return { text: textResult };
                
            case 'generateComplexText':
                const complexTextResult = await generateComplexText(args.prompt);
                return { text: complexTextResult };
                
            case 'generateTextWithGoogleSearch':
                const searchResult = await generateTextWithGoogleSearch(args.prompt);
                return { text: searchResult.text, sources: searchResult.sources };
                
            case 'generateTextWithGoogleMaps':
                const mapsResult = await generateTextWithGoogleMaps(args.prompt);
                return { text: mapsResult.text, sources: mapsResult.sources };
                
            case 'generateImage':
                const imageUrl = await generateImage(args.prompt, args.aspectRatio || '1:1');
                return { 
                    imageUrl: imageUrl,
                    message: "Imagem gerada com sucesso!",
                    mimeType: 'image/jpeg'
                };
                
            case 'analyzeImage':
                if (!file) {
                    throw new Error("Nenhuma imagem foi fornecida para análise.");
                }
                const analysisResult = await analyzeImage(args.prompt, file);
                return { text: analysisResult };
                
            case 'editImage':
                if (!file) {
                    throw new Error("Nenhuma imagem foi fornecida para edição.");
                }
                const editedImageUrl = await editImage(args.prompt, file);
                return { 
                    imageUrl: editedImageUrl,
                    message: "Imagem editada com sucesso!",
                    mimeType: file.type
                };
                
            case 'generateVideoFromText':
                const videoUrlText = await generateVideoFromText(args.prompt, args.aspectRatio || '16:9');
                return { 
                    videoUrl: videoUrlText,
                    message: "Vídeo gerado com sucesso!",
                    mimeType: 'video/mp4'
                };
                
            case 'generateVideoFromImage':
                if (!file) {
                    throw new Error("Nenhuma imagem foi fornecida para gerar o vídeo.");
                }
                const videoUrlImage = await generateVideoFromImage(args.prompt, file, args.aspectRatio || '16:9');
                return { 
                    videoUrl: videoUrlImage,
                    message: "Vídeo gerado com sucesso!",
                    mimeType: 'video/mp4'
                };
                
            case 'textToSpeech':
                const audioBuffer = await textToSpeech(args.text);
                return { 
                    message: "Áudio gerado com sucesso!",
                    audioBuffer: audioBuffer
                };
                
            default:
                throw new Error(`Função desconhecida: ${functionName}`);
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
