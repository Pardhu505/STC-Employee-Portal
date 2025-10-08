import * as React from "react";
import { cn } from "../../lib/utils";

const Textarea = React.forwardRef(
  ({ className, onSend, isConnected = true, ...props }, ref) => {
    const [value, setValue] = React.useState("");

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // Prevent newline
        if (value.trim() && onSend) {
          onSend(value.trim()); // send message
          setValue(""); // clear after send
        }
      }
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!isConnected} // disable if WS is not ready
        placeholder={isConnected ? "Type your message..." : "Connecting..."}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
