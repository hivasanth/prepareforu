import React, { useState, useRef, useEffect } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({ 
  value, 
  onChange, 
  length = 6,
  disabled = false 
}) => {
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleOTPChange = (otp: string[]) => {
    const otpValue = otp.join('');
    onChange(otpValue);
  };

  const getOTPValue = () => {
    return value.split('').concat(Array(length).fill('')).slice(0, length);
  };

  const focusInput = (index: number) => {
    const nextIndex = Math.max(Math.min(length - 1, index), 0);
    setActiveInput(nextIndex);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const otp = getOTPValue();
      if (otp[index]) {
        otp[index] = '';
        handleOTPChange(otp);
      } else if (index > 0) {
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!val) return;

    const otp = getOTPValue();
    // Only take the last character typed
    const digit = val.slice(-1);

    if (/^[0-9]$/.test(digit)) {
      otp[index] = digit;
      handleOTPChange(otp);
      if (index < length - 1) {
        focusInput(index + 1);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').slice(0, length);
    if (!/^\d+$/.test(data)) return;

    const otp = data.split('');
    const newOTP = getOTPValue();
    otp.forEach((digit, idx) => {
      newOTP[idx] = digit;
    });
    handleOTPChange(newOTP);
    focusInput(data.length < length ? data.length : length - 1);
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center items-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={getOTPValue()[index]}
          disabled={disabled}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={() => setActiveInput(index)}
          className={`w-10 h-14 sm:w-12 sm:h-16 text-center text-xl font-black rounded-2xl border-2 transition-all duration-300 outline-none
            ${activeInput === index 
              ? 'border-sky-500 bg-white shadow-[0_0_20px_rgba(14,165,233,0.2)] scale-110' 
              : 'border-slate-100 bg-slate-50 text-slate-900'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-200'}
          `}
        />
      ))}
    </div>
  );
};
