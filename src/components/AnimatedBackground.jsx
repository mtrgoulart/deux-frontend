import React from 'react';

const PARTICLES = Array.from({ length: 12 }, (_, i) => i);

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 bg-surface-primary overflow-hidden -z-10">
      {/* Floating orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl animate-float-1"
      />
      <div
        className="absolute top-2/3 right-1/4 w-80 h-80 rounded-full bg-teal-400/8 blur-3xl animate-float-2"
      />
      <div
        className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-teal-600/6 blur-3xl animate-float-3"
      />

      {/* Rising particles */}
      {PARTICLES.map((i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-teal-400/40 animate-particle-rise"
          style={{
            left: `${8 + (i * 7.5)}%`,
            bottom: '-4px',
            animationDelay: `${i * 1.2}s`,
            animationDuration: `${12 + (i % 4) * 3}s`,
          }}
        />
      ))}
    </div>
  );
}
