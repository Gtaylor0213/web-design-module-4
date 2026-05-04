import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Settings() {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Edit your role title, change your password, and manage ownership transfer.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-500">Settings UI coming in the next phase.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
