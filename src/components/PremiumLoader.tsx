import type { FC } from 'react';
import { LoadingOverlay } from './common/SharedComponents';

/* Phase 5.4F (D-172) — PremiumLoader delegates to the ONE LoadingOverlay
   (inline variant). The gold duplicate spinner was removed (LG-1). The
   App.tsx PageLoader consumer is unchanged. */
const PremiumLoader: FC = () => {
  return <LoadingOverlay fullScreen={false} message="Loading" />;
};

export default PremiumLoader;
