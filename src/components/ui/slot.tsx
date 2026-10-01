import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

type SlotProps = React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode };

/** Minimal Radix-style Slot: merges its props onto its single child element. */
export function Slot({ children, className, ...props }: SlotProps) {
  if (!isValidElement<{ className?: string }>(children)) return null;
  return cloneElement(children, {
    ...props,
    ...children.props,
    className: cn(className, children.props.className),
  });
}
