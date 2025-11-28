import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DownloadProgress {
  current: number;
  total: number;
  status: string;
  currentFile: string;
}

interface StorageFile {
  bucket: string;
  filename: string;
  signed_url: string;
  size: number;
}

interface ExportResponse {
  files: StorageFile[];
  total_files: number;
}

const MAX_CONCURRENT_DOWNLOADS = 5;

export const useStorageDownload = () => {
  const [progress, setProgress] = useState<DownloadProgress>({
    current: 0,
    total: 0,
    status: 'idle',
    currentFile: '',
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadFile = async (file: StorageFile, retries = 2): Promise<{ file: StorageFile; blob: Blob | null }> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(file.signed_url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        return { file, blob };
      } catch (error) {
        if (attempt === retries) {
          console.error(`Failed to download ${file.bucket}/${file.filename}:`, error);
          return { file, blob: null };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    return { file, blob: null };
  };

  const downloadInBatches = async (
    files: StorageFile[],
    zip: JSZip,
    onProgress: (current: number, filename: string) => void
  ): Promise<{ success: number; failed: string[] }> => {
    let success = 0;
    const failed: string[] = [];
    
    for (let i = 0; i < files.length; i += MAX_CONCURRENT_DOWNLOADS) {
      const batch = files.slice(i, i + MAX_CONCURRENT_DOWNLOADS);
      const results = await Promise.all(batch.map(file => downloadFile(file)));
      
      for (const result of results) {
        if (result.blob) {
          const folderPath = `${result.file.bucket}/${result.file.filename}`;
          zip.file(folderPath, result.blob);
          success++;
        } else {
          failed.push(`${result.file.bucket}/${result.file.filename}`);
        }
        onProgress(success + failed.length, result.file.filename);
      }
    }
    
    return { success, failed };
  };

  const downloadStorageAsZip = useCallback(async () => {
    setIsDownloading(true);
    setProgress({ current: 0, total: 0, status: 'Lade Dateiliste...', currentFile: '' });

    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nicht angemeldet');
        setIsDownloading(false);
        return;
      }

      // Fetch signed URLs from edge function
      setProgress(prev => ({ ...prev, status: 'Hole signierte URLs...' }));
      
      const { data, error } = await supabase.functions.invoke<ExportResponse>('export-storage-urls', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Fehler beim Abrufen der URLs');
      }

      if (!data?.files || data.files.length === 0) {
        toast.info('Keine Dateien zum Herunterladen gefunden');
        setIsDownloading(false);
        return;
      }

      const files = data.files.filter((f): f is StorageFile => 
        !!f.signed_url && !!f.bucket && !!f.filename
      );

      if (files.length === 0) {
        toast.info('Keine gültigen Dateien gefunden');
        setIsDownloading(false);
        return;
      }

      setProgress({
        current: 0,
        total: files.length,
        status: 'Lade Dateien herunter...',
        currentFile: '',
      });

      // Create ZIP
      const zip = new JSZip();
      
      // Download files in batches
      const { success, failed } = await downloadInBatches(
        files,
        zip,
        (current, filename) => {
          setProgress(prev => ({
            ...prev,
            current,
            currentFile: filename,
          }));
        }
      );

      if (success === 0) {
        toast.error('Keine Dateien konnten heruntergeladen werden');
        setIsDownloading(false);
        return;
      }

      // Generate ZIP
      setProgress(prev => ({ ...prev, status: 'Erstelle ZIP-Archiv...' }));
      
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      // Calculate size
      const sizeMB = (zipBlob.size / (1024 * 1024)).toFixed(2);

      // Trigger download
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `escoria_storage_backup_${dateStr}.zip`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      // Success message
      if (failed.length > 0) {
        toast.warning(
          `${success} Dateien heruntergeladen (${sizeMB} MB). ${failed.length} Dateien fehlgeschlagen.`,
          { duration: 5000 }
        );
        console.warn('Failed files:', failed);
      } else {
        toast.success(
          `${success} Dateien erfolgreich als ZIP gespeichert (${sizeMB} MB)`,
          { duration: 5000 }
        );
      }

    } catch (error) {
      console.error('Storage download error:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Download');
    } finally {
      setIsDownloading(false);
      setProgress({ current: 0, total: 0, status: 'idle', currentFile: '' });
    }
  }, []);

  return {
    downloadStorageAsZip,
    progress,
    isDownloading,
  };
};
