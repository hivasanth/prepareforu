import { Button } from './AntigravityUI';

interface ErrorActionButtonsProps {
  className?: string;
  onBack?: () => void;
}

export function ErrorActionButtons({ className = '', onBack }: ErrorActionButtonsProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 ${className}`}>
      <Button variant="secondary" onClick={handleBack} fullWidth>
        Back
      </Button>
      <Button variant="primary" onClick={() => window.location.reload()} fullWidth>
        Reload Page
      </Button>
    </div>
  );
}
