import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import type { Rolebook, TransferResponse } from '@/lib/types';

export const ROLEBOOK_KEY = ['rolebook'] as const;

/** Fetches the authenticated user's rolebook. A 404 response means the user
 *  has no rolebook yet (the frontend should show onboarding); we surface
 *  that as `null` rather than an error so the caller can branch on it. */
export function useRolebook() {
  return useQuery<Rolebook | null, Error>({
    queryKey: ROLEBOOK_KEY,
    queryFn: async () => {
      try {
        return await api<Rolebook>('/api/rolebook');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404 && err.code === 'not_setup') {
          return null;
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useCreateRolebook() {
  const qc = useQueryClient();
  return useMutation<Rolebook, Error, { role_title: string }>({
    mutationFn: (input) =>
      api<Rolebook>('/api/rolebook', { method: 'POST', body: input }),
    onSuccess: (rolebook) => {
      qc.setQueryData<Rolebook | null>(ROLEBOOK_KEY, rolebook);
    },
  });
}

export function useUpdateRolebook() {
  const qc = useQueryClient();
  return useMutation<Rolebook, Error, { role_title: string }>({
    mutationFn: (input) =>
      api<Rolebook>('/api/rolebook', { method: 'PUT', body: input }),
    onSuccess: (rolebook) => {
      qc.setQueryData<Rolebook | null>(ROLEBOOK_KEY, rolebook);
    },
  });
}

export function useTransferRolebook() {
  return useMutation<TransferResponse, Error, { new_owner_email: string }>({
    mutationFn: (input) =>
      api<TransferResponse>('/api/rolebook/transfer', { method: 'POST', body: input }),
  });
}
