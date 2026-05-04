import { useQuery } from '@tanstack/react-query';

type Health = { status: string; service: string };

async function fetchHealth(): Promise<Health> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`health check failed: ${res.status}`);
  return res.json();
}

export function App() {
  const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center px-6">
      <div className="max-w-lg w-full">
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Rolebook</h1>
        <p className="text-neutral-600 italic mb-6">A personal knowledge base for your role.</p>
        <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            React app + API health
          </h2>
          {health.isLoading && <p className="text-neutral-600">Loading…</p>}
          {health.isError && (
            <p className="text-red-600">Error: {(health.error as Error).message}</p>
          )}
          {health.data && (
            <pre className="text-sm font-mono text-neutral-800 bg-neutral-100 rounded px-3 py-2 overflow-x-auto">
              {JSON.stringify(health.data, null, 2)}
            </pre>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-6">
          Module 6 scaffold — pages will replace this. Hello World ✓
        </p>
      </div>
    </div>
  );
}
