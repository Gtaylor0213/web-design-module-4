import { Link } from 'react-router-dom';
import { ArrowRight, BookMarked } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <div className="flex items-center gap-2 text-neutral-700 mb-6">
          <BookMarked className="h-5 w-5" />
          <span className="font-semibold tracking-tight">Rolebook</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900 mb-4">
          A personal knowledge base for your role.
        </h1>

        <p className="text-lg text-neutral-700 leading-relaxed mb-8 max-w-2xl">
          Rolebook gives people in complex roles — graduate assistants, managers, coordinators —
          a structured place to organize the contacts, projects, software, recurring tasks,
          and notes that come with the job. When the role passes to someone else, the same
          Rolebook becomes the handoff document, exportable to PDF or transferable to a
          successor's account.
        </p>

        <div className="flex flex-wrap gap-3 mb-12">
          <Button asChild size="lg">
            <Link to="/signup">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">Log in</Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm text-neutral-700">
          <FeatureRow title="Five sections, one home">
            Contacts, projects, software, recurring tasks, and notes — each with the fields
            that actually matter.
          </FeatureRow>
          <FeatureRow title="Tabbed dashboard">
            Switch sections in one click. No nested folders, no scrolling through everything.
          </FeatureRow>
          <FeatureRow title="Export to PDF">
            Get a clean printout of your whole Rolebook for archives or handoff.
          </FeatureRow>
          <FeatureRow title="Transfer ownership">
            Pass your Rolebook to a successor by email so they can keep building on it.
          </FeatureRow>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-white border border-neutral-200 p-4">
      <p className="font-medium text-neutral-900 mb-1">{title}</p>
      <p className="text-neutral-600 leading-relaxed">{children}</p>
    </div>
  );
}
