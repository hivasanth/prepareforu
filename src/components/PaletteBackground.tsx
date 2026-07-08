import { motion } from 'framer-motion';

const COLORS = [
  '#264653', // Deep Navy
  '#2a9d8f', // Teal
  '#e9c46a', // Yellow
  '#f4a261', // Orange
  '#e76f51'  // Coral
];

/**
 * PaletteBackground
 * A high-fidelity, interactive background component featuring 5 color stripes
 * that expand on hover/touch. Optimized for mobile (vertical stack) and
 * desktop (side-by-side).
 */
export const PaletteBackground = () => {
  return (
    <div className="fixed inset-0 z-0 flex flex-col md:flex-row h-screen w-screen overflow-hidden pointer-events-auto">
      {COLORS.map((color, index) => (
        <motion.div
          key={index}
          initial={false}
          whileHover={{ flexGrow: 2, zIndex: 10, scale: 1.02 }}
          whileTap={{ flexGrow: 1.5 }}
          transition={{ 
            type: 'spring', 
            stiffness: 150, 
            damping: 20, 
            mass: 0.8
          }}
          className="relative flex-1 flex items-center justify-center transition-shadow duration-300 hover:shadow-[0_0_50px_rgba(0,0,0,0.3)] shadow-none h-full w-full"
          style={{ backgroundColor: color }}
        />
      ))}
      
      {/* 
        Subtle grain/noise overlay for premium texture 
        Using a dark radial gradient to center focus on foreground content
      */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
};
