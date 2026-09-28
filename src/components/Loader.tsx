import type { FC } from 'react';
import { Spinner } from './common/Spinner';

/* Phase 5.4F (D-172) — Loader delegates to the ONE Spinner (large). The
   unstyled book-loader markup was removed (LG-2). The AuthContext/Guards
   wrappers own their fixed backdrop and centering; consumers are unchanged. */
const Loader: FC = () => {
  return <Spinner size="lg" />;
};

export default Loader;
