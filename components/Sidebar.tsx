import React from 'react';
import { Conversation } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onNewChat: () => void;
    onToggle: () => void;
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, 
    onNewChat, 
    onToggle, 
    conversations, 
    activeConversationId, 
    onSelectConversation,
    theme,
    onToggleTheme
}) => {
    return (
        <aside className={`flex flex-col bg-gray-100 dark:bg-[#1e1f20] transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} p-4`}>
            <div className="flex items-center mb-8">
                <button onClick={onToggle} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
                {isOpen && <h1 className="text-xl font-bold ml-4 text-gray-800 dark:text-gray-200">Gemini</h1>}
            </div>

            <button onClick={onNewChat} className="flex items-center p-2 mb-4 bg-gray-200 dark:bg-gray-700/50 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600/50">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                {isOpen && <span className="ml-4 font-semibold">Novo chat</span>}
            </button>
            
            <div className="flex-1 overflow-y-auto pr-2">
                 {isOpen && <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Recentes</h2>}
                 <ul className="space-y-2">
                     {conversations.map(conv => (
                         <li key={conv.id}>
                             <button 
                                 onClick={() => onSelectConversation(conv.id)}
                                 className={`w-full text-left p-2 rounded-lg truncate ${activeConversationId === conv.id ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
                             >
                                 {isOpen ? conv.title : '📄'}
                             </button>
                         </li>
                     ))}
                 </ul>
            </div>

            <div className="mt-auto">
                <button onClick={onToggleTheme} className="flex items-center p-2 w-full rounded-full hover:bg-gray-300 dark:hover:bg-gray-700">
                    {theme === 'dark' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                    )}
                    {isOpen && <span className="ml-4">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;