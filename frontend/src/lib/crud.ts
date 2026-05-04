import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './api';

/** Generic CRUD hooks for any list-of-entries-under-a-rolebook resource.
 *  All section endpoints (/api/contacts, /api/projects, /api/software,
 *  /api/recurring-tasks, /api/notes) follow the exact same shape so we
 *  parameterize over the URL segment.
 *
 *  Cache invalidation is keyed on the resource string, so creating a
 *  contact only invalidates contacts.
 */

export function useEntities<T>(resource: string, query?: Record<string, string>) {
  const params =
    query && Object.keys(query).length > 0 ? '?' + new URLSearchParams(query).toString() : '';
  return useQuery<T[], Error>({
    queryKey: [resource, query ?? {}],
    queryFn: () => api<T[]>(`/api/${resource}${params}`),
  });
}

export function useCreateEntity<T, In>(resource: string) {
  const qc = useQueryClient();
  return useMutation<T, Error, In>({
    mutationFn: (input) => api<T>(`/api/${resource}`, { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [resource] });
    },
  });
}

export function useUpdateEntity<T, In>(resource: string) {
  const qc = useQueryClient();
  return useMutation<T, Error, { id: number; body: In }>({
    mutationFn: ({ id, body }) =>
      api<T>(`/api/${resource}/${id}`, { method: 'PUT', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [resource] });
    },
  });
}

export function useDeleteEntity(resource: string) {
  const qc = useQueryClient();
  return useMutation<{ status: string }, Error, number>({
    mutationFn: (id) => api<{ status: string }>(`/api/${resource}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [resource] });
    },
  });
}
