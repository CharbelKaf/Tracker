/**
 * Utility to merge class names conditionally
 * Acts as a lightweight replacement for clsx + tailwind-merge
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}