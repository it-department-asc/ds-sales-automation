'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Check, X, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  duration?: number; // Auto-close duration in ms (optional)
  showIcon?: boolean;
  showCloseButton?: boolean;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }[];
}

export function SuccessErrorModal({ 
  open, 
  onOpenChange, 
  type, 
  title, 
  message, 
  duration,
  showIcon = true,
  showCloseButton = true,
  actions
}: SuccessErrorModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  // Handle auto-close if duration is provided
  useEffect(() => {
    if (open && duration) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration]);

  // Animation states
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimating(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => onOpenChange(false), 200);
  };

  const handleContinue = () => {
    // Close modal
    handleClose();
    // Dispatch a global event so pages can react (e.g., trigger refresh)
    try {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('success-modal-continue', { detail: { type, title, message } }));
      }
    } catch (e) {
      // ignore
    }
    // Try to refresh the current route directly
    try {
      if (router && typeof (router as any).refresh === 'function') {
        (router as any).refresh();
      }
    } catch (e) {
      // ignore
    }
  };

  const config = {
    success: {
      icon: <CheckCircle className="w-12 h-12" />,
      color: "text-emerald-600 dark:text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      ringColor: "ring-emerald-500/20",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700",
      gradient: "from-emerald-400 to-emerald-600",
    },
    error: {
      icon: <XCircle className="w-12 h-12" />,
      color: "text-rose-600 dark:text-rose-500",
      bgColor: "bg-rose-50 dark:bg-rose-950/30",
      borderColor: "border-rose-200 dark:border-rose-800",
      ringColor: "ring-rose-500/20",
      buttonColor: "bg-rose-600 hover:bg-rose-700",
      gradient: "from-rose-400 to-rose-600",
    },
    warning: {
      icon: <AlertCircle className="w-12 h-12" />,
      color: "text-amber-600 dark:text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800",
      ringColor: "ring-amber-500/20",
      buttonColor: "bg-amber-600 hover:bg-amber-700",
      gradient: "from-amber-400 to-amber-600",
    },
  }[type];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          "sm:max-w-md p-0 overflow-hidden border-0",
          "transition-all duration-300 ease-out",
          isVisible && "opacity-100 scale-100",
          !isVisible && "opacity-0 scale-95"
        )}
      >
        {/* Animated background effect */}
        <div className={cn(
          "absolute inset-0 opacity-10",
          type === 'success' && "bg-emerald-500",
          type === 'error' && "bg-rose-500",
          type === 'warning' && "bg-amber-500"
        )} />
        
        {/* Decorative elements */}
        {type === 'success' && (
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 opacity-20">
            <Sparkles className="w-24 h-24 text-emerald-400" />
          </div>
        )}
        
        <div className={cn(
          "relative p-6",
          config.bgColor,
          config.borderColor,
          "border rounded-lg",
          "ring-4",
          config.ringColor
        )}>
          <DialogHeader className="space-y-4">
            <DialogTitle className="sr-only">{title}</DialogTitle>
            {/* Icon and Title */}
            <div className="flex flex-col items-center space-y-4">
              {showIcon && (
                <div className={cn(
                  "relative",
                  isAnimating && "animate-bounce-once"
                )}>
                  <div className={cn(
                    "p-3 rounded-full",
                    config.bgColor,
                    "border-2",
                    config.borderColor,
                    "shadow-lg"
                  )}>
                    {config.icon}
                  </div>
                  
                  {/* Icon badge */}
                  <div className={cn(
                    "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
                    config.color,
                    "bg-white dark:bg-gray-900",
                    "border-2 border-white dark:border-gray-900"
                  )}>
                    {type === 'success' && <Check className="w-3 h-3" />}
                    {type === 'error' && <X className="w-3 h-3" />}
                    {type === 'warning' && <AlertCircle className="w-3 h-3" />}
                  </div>
                </div>
              )}
              
              <div className="text-center space-y-2">
                <h3 className={cn(
                  "text-2xl font-bold tracking-tight",
                  config.color
                )}>
                  {title}
                </h3>
                
                {/* Progress bar for auto-close */}
                {duration && (
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300 ease-linear",
                        type === 'success' && "bg-emerald-500",
                        type === 'error' && "bg-rose-500",
                        type === 'warning' && "bg-amber-500"
                      )}
                      style={{ 
                        width: open ? '0%' : '100%',
                        transition: `width ${duration}ms linear`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Message */}
          <div className="mt-6 text-center">
            <p className={cn(
              "text-lg leading-relaxed",
              type === 'success' && "text-emerald-700 dark:text-emerald-300",
              type === 'error' && "text-rose-700 dark:text-rose-300",
              type === 'warning' && "text-amber-700 dark:text-amber-300"
            )}>
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className={cn(
            "mt-8 flex gap-3",
            actions ? "justify-between" : "justify-center"
          )}>
            {actions ? (
              <>
                {showCloseButton && (
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={() => {
                      action.onClick();
                      handleClose();
                    }}
                    variant={action.variant || (type === 'error' ? 'destructive' : 'default')}
                    className={cn(
                      "flex-1",
                      !action.variant && config.buttonColor
                    )}
                  >
                    {action.label}
                  </Button>
                ))}
              </>
            ) : (
              <>
                {showCloseButton && (
                  <Button
                    onClick={handleContinue}
                    className={cn(
                      "px-8 py-6 text-lg font-semibold shadow-lg transition-all hover:scale-105",
                      config.buttonColor
                    )}
                  >
                      Continue
                  </Button>
                )}
              </>
            )}
          </div>
          
          {/* Auto-close hint */}
          {duration && (
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              This dialog will close automatically in {duration/1000} seconds
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}