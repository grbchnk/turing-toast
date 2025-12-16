import React from 'react';

export const AiProcessingScreen = ({ loadingText }) => {
    return (
        <div className="flex flex-col h-screen justify-center items-center p-6 space-y-8 bg-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
            <div className="relative z-10 flex flex-col items-center animate-float">
                {/* Убедитесь, что путь к картинке правильный */}
                <img src="./loading.png" alt="Loading" className="w-32 h-32 object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
            </div>
            <div className="z-10 text-center space-y-2">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse">
                    {loadingText}
                </h2>
                <div className="flex justify-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-0"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-60"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-120"></div>
                </div>
            </div>
        </div>
    );
};