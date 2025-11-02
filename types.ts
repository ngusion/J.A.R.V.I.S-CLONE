export interface Message {
    role: 'user' | 'model';
    parts: {
        text?: string;
        inlineData?: {
            mimeType: string;
            data: string;
        };
    }[];
    sources?: GroundingChunk[];
}

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
}

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
    maps?: {
        uri: string;
        title: string;
    };
}

export enum Model {
    PRO = "2.5 Pro",
    FLASH = "2.5 Flash",
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";