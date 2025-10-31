import React, { useState, useRef, useEffect } from 'react';
import { Tool } from '../types';

interface ToolSelectorProps {
    selectedTool: Tool;
    onSelectTool: (tool: Tool) => void;
}

const toolOptions = [
    { id: Tool.CHAT, label: 'Chat', icon: '💬' },
    { id: Tool.SEARCH, label: 'Busca Web', icon: '🌐' },
    { id: Tool.MAPS, label: 'Busca Maps', icon: '🗺️' },
    { id: Tool.IMAGE_GEN, label: 'Gerar Imagem', icon: '🎨' },
    { id: Tool.ANALYZE_IMAGE, label: 'Analisar Imagem', icon: '🖼️' },
    { id: Tool.EDIT_IMAGE, label: 'Editar Imagem', icon: '✏️' },
    { id: Tool.VIDEO_GEN_TEXT, label: 'Gerar Vídeo (Texto)', icon: '🎬' },
    { id: Tool.VIDEO_GEN_IMAGE, label: 'Gerar Vídeo (Imagem)', icon: '🎥' },
];

const ToolSelector: React.FC<ToolSelectorProps> = ({ selectedTool, onSelectTool }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedToolLabel = toolOptions.find(t => t.id === selectedTool)?.label || 'Ferramentas';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (tool: Tool) => {
        onSelectTool(tool);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                <span className="text-sm hidden md:inline">{selectedToolLabel}</span>
            </button>
            {isOpen && (
                <div className="absolute bottom-full mb-2 w-56 bg-white dark:bg-[#2a2b2c] rounded-lg shadow-xl z-10 border border-gray-200 dark:border-gray-700">
                    <ul className="py-1">
                        {toolOptions.map(tool => (
                            <li key={tool.id}>
                                <button
                                    onClick={() => handleSelect(tool.id)}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${selectedTool === tool.id ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <span>{tool.icon}</span>
                                    {tool.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ToolSelector;