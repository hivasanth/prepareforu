import type { FC } from 'react';

const PremiumLoader: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-16 h-16">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-[#2c4c3b]/20"></div>
        {/* Spinning Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#d4af37] border-r-[#d4af37] animate-spin"></div>
        {/* Inner Core */}
        <div className="absolute inset-3 bg-[#2c4c3b] rounded-full flex items-center justify-center animate-pulse">
          <div className="w-2 h-2 bg-[#f4ebd8] rounded-full"></div>
        </div>
      </div>
      <p className="mt-4 font-cinzel text-[#2c4c3b] font-semibold tracking-widest text-sm uppercase animate-pulse">
        Loading
      </p>
    </div>
  );
};

export default PremiumLoader;
