import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-border placeholder:text-muted-foreground focus:border-brand-600 focus:ring-brand-200 h-11 w-full rounded-md border bg-white px-3 text-base focus:ring-2 focus:outline-none disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-border focus:border-brand-600 focus:ring-brand-200 h-11 w-full rounded-md border bg-white px-3 text-base focus:ring-2 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1 block text-sm font-medium", className)} {...props} />;
}
