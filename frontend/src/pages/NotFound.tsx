import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';

export function NotFound() {
  usePageTitle('Page not found · Rolebook');
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-sm font-medium text-primary mb-2">404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-3">
          Page not found
        </h1>
        <p className="text-neutral-600 mb-6">
          The link you followed may be broken, or the page may have been removed.
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
