import { toast as sonnerToast } from "sonner"
import type  { ToastOptions } from "sonner"

type Variant = "default" | "destructive" | "success" | "warning" | "info"

interface ToastInput {
  title: string
  description?: string
  variant?: Variant
  options?: ToastOptions
}

function toast({
  title,
  description,
  variant = "default",
  options = {},
}: ToastInput) {
  const variantMap: Record<Variant, ToastOptions["type"]> = {
    default: "default",
    destructive: "error",
    success: "success",
    warning: "warning",
    info: "info",
  }

  return sonnerToast(variantMap[variant] || "default", {
    description,
    ...options,
    title, // optional if your toast component handles a `title` separately
  })
}

function useToast() {
  return { toast }
}

export { useToast, toast }
