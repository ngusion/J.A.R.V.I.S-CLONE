import React, { useState, useRef } from 'react';
import { Tool, Model, AspectRatio } from '../types';
import ToolSelector from './ToolSelector';

interface PromptInputProps {
    onSend: (prompt: string, tool: Tool, file?: File, aspectRatio?: AspectRatio) => void;
    isLoading: boolean;
    currentModel: Model;
    setCurrentModel: (model: Model) => void;
    startLiveConversation: () => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSend, isLoading, currentModel, setCurrentModel, startLiveConversation }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedTool, setSelectedTool] = useState<Tool>(Tool.CHAT);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toolsWithFileUpload: Tool[] = [
        Tool.ANALYZE_IMAGE,
        Tool.EDIT_IMAGE,
        Tool.VIDEO_GEN_IMAGE,
    ];
    
    const toolsWithAspectRatio: Tool[] = [
        Tool.IMAGE_GEN,
        Tool.VIDEO_GEN_TEXT,
        Tool.VIDEO_GEN_IMAGE,
    ];

    const handleSendClick = () => {
        if (!isLoading && (prompt || selectedFile)) {
            onSend(prompt, selectedTool, selectedFile || undefined, aspectRatio);
            setPrompt('');
            setSelectedFile(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-gray-100 dark:bg-[#1e1f20] rounded-2xl p-4 flex flex-col shadow-lg">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendClick();
                        }
                    }}
                    placeholder="Peça ao Gemini..."
                    className="w-full bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none resize-none"
                    rows={1}
                />
                {selectedFile && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Arquivo selecionado: {selectedFile.name}
                    </div>
                )}
                 {toolsWithAspectRatio.includes(selectedTool) && (
                    <div className="mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Proporção:</span>
                        {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map(ratio => (
                           <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-2 py-1 text-xs rounded-md mr-1 ${aspectRatio === ratio ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>
                                {ratio}
                           </button>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                       <ToolSelector selectedTool={selectedTool} onSelectTool={setSelectedTool} />
                        {toolsWithFileUpload.includes(selectedTool) && (
                            <>
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*"/>
                            </>
                        )}
                        <div className="relative">
                            <select value={currentModel} onChange={(e) => setCurrentModel(e.target.value as Model)} className="bg-transparent text-sm font-semibold text-gray-600 dark:text-gray-300 rounded-md focus:outline-none appearance-none pr-6 cursor-pointer">
                                <option value={Model.FLASH} className="bg-white dark:bg-[#1e1f20]">{Model.FLASH}</option>
                                <option value={Model.PRO} className="bg-white dark:bg-[#1e1f20]">{Model.PRO}</option>
                            </select>
                             <svg className="w-4 h-4 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={startLiveConversation} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" disabled={isLoading}>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                        </button>
                        <button onClick={handleSendClick} className="p-2 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50" disabled={isLoading || (!prompt && !selectedFile)}>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptInput;