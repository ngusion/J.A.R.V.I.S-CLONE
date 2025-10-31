import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="flex justify-end items-center p-4">
            <div className="flex items-center space-x-4">
                <div className="px-3 py-1 text-sm font-semibold bg-gray-200 dark:bg-gray-700/60 rounded-full text-gray-800 dark:text-gray-200">
                    PRO
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 p-0.5">
                    <img
                        src="https://picsum.photos/40/40"
                        alt="User Avatar"
                        className="w-full h-full rounded-full"
                    />
                </div>
            </div>
        </header>
    );
};

export default Header;