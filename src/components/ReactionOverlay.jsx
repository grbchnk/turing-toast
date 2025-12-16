import React, { useState, useEffect } from 'react';
import { socket } from '../socket';

// CSS анимации
const animationStyles = `
  @keyframes floatUpFade {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0);
    }
    10% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.2);
    }
    100% {
      opacity: 1;
      transform: translate(calc(-50% + var(--drift)), -150px) rotate(var(--rot)) scale(0.2);
    }
  }
`;

export const ReactionOverlay = () => {
    const [reactions, setReactions] = useState([]);

    useEffect(() => {
        const handleReaction = (data) => {
            const element = document.getElementById(`player-node-${data.senderId}`);
            let startX = window.innerWidth / 2;
            let startY = window.innerHeight - 100;

            if (element) {
                const rect = element.getBoundingClientRect();
                startX = rect.left + (rect.width / 2);
                startY = rect.top + (rect.height / 2);
            }

            const drift = (Math.random() - 0.5) * 150;
            const rotation = (Math.random() - 0.5) * 45;
            const scale = 0.8 + Math.random() * 0.5;

            const reactionObj = {
                ...data,
                x: startX,
                y: startY,
                drift,
                rotation,
                scale,
                id: Math.random()
            };

            setReactions(prev => [...prev, reactionObj]);

            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== reactionObj.id));
            }, 2000);
        };

        socket.on('animate_reaction', handleReaction);
        return () => socket.off('animate_reaction', handleReaction);
    }, []);

    return (
        <>
            <style>{animationStyles}</style>
            <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
                {reactions.map(r => (
                    <div
                        key={r.id}
                        className="absolute text-4xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                        style={{
                            left: r.x,
                            top: r.y,
                            '--drift': `${r.drift}px`,
                            '--rot': `${r.rotation}deg`,
                            animation: 'floatUpFade 2.5s cubic-bezier(.5,0,0.3,1) forwards'
                        }}
                    >
                        {r.emoji}
                    </div>
                ))}
            </div>
        </>
    );
};