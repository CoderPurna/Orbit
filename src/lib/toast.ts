import { toast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/api-client";

/**
 * Small wrappers around the Base UI toast manager so call sites stay terse
 * and every toast carries a `type` the ToastIcon understands.
 */
export const notify = {
  success(title: string, description?: string) {
    return toast.add({ title, description, type: "success" });
  },
  info(title: string, description?: string) {
    return toast.add({ title, description, type: "info" });
  },
  warning(title: string, description?: string) {
    return toast.add({ title, description, type: "warning" });
  },
  error(title: string, error?: unknown) {
    return toast.add({
      title,
      description: error !== undefined ? errorMessage(error) : undefined,
      type: "error",
      timeout: 8000,
    });
  },
  /** Persistent toast the caller closes explicitly (e.g. a knock). */
  sticky(opts: {
    title: string;
    description?: string;
    type?: "info" | "warning" | "success";
    actionLabel?: string;
    onAction?: () => void;
  }) {
    return toast.add({
      title: opts.title,
      description: opts.description,
      type: opts.type ?? "info",
      timeout: 0,
      actionProps: opts.actionLabel
        ? { children: opts.actionLabel, onClick: opts.onAction }
        : undefined,
    });
  },
  close(id: string) {
    toast.close(id);
  },
};
