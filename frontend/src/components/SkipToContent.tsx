/** First focusable element on every page. Hidden by default; visible (and
 *  jumps the keyboard user past header/nav) when focused via Tab. */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded-md focus:shadow-md"
    >
      Skip to main content
    </a>
  );
}
