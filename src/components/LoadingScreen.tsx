export default function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-app-bg overflow-hidden transition-colors duration-700`}>
      {/* Ambient Pulsing Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] animate-pulse delay-700" />
      
      <div className="relative z-10 flex flex-col items-center scale-90 md:scale-100 transition-transform duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          {message && (
            <span className="text-base font-semibold text-text-secondary">{message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
