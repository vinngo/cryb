"use client";

import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

export function useToast() {
  const toast = (props: ToastProps) => {
    const { title, description, variant = "default" } = props;
    
    if (variant === "destructive") {
      return sonnerToast.error(title, {
        description,
      });
    } else if (variant === "success") {
      return sonnerToast.success(title, {
        description,
      });
    } else {
      return sonnerToast(title, {
        description,
      });
    }
  };

  return {
    toast,
  };
}