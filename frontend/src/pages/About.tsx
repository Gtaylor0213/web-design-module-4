import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';

export function About() {
  usePageTitle('About · Rolebook');

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 mb-3">
        About Rolebook
      </h1>
      <p className="text-lg text-neutral-700 leading-relaxed mb-12 max-w-2xl">
        The structured knowledge base for jobs that don&rsquo;t fit neatly into existing tools.
      </p>

      <Section title="Why this exists">
        <p>
          Most jobs come with a tangle of contacts, ongoing projects, recurring tasks, software
          accounts, and learned knowledge that has no single home. The cost shows up in two
          places:
        </p>
        <ul>
          <li>
            <strong>Day-to-day:</strong> time wasted hunting for the thing you know you saw
            somewhere &mdash; in a notes app, a Slack thread, an email, a sticky note.
          </li>
          <li>
            <strong>At transitions:</strong> writing a frantic handoff document from scratch
            when you leave the role &mdash; or worse, leaving your successor to reconstruct
            everything from nothing.
          </li>
        </ul>
        <p>
          Rolebook solves both by giving you a structured ongoing knowledge base that doubles
          as a handoff artifact when you leave.
        </p>
      </Section>

      <Section title="Who it&rsquo;s for">
        <p>
          People in roles with significant ongoing responsibility &mdash; graduate assistants,
          knowledge workers, managers, coordinators, anyone whose job involves managing a web
          of contacts, projects, recurring obligations, and accumulated know-how.
        </p>
        <p>
          The common thread is having a job that is too complex to keep entirely in your head
          but not structured enough to fit neatly into existing tools like a project manager
          or a CRM.
        </p>
      </Section>

      <Section title="What you can do with it">
        <ul>
          <li>
            <strong>Capture what matters in five sections.</strong> Contacts, projects,
            software, recurring tasks, and notes &mdash; each with the specific fields that
            actually come up in the work, not generic everything-and-the-kitchen-sink fields.
          </li>
          <li>
            <strong>Search and filter.</strong> Every section has a search box. The dashboard
            overview surfaces favorited contacts, upcoming deadlines, and recently-touched
            entries.
          </li>
          <li>
            <strong>Export at any time.</strong> Generate a PDF of your entire Rolebook for
            archives, sharing, or handoff to someone outside the system.
          </li>
          <li>
            <strong>Transfer ownership.</strong> When you leave the role, hand the whole
            Rolebook to a successor by email. They keep building on it &mdash; no
            reconstruction, no lost context.
          </li>
        </ul>
      </Section>

      <Section title="What it isn&rsquo;t">
        <ul>
          <li>
            <strong>Not a CRM.</strong> Contacts are personal notes about people, not a sales
            pipeline.
          </li>
          <li>
            <strong>Not a task manager.</strong> Recurring tasks are reminders of what the
            role involves, not assignments with due dates.
          </li>
          <li>
            <strong>Not collaborative.</strong> One owner at a time, no shared editing &mdash;
            the data model is designed for handoff, not real-time collaboration.
          </li>
        </ul>
      </Section>

      <div className="rounded-md border border-primary/20 bg-primary/5 p-6 mt-12">
        <p className="font-medium text-neutral-900 mb-3">Ready to start?</p>
        <Button asChild>
          <Link to="/signup">
            Create your Rolebook
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold tracking-tight text-neutral-900 mb-3">{title}</h2>
      <div className="space-y-3 text-neutral-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul_li]:leading-relaxed [&_strong]:text-neutral-900">
        {children}
      </div>
    </section>
  );
}
