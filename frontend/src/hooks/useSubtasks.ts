import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Subtask } from '@/lib/types';

interface SubtaskInput {
  title: string;
  completed: boolean;
}

/** Subtasks live under a project so all the hooks take a projectId. After
 *  any mutation we invalidate the parent ['projects'] cache so the
 *  inline subtasks array refreshes wherever it's used. */

export function useCreateSubtask(projectId: number) {
  const qc = useQueryClient();
  return useMutation<Subtask, Error, SubtaskInput>({
    mutationFn: (input) =>
      api<Subtask>(`/api/projects/${projectId}/subtasks`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateSubtask(projectId: number) {
  const qc = useQueryClient();
  return useMutation<Subtask, Error, { id: number; body: SubtaskInput }>({
    mutationFn: ({ id, body }) =>
      api<Subtask>(`/api/projects/${projectId}/subtasks/${id}`, {
        method: 'PUT',
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteSubtask(projectId: number) {
  const qc = useQueryClient();
  return useMutation<{ status: string }, Error, number>({
    mutationFn: (id) =>
      api<{ status: string }>(`/api/projects/${projectId}/subtasks/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
