import { useEffect } from 'react';

/** Sets document.title for the lifetime of the component. Restores the
 *  previous title on unmount so back-navigation reads correctly to a
 *  screen reader. */
export function usePageTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
