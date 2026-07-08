import { useNavigate } from 'react-router-dom';
import { Button } from './AntigravityUI';

interface ErrorActionButtonsProps {
  className?: string;
}

export function ErrorActionButtons({ className = '' }: ErrorActionButtonsProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
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
