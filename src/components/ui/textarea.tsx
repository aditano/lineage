import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-56 w-full resize-y rounded-lg bg-transparent px-0 py-0 font-display text-lg leading-relaxed text-fg placeholder:text-faint focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:min-h-72 md:text-xl",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
