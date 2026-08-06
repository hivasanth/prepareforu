import logoImg from '../assets/logo.png';

// Shared Logo SVG component used across splash, login, signup, sidebar
export const LogoSVG = ({ size = 48, className = '' }: { size?: number; className?: string }) => (
  <img 
    src={logoImg} 
    alt="WhatUWant Logo" 
    width={size} 
    height={size} 
    className={`object-cover rounded-full flex-shrink-0 ${className}`}
    style={{ width: size, height: size }}
  />
);
