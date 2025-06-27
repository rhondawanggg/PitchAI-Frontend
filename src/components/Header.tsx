import React from 'react';

export default function Header({ className = '' }: { className?: string }) {
  return (
    <header className={`w-full py-4 px-8 bg-white shadow flex items-center justify-between ${className}`}>
      <span className="text-2xl font-extrabold bg-gradient-to-tr from-purple-500 to-pink-400 bg-clip-text text-transparent tracking-wide">PitchAI</span>
    </header>
  );
} 