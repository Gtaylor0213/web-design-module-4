import { useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  useCreateSubtask,
  useDeleteSubtask,
  useUpdateSubtask,
} from '@/hooks/useSubtasks';
import type { Subtask } from '@/lib/types';

interface SubtaskEditorProps {
  projectId: number;
  subtasks: Subtask[];
}

/** Inline editor for a project's subtasks, rendered inside the project
 *  edit dialog. Each interaction (add, toggle, delete) hits the API
 *  immediately; the parent ['projects'] cache is invalidated so the
 *  list updates everywhere the project shows. */
export function SubtaskEditor({ projectId, subtasks }: SubtaskEditorProps) {
  const create = useCreateSubtask(projectId);
  const update = useUpdateSubtask(projectId);
  const remove = useDeleteSubtask(projectId);

  const [draft, setDraft] = useState('');
  const completedCount = subtasks.filter((s) => s.completed).length;

  function add() {
    const title = draft.trim();
    if (!title) return;
    create.mutate(
      { title, completed: false },
      {
        onSuccess: () => setDraft(''),
        onError: (e) => toast.error(e.message),
      },
    );
  }

  function onAddKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  }

  function toggle(s: Subtask) {
    update.mutate(
      { id: s.id, body: { title: s.title, completed: !s.completed } },
      { onError: (e) => toast.error(e.message) },
    );
  }

  function del(s: Subtask) {
    remove.mutate(s.id, { onError: (e) => toast.error(e.message) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">Subtasks</p>
        {subtasks.length > 0 && (
          <p className="text-xs text-neutral-500">
            {completedCount} / {subtasks.length} done
          </p>
        )}
      </div>

      {subtasks.length > 0 && (
        <ul className="mb-2 divide-y divide-neutral-200 rounded-md border border-neutral-200 overflow-hidden">
          {subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2 px-3 py-2">
              <input
                id={`subtask-${s.id}`}
                type="checkbox"
                checked={s.completed}
                onChange={() => toggle(s)}
                className="h-4 w-4 accent-primary cursor-pointer"
              />
              <label
                htmlFor={`subtask-${s.id}`}
                className={
                  'flex-1 text-sm cursor-pointer ' +
                  (s.completed ? 'line-through text-neutral-400' : 'text-neutral-800')
                }
              >
                {s.title}
              </label>
              <button
                type="button"
                onClick={() => del(s)}
                className="p-1 rounded text-neutral-400 hover:text-destructive hover:bg-destructive/10"
                aria-label={`Delete subtask: ${s.title}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onAddKey}
          placeholder="Add a subtask…"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={!draft.trim() || create.isPending}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}
