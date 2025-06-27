import React from 'react';

export default function Footer({ className = '' }: { className?: string }) {
  return (
    <footer className={`w-full py-4 text-center text-gray-400 text-sm ${className}`}>© 2024 PitchAI</footer>
  );
} 