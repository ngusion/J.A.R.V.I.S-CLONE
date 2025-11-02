/**
 * Definições de ferramentas (tools) para Function Calling da API do Google Gemini.
 * Cada ferramenta corresponde a uma função real no geminiService.ts.
 */

export const geminiTools = [
    {
        functionDeclarations: [
            {
                name: "generateText",
                description: "Use esta ferramenta para bate-papo geral, responder a perguntas simples, ou quando nenhuma outra ferramenta for mais apropriada para o pedido do usuário.",
                parameters: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "O texto ou pergunta do usuário"
                        }
                    },
                    required: ["prompt"]
                }
            },
            {
                name: "generateComplexText",
                description: "Use esta ferramenta para responder perguntas complexas que requerem raciocínio profundo, análise detalhada ou resolução de problemas difíceis.",
                parameters: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "A pergunta ou problema complexo do usuário"
                        }
                    },
                    required: ["prompt"]
                }
            },
            {
                name: "generateTextWithGoogleSearch",
                description: "Use esta ferramenta quando o usuário pedir informações em tempo real, notícias, fatos, ou qualquer pergunta que requeira conhecimento atualizado da internet.",
                parameters: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "A pergunta ou busca que requer informações atualizadas da web"
                        }
                    },
                    required: ["prompt"]
                }
            },
            {
                name: "generateTextWithGoogleMaps",
                description: "Use esta ferramenta para encontrar locais, obter direções, ou responder perguntas baseadas em geografia, como 'onde fica' ou 'restaurantes perto de'.",
                parameters: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "A pergunta sobre localização ou direções"
                        }
                    },
                    required: ["prompt"]
                }
            },
            {
                name: "generateImage",
                description: "Use esta ferramenta para criar ou gerar uma nova imagem do zero, com base em uma descrição de texto (prompt) do usuário.",
                parameters: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "A descrição da imagem a ser gerada"
                        },
                        aspectRatio: {
                            type: "string",
                            description: "A proporção da imagem",
                            enum: ["1:1", "16:9", "9:16", "4:3", "3:4"]
                        }
                    },
                    required: ["prompt"]
                }
            },
            {
                name: "analyzeImage",
                description: "Use esta ferramenta quando o usuário enviar uma imagem e fizer uma pergunta sobre ela (ex: 'o que é isso?', 'descreva esta cena', 'quantos carros há na foto?').",
                parameters: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "A pergunta sobre a imagem"
                        },
                        hasImage: {
                            type: "boolean",
                            description: "Indica se há uma imagem anexada"
                        }
                    },
                    required: ["prompt", "hasImage"]
                }
            },
            {
                name: "editImage",
                description: "Use esta ferramenta quando o usuário enviar uma imagem e pedir explicitamente para modificá-la (ex: 'remova o fundo', 'mude a cor do céu para vermelho', 'coloque um chapéu nesta pessoa').",
                parameters: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "A instrução de edição da imagem"
                        },
                        hasImage: {
                            type: "boolean",
                            description: "Indica se há uma imagem anexada"
                        }
                    },
                    required: ["prompt", "hasImage"]
                }
            },
            {
                name: "generateVideoFromText",
                description: "Use esta ferramenta para criar ou gerar um novo vídeo a partir de uma descrição de texto (prompt).",
                parameters: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "A descrição do vídeo a ser gerado"
                        },
                        aspectRatio: {
                            type: "string",
                            description: "A proporção do vídeo",
                            enum: ["16:9", "9:16"]
                        }
                    },
                    required: ["prompt"]
                }
            },
            {
                name: "generateVideoFromImage",
                description: "Use esta ferramenta quando o usuário enviar uma imagem e pedir para animá-la ou usá-la como base para um vídeo.",
                parameters: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "A descrição de como animar a imagem"
                        },
                        hasImage: {
                            type: "boolean",
                            description: "Indica se há uma imagem anexada"
                        },
                        aspectRatio: {
                            type: "string",
                            description: "A proporção do vídeo",
                            enum: ["16:9", "9:16"]
                        }
                    },
                    required: ["prompt", "hasImage"]
                }
            },
            {
                name: "textToSpeech",
                description: "Use esta ferramenta quando o usuário pedir para 'ler em voz alta' ou 'ouvir' uma resposta em texto.",
                parameters: {
                    type: "object",
                    properties: {
                        text: {
                            type: "string",
                            description: "O texto a ser convertido em fala"
                        }
                    },
                    required: ["text"]
                }
            }
        ]
    }
];

/**
 * Mapeamento de nomes de ferramentas para mensagens de status amigáveis
 */
export const toolStatusMessages: Record<string, string> = {
    generateText: "🤖 Processando sua mensagem...",
    generateComplexText: "🤖 Analisando profundamente sua pergunta...",
    generateTextWithGoogleSearch: "🤖 Consultando a web...",
    generateTextWithGoogleMaps: "🤖 Buscando localização...",
    generateImage: "🤖 Certo, estou gerando a imagem para você...",
    analyzeImage: "🤖 Analisando a imagem...",
    editImage: "🤖 Editando a imagem...",
    generateVideoFromText: "🤖 Iniciando a geração do vídeo. Isso pode levar alguns minutos...",
    generateVideoFromImage: "🤖 Iniciando a geração do vídeo a partir da imagem. Isso pode levar alguns minutos...",
    textToSpeech: "🤖 Convertendo texto em fala..."
};
