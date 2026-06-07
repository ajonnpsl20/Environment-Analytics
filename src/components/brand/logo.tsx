import { cn } from "@/lib/utils";

/** EnviroHub logo mark — a leaf inside a rounded badge. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19 4c-7 0-12 3.5-12 10 0 1.2.2 2.3.6 3.3L5 20l1.4 1.4 2.7-2.6c1 .4 2.1.6 3.3.6 6.5 0 8.6-5 8.6-12 0-1.2-.1-2.3-2-3.4Z"
          fill="currentColor"
          opacity="0.9"
        />
        <path
          d="M18 7c-4.5 1-7.5 3.8-9 8"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      {showWordmark && (
        <span className="font-heading text-lg font-semibold tracking-tight">
          Enviro<span className="text-primary">Hub</span>
        </span>
      )}
    </span>
  );
}
