import { useState, useEffect } from 'react';
import { validateCoupon } from '../services/userService';
import type { CouponResult } from '../types/auth.types';

export function useCouponValidation(couponCode: string) {
  const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [couponMessage, setCouponMessage] = useState<string>('');

  useEffect(() => {
    const code = (couponCode || '').trim().toUpperCase();
    
    if (!code) {
      setCouponStatus('idle');
      setCouponMessage('');
      return;
    }

    const controller = new AbortController();
    
    const timer = setTimeout(async () => {
      setCouponStatus('loading');
      setCouponMessage('');
      
      try {
        const res: CouponResult = await validateCoupon(code);
        
        if (!controller.signal.aborted) {
          if (res.valid) {
            setCouponStatus('valid');
            setCouponMessage(`Referral code for ${res.subAdminName} applied.`);
          } else {
            setCouponStatus('invalid');
            setCouponMessage(res.error || 'Invalid coupon code');
          }
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setCouponStatus('invalid');
          setCouponMessage(err.message || 'Error validating coupon');
        }
      }
    }, 600); // 600ms debounce matching original behaviour

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [couponCode]);

  return { couponStatus, couponMessage };
}
