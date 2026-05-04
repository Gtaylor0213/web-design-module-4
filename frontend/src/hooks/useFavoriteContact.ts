import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Contact } from '@/lib/types';

/** Dedicated mutation for toggling a contact's favorite flag without
 *  having to send the whole contact body. */
export function useFavoriteContact() {
  const qc = useQueryClient();
  return useMutation<Contact, Error, { id: number; favorite: boolean }>({
    mutationFn: ({ id, favorite }) =>
      api<Contact>(`/api/contacts/${id}/favorite`, {
        method: 'PUT',
        body: { favorite },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
