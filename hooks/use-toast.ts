import { useState, useCallback } from "react";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const toast = useCallback((props: ToastProps) => {
    // Simple alert-based toast for now
    // In production, you'd use a proper toast library like sonner or react-hot-toast
    if (props.variant === "destructive") {
      alert(`❌ ${props.title}\n${props.description || ""}`);
    } else {
      alert(`✓ ${props.title}\n${props.description || ""}`);
    }
  }, []);

  return { toast };
}
