
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  fullPage?: boolean;
  className?: string;
  size?: number;
}

const LoadingSpinner = ({ fullPage = false, className, size = 48 }: LoadingSpinnerProps) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
        <Loader2 className={cn("animate-spin text-primary", className)} size={size} />
      </div>
    );
  }
  return <Loader2 className={cn("animate-spin text-primary", className)} size={size} />;
};

export default LoadingSpinner;
