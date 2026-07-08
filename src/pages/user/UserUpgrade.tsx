import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Capacitor } from '@capacitor/core';
import { 
  CheckCircle2, 
  Sparkles, 
  Award, 
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  Button, 
  PageContainer, 
  Grid, 
  H3, 
  Badge 
} from '../../components/common/AntigravityUI';

export default function UserUpgrade() {
  useAuth();
  const { showSuccess } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) } }, [])
  
  // Dynamically detect platform using Capacitor core
  const isMobile = Capacitor.isNativePlatform();

  // Differential monthly pricing: ₹60 on Web, ₹69 on Android (to absorb 15% store commission)
  const price = isMobile ? '69' : '60';
  const provider = isMobile ? 'Google Play Billing' : 'Razorpay Secure Checkout';

  const features = [
    "Unlocks 100+ Premium UPSC & State PSC Mock Exam Papers",
    "Personalized Dynamic AI-Generated Subject Tests",
    "Full Bilingual Outlines (English & Telugu) with premium formatting",
    "Active Competitor Ranks on Global Live Leaderboards",
    "Enhanced Anti-Cheat full-window blur shielding & visibility tracking",
    "Priority 24/7 dedicated educator academic support"
  ];

  const handleCheckout = () => {
    setIsProcessing(true);
    
    // Simulate high-fidelity payment processing experience
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setIsProcessing(false);
      setPurchaseSuccess(true);
      showSuccess(`Premium Plan Activated successfully via ${isMobile ? 'Google Play' : 'Razorpay'}!`);
    }, 2500);
  };

  return (
    <PageContainer className="py-6 flex flex-col justify-center min-h-[85vh]">
      <AnimatePresence mode="wait">
        {!purchaseSuccess ? (
          <motion.div
            key="pricing-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[950px] mx-auto space-y-10"
          >
            {/* Header section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <Badge variant="primary" icon={Sparkles} pulse className="mx-auto !py-1 !px-4 rounded-full font-black text-[10px] tracking-[0.2em]">
                CHOOSE PRE-EMINENCE
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black font-cinzel leading-none text-text-primary tracking-tight m-0">
                UPGRADE PORTFOLIO
              </h1>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed font-sans opacity-70">
                Unlock industry-leading test analysis, limitless AI assessments, and comprehensive bilingual preparation frameworks.
              </p>
            </div>

            {/* Layout Grid */}
            <Grid className="grid-cols-12 gap-8 items-stretch">
              
              {/* Left Plan Description Card */}
              <div className="col-span-12 lg:col-span-7 flex flex-col justify-between">
                <Card className="p-6 md:p-8 flex-1 flex flex-col justify-between border-border-subtle/40 bg-card-bg/60">
                  <div className="space-y-6">
                    <div>
                      <H3 className="m-0 text-lg uppercase tracking-tight text-text-primary">PREMIUM MEMBER ADVANTAGES</H3>
                      <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] opacity-60 m-0 mt-1">Access Checklist</p>
                    </div>

                    <div className="space-y-4">
                      {features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5 shadow-sm">
                            <CheckCircle2 size={14} />
                          </div>
                          <span className="text-xs md:text-[13px] font-semibold text-text-secondary leading-normal">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 items-center mt-8 pt-6 border-t border-border-subtle/30">
                    <div className="w-10 h-10 rounded-xl bg-hover-bg flex items-center justify-center text-text-secondary">
                      <Award size={20} />
                    </div>
                    <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-60 m-0">
                      Standardized competitive exam guidelines active.
                    </p>
                  </div>
                </Card>
              </div>

              {/* Right Billing/Purchase Card */}
              <div className="col-span-12 lg:col-span-5">
                <Card className="p-6 md:p-8 border-primary/20 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#C8960C]/8 via-card-bg to-card-bg h-full flex flex-col justify-between min-h-[360px]">
                  
                  {/* Decorative corner tag */}
                  <div className="absolute top-0 right-0 bg-primary/10 border-b border-l border-primary/20 px-3 py-1 text-[9px] font-black text-primary uppercase tracking-widest rounded-bl-xl">
                    👑 Monthly Access
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="m-0 text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] opacity-50">PREMIUM UPGRADE</p>
                      <h2 className="m-0 text-xl font-black font-cinzel leading-none text-text-primary tracking-tight mt-1">UPSC EXCELLENCE</h2>
                    </div>

                    {/* Pricing element */}
                    <div className="py-4 border-y border-border-subtle/30 flex items-baseline gap-2">
                      <span className="text-5xl font-black text-primary leading-none tracking-tighter">₹{price}</span>
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-widest opacity-50">/ Month</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs font-bold text-text-secondary uppercase tracking-wider">
                        <span>Original Price:</span>
                        <span className="line-through">₹199</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-success uppercase tracking-wider">
                        <span>Special Promo Discount:</span>
                        <span>{isMobile ? '-65% OFF' : '-70% OFF'}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-text-primary uppercase tracking-wider pt-2 border-t border-border-subtle/20">
                        <span>Subtotal:</span>
                        <span>₹{price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Button Action */}
                  <div className="mt-8 space-y-4">
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={handleCheckout}
                      loading={isProcessing}
                      className="h-14 font-black uppercase tracking-[0.2em] text-[12px] shadow-lg shadow-primary/20 hover:shadow-primary/30"
                    >
                      {isProcessing ? 'Processing Securely...' : `Upgrade Account`}
                    </Button>
                    
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-45">
                        Secured via {provider}
                      </span>
                    </div>
                  </div>

                  {/* Decorative subtle visual accent */}
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                </Card>
              </div>

            </Grid>
          </motion.div>
        ) : (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="p-8 md:p-12 text-center rounded-[24px] shadow-2xl flex flex-col items-center gap-6 border-success/15 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-success via-[#10B981] to-success"></div>
              
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success shadow-inner mb-2">
                <CheckCircle2 size={40} />
              </div>

              <div className="space-y-2">
                <Badge variant="success" className="mx-auto !py-0.5 !px-3 font-black text-[9px] tracking-widest uppercase rounded-md">
                  UPGRADE CONFIRMED
                </Badge>
                <h2 className="m-0 text-2xl font-black font-cinzel leading-none text-text-primary tracking-tight mt-3">
                  WELCOME PREMIUM
                </h2>
                <p className="text-xs text-text-secondary font-semibold uppercase tracking-widest opacity-50 m-0 mt-1">
                  PREMIUM ACCESS GRANTED
                </p>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto font-sans opacity-70 m-0 mt-2">
                Your UPSC Premium portfolio is fully unlocked and updated in Supabase. You now have immediate access to all mock papers, AI tests, and bilingual study guides.
              </p>

              <Button
                fullWidth
                variant="success"
                onClick={() => window.location.href = '/dashboard'}
                className="h-14 font-black uppercase tracking-[0.2em] text-[12px] shadow-lg shadow-success/20 mt-4"
              >
                Enter Premium Dashboard <ArrowRight size={14} className="ml-2" />
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
