// AICTE SmartVerify — Supabase Client Service
// SIH Problem Statement 26261

import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    const proc = (globalThis as any).process;
    if (proc && proc.env && proc.env[key]) {
      return proc.env[key] as string;
    }
  } catch {
    // fallback
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');

// Polyfill WebSocket for Node.js test environments if absent
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    readonly readyState = 3;
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

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
