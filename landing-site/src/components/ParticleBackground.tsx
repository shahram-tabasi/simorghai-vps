import React from 'react';

export function ParticleBackground() {
  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
      {[...Array(60)].map((_, i) => {
        const colors = ['#00d4ff', '#7b2ff7', '#ffffff'];
        const color = colors[i % 3];
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              backgroundColor: color,
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`,
              opacity: 0,
              animation: `particleFloat ${8 + Math.random() * 12}s linear infinite`,
              animationDelay: `${Math.random() * 15}s`
            }}
          />
        );
      })}
      {[...Array(3)].map((_, i) => (
        <div
          key={`streak-${i}`}
          className="absolute h-[1px] w-32"
          style={{
            background: `linear-gradient(90deg, transparent, ${i === 0 ? '#00d4ff' : '#7b2ff7'}40, transparent)`,
            top: `${30 + i * 20}%`,
            left: '0',
            animation: `lightStreak ${6 + i * 2}s linear infinite`,
            animationDelay: `${i * 3}s`
          }}
        />
      ))}
    </div>
  );
}
