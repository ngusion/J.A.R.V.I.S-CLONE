import React from 'react';

const WelcomeScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Olá, Leandro
            </h1>
            <p className="mt-4 text-2xl text-gray-400 dark:text-gray-500">Como posso ajudar hoje?</p>
        </div>
    );
};

export default WelcomeScreen;