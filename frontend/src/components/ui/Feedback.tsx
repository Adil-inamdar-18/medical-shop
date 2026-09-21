import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />

      <p className="flex-1">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 font-medium hover:underline"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      <CheckCircle2 size={18} className="shrink-0" />
      {message}
    </div>
  );
}

export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-500">
      <Loader2 size={18} className="animate-spin" />
      {label}
    </div>
  );
}

export function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="px-6 py-12 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
