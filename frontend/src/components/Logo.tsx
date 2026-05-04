import { cn } from '@/lib/utils';

interface LogoProps {
  /** Tailwind sizing class — controls overall scale via font size. */
  className?: string;
}

/** Rolebook wordmark — "Role" in the primary brand color, "book" in
 *  near-black. Pure CSS so it scales, themes, and reads as real text to
 *  screen readers and search engines. */
export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn('font-bold tracking-tight whitespace-nowrap select-none', className)}
      aria-label="Rolebook"
    >
      <span className="text-primary">Role</span>
      <span className="text-neutral-900">book</span>
    </span>
  );
}
