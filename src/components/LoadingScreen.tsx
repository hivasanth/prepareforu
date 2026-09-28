import { LoadingOverlay } from './common/SharedComponents'

/* Phase 5.4F (D-172) — LoadingScreen delegates to the ONE LoadingOverlay
   (full-screen + ambient + message). Raw delay-700 was tokenized (LG-4/LG-5).
   The AuthCallbackPage consumer is unchanged. */
export default function LoadingScreen({ message }: { message?: string }) {
  return <LoadingOverlay fullScreen ambient message={message} />
}
