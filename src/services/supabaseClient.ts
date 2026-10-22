// AICTE SmartVerify — Supabase Client Service
// SIH Problem Statement 26261

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseKey.includes('your-supabase-public-anon-key') &&
  supabaseUrl.startsWith('https://')
);

export const isSupabaseConfigured = (): boolean => isConfigured;


// Private storage bucket name as per specification
export const APPLICATION_DOCUMENTS_BUCKET = 'application-documents';

// Initialize client only when valid environment credentials are provided
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: isConfigured,
      autoRefreshToken: isConfigured,
      detectSessionInUrl: isConfigured
    }
  }
);

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
