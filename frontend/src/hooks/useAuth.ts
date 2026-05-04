import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, clearToken, getToken, setToken } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types';

const ME_KEY = ['auth', 'me'] as const;

/** Fetches the currently authenticated user via GET /api/auth/me.
 *  Returns isLoading until we know one way or the other; isError + 401-like
 *  status means the caller should be treated as logged out. */
export function useMe() {
  return useQuery<User, Error>({
    queryKey: ME_KEY,
    queryFn: () => api<User>('/api/auth/me'),
    enabled: !!getToken(),
    retry: false,
    staleTime: 60_000,
  });
}

interface SignupInput {
  email: string;
  password: string;
  name: string;
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation<AuthResponse, Error, SignupInput>({
    mutationFn: (input) =>
      api<AuthResponse>('/api/auth/signup', { method: 'POST', body: input, anonymous: true }),
    onSuccess: ({ user, token }) => {
      setToken(token);
      qc.setQueryData<User>(ME_KEY, user);
    },
  });
}

interface LoginInput {
  email: string;
  password: string;
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: (input) =>
      api<AuthResponse>('/api/auth/login', { method: 'POST', body: input, anonymous: true }),
    onSuccess: ({ user, token }) => {
      setToken(token);
      qc.setQueryData<User>(ME_KEY, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation<void, Error>({
    mutationFn: async () => {
      try {
        await api<{ status: string }>('/api/auth/logout', { method: 'POST' });
      } finally {
        clearToken();
      }
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: ME_KEY });
      qc.clear();
    },
  });
}
