
import React from 'react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';

interface ChatViewProps {
    chatHistory: Message[];
    isLoading: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ chatHistory, isLoading }) => {
    return (
        <div className="max-w-4xl mx-auto w-full">
            {chatHistory.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
            ))}
            {isLoading && (
                 <div className="flex items-center justify-start space-x-2 mt-4 ml-12">
                     <div className="w-2 h-5 bg-blue-500 animate-[ping_1.5s_ease-in-out_infinite]"></div>
                     <div className="w-2 h-5 bg-blue-500 animate-[ping_1.5s_ease-in-out_0.2s_infinite]"></div>
                     <div className="w-2 h-5 bg-blue-500 animate-[ping_1.5s_ease-in-out_0.4s_infinite]"></div>
                     <style>{`
                        @keyframes ping {
                          0%, 100% { transform: scaleY(0.5); opacity: 0.7; }
                          50% { transform: scaleY(1.0); opacity: 1; }
                        }
                    `}</style>
                 </div>
            )}
        </div>
    );
};

export default ChatView;
