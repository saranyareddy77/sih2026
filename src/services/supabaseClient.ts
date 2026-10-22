// AICTE SmartVerify — Supabase Client Service
// SIH Problem Statement 26261

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nyzhayxwntecvhpwiwwo.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55emhheXh3bnRlY3ZocHdpd3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2Njk1OTEsImV4cCI6MjEwODI0NTU5MX0._WA9QvYcU7O2wGUUYhMoCuO4-RfNvSd0bJ680itMznQ';

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseKey.includes('your-supabase-public-anon-key')
);

// Private storage bucket name as per specification
export const APPLICATION_DOCUMENTS_BUCKET = 'application-documents';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Creates a short-lived signed URL for authorized preview of documents in private storage.
 * Lifetime: 300 seconds (5 minutes).
 */
export async function getDocumentSignedUrl(filePath: string, expiresInSeconds: number = 300): Promise<string | null> {
  if (!isConfigured) return null;
  try {
    const { data, error } = await supabase.storage
      .from(APPLICATION_DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      console.warn('Storage signed URL notice:', error.message);
      return null;
    }
    return data?.signedUrl || null;
  } catch (err) {
    console.warn('Error fetching signed URL:', err);
    return null;
  }
}
