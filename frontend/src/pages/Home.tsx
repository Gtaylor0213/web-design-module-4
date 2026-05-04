import { Link } from 'react-router-dom';
import { ArrowRight, Users, FolderKanban, AppWindow, Repeat, NotebookPen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';

export function Home() {
  usePageTitle('Rolebook · A personal knowledge base for your role');

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900 mb-4">
        A personal knowledge base for your role.
      </h1>

      <p className="text-lg text-neutral-700 leading-relaxed mb-8 max-w-2xl">
        Rolebook gives people in complex roles &mdash; graduate assistants, managers,
        coordinators &mdash; a structured place to organize the contacts, projects, software,
        recurring tasks, and notes that come with the job. When the role passes to someone
        else, the same Rolebook becomes the handoff document.
      </p>

      <div className="flex flex-wrap gap-3 mb-16">
        <Button asChild size="lg">
          <Link to="/signup">
            Get started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/about">Learn more</Link>
        </Button>
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-neutral-900 mb-4">
        Five sections, one home
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-neutral-700 mb-12">
        <FeatureRow icon={Users} title="Contacts">
          People you work with, how they prefer to communicate, things to keep in mind.
        </FeatureRow>
        <FeatureRow icon={FolderKanban} title="Projects">
          Bounded work with status (active, on hold, done) and an optional deadline.
        </FeatureRow>
        <FeatureRow icon={AppWindow} title="Software">
          Tools and accounts &mdash; with a pointer to where the credentials are stored.
        </FeatureRow>
        <FeatureRow icon={Repeat} title="Recurring tasks">
          Ongoing obligations with a cadence: weekly, monthly, semester, ad-hoc.
        </FeatureRow>
        <FeatureRow icon={NotebookPen} title="Notes">
          Freeform knowledge that doesn&rsquo;t fit anywhere else.
        </FeatureRow>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">
          Built for the day you hand it off
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Export your full Rolebook as a PDF anytime, or transfer ownership to a successor by
          email. Their account picks up where yours left off &mdash; nothing gets lost, nothing
          gets reconstructed from scratch.
        </p>
      </div>
    </div>
  );
}

interface FeatureRowProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}

function FeatureRow({ icon: Icon, title, children }: FeatureRowProps) {
  return (
    <div className="rounded-md bg-white border border-neutral-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
        <p className="font-medium text-neutral-900">{title}</p>
      </div>
      <p className="text-neutral-600 leading-relaxed">{children}</p>
    </div>
  );
}
