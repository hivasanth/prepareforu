import DOMPurify from 'dompurify'
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

// Inline SVG icon renderer — accepts raw SVG path content strings from nav data
export const NavIcon = ({ paths, size = 18, color = 'currentColor' }: { paths: string; size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(paths) }}
  />
);
