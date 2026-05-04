import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { apiBlob } from '@/lib/api';

interface ExportPdfButtonProps {
  variant?: 'ghost' | 'default' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

/** Calls GET /api/rolebook/export, gets a PDF blob and the suggested
 *  filename, and triggers a download via a synthetic anchor. */
export function ExportPdfButton({
  variant = 'ghost',
  size = 'sm',
  showLabel = false,
}: ExportPdfButtonProps) {
  const [pending, setPending] = useState(false);

  async function exportPdf() {
    setPending(true);
    try {
      const { blob, filename } = await apiBlob('/api/rolebook/export');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? 'rolebook.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to export PDF');
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={exportPdf}
      disabled={pending}
      title="Export to PDF"
    >
      <Download className="h-4 w-4" />
      {showLabel && <span className="ml-2">{pending ? 'Generating…' : 'Export to PDF'}</span>}
      {!showLabel && <span className="sr-only">Export to PDF</span>}
    </Button>
  );
}
