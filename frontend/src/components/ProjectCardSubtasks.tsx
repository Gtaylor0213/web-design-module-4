import { useUpdateSubtask } from '@/hooks/useSubtasks';
import { cn } from '@/lib/utils';
import type { Project, Subtask } from '@/lib/types';

interface ProjectCardSubtasksProps {
  project: Project;
}

/** Compact, interactive subtask list rendered inside a project card. Each
 *  checkbox toggles the subtask's completed flag in place via the API.
 *  The label and checkbox swallow click events so toggling doesn't also
 *  trigger the card's "click to open" affordance. */
export function ProjectCardSubtasks({ project }: ProjectCardSubtasksProps) {
  const update = useUpdateSubtask(project.id);

  if (!project.subtasks || project.subtasks.length === 0) return null;

  function toggle(s: Subtask) {
    update.mutate({
      id: s.id,
      body: { title: s.title, completed: !s.completed },
    });
  }

  return (
    <div>
      <p className="text-xs font-medium text-neutral-500 mb-1.5">Subtasks</p>
      <ul className="space-y-1">
        {project.subtasks.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.completed}
              onChange={() => toggle(s)}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5 accent-primary cursor-pointer"
              aria-label={s.completed ? `Mark ${s.title} not done` : `Mark ${s.title} done`}
            />
            <span
              className={cn(
                'flex-1 leading-snug',
                s.completed ? 'line-through text-neutral-400' : 'text-neutral-700',
              )}
            >
              {s.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
