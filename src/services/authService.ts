// AICTE SmartVerify — Authentication & Authorization Service
// SIH Problem Statement 26261

import { supabase, isConfigured } from './supabaseClient';
import { Profile, UserRole, Institution } from '../types';
import { SYNTHETIC_INSTITUTIONS } from '../data/syntheticDemoData';

const LOCAL_STORAGE_USER_KEY = 'aicte_smartverify_current_user';

export interface AuthUserSession {
  id: string;
  email: string;
  full_name: string;
  designation?: string;
  institution_id?: string;
  institution?: Institution;
  roles: UserRole[];
  isDemoSession: boolean;
}

// Built-in synthetic demo users for instant presentation & testing
export const DEMO_USERS: Record<string, AuthUserSession> = {
  institution: {
    id: 'user-inst-demo-1',
    email: 'registrar@niatr-demo.edu.in',
    full_name: 'Dr. Amitabh Verma',
    designation: 'Registrar & Authorized Representative',
    institution_id: 'inst-1',
    institution: SYNTHETIC_INSTITUTIONS[0],
    roles: ['institution'],
    isDemoSession: true
  },
  admin: {
    id: 'user-admin-demo-2',
    email: 'scrutiny.officer@aicte-india.org',
    full_name: 'Dr. V. K. Deshmukh',
    designation: 'Regional Scrutiny Officer (Northern Region)',
    roles: ['admin'],
    isDemoSession: true
  },
  super_admin: {
    id: 'user-superadmin-demo-3',
    email: 'director.approval@aicte-india.org',
    full_name: 'Prof. T. G. Chandrasekhar',
    designation: 'Member Secretary & Super Admin',
    roles: ['admin', 'super_admin'],
    isDemoSession: true
  }
};

class AuthService {
  private currentUser: AuthUserSession | null = null;
  private listeners: Array<(user: AuthUserSession | null) => void> = [];

  constructor() {
    // Restore session from localStorage if available
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      }
    } else {
      // Default to institution demo user so the app is immediately populated and usable
      this.currentUser = DEMO_USERS.institution;
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(this.currentUser));
    }
  }

  getCurrentUser(): AuthUserSession | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  isDemoMode(): boolean {
    return this.currentUser?.isDemoSession ?? true;
  }

  hasRole(role: UserRole): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.roles.includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('super_admin');
  }

  isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }

  subscribe(listener: (user: AuthUserSession | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // Switch demo user for fast inspection and testing between roles in demo mode
  setDemoUser(role: 'institution' | 'admin' | 'super_admin') {
    if (this.currentUser && !this.currentUser.isDemoSession) {
      console.warn('Role switcher cannot override a real authenticated Supabase session.');
      return;
    }
    this.currentUser = DEMO_USERS[role];
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(this.currentUser));
    this.notify();
  }

  /**
   * Public registration: ALWAYS assigns 'institution' role.
   * Public registration NEVER grants administrator privileges.
   */
  async register(
    email: string, 
    password: string, 
    fullName: string, 
    institutionCode?: string, 
    designation?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (isConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              designation: designation || 'Institution Coordinator'
            }
          }
        });

        if (error) return { success: false, error: error.message };

        if (data.user) {
          // Find matching institution or create profile
          const matchedInst = SYNTHETIC_INSTITUTIONS.find(i => i.code === institutionCode) || SYNTHETIC_INSTITUTIONS[0];

          // Insert into profiles
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: fullName,
            designation: designation || 'Institution Representative',
            institution_id: matchedInst.id
          });

          // Insert protected role: explicitly ONLY 'institution'
          await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: 'institution'
          });

          this.currentUser = {
            id: data.user.id,
            email,
            full_name: fullName,
            designation: designation || 'Institution Representative',
            institution_id: matchedInst.id,
            institution: matchedInst,
            roles: ['institution'],
            isDemoSession: false
          };
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(this.currentUser));
          this.notify();
          return { success: true };
        }
      }

      // Offline / Local demo fallback registration:
      const matchedInst = SYNTHETIC_INSTITUTIONS.find(i => i.code === institutionCode) || SYNTHETIC_INSTITUTIONS[0];
      this.currentUser = {
        id: `user-${Date.now()}`,
        email,
        full_name: fullName,
        designation: designation || 'Institution Representative',
        institution_id: matchedInst.id,
        institution: matchedInst,
        roles: ['institution'], // Strictly 'institution'
        isDemoSession: true
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(this.currentUser));
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (isConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Check if user specifically requested demo mode with demo credentials
          const foundDemoKey = Object.keys(DEMO_USERS).find(k => DEMO_USERS[k].email.toLowerCase() === email.toLowerCase());
          if (foundDemoKey) {
            this.setDemoUser(foundDemoKey as 'institution' | 'admin' | 'super_admin');
            return { success: true };
          }
          return { success: false, error: error.message };
        }

        if (data.user) {
          // Fetch user profile and roles strictly from database
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const { data: roleRecords } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id);

          const roles: UserRole[] = (roleRecords && roleRecords.length > 0)
            ? (roleRecords.map(r => r.role as UserRole))
            : ['institution'];

          let institution: Institution | undefined;
          if (profile?.institution_id) {
            const { data: instData } = await supabase
              .from('institutions')
              .select('*')
              .eq('id', profile.institution_id)
              .single();
            institution = instData || undefined;
          }

          this.currentUser = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: profile?.full_name || 'Authenticated User',
            designation: profile?.designation,
            institution_id: profile?.institution_id,
            institution,
            roles,
            isDemoSession: false
          };
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(this.currentUser));
          this.notify();
          return { success: true };
        }
      }

      // Match demo user credentials for offline evaluation
      const foundDemoKey = Object.keys(DEMO_USERS).find(k => DEMO_USERS[k].email.toLowerCase() === email.toLowerCase());
      if (foundDemoKey) {
        this.setDemoUser(foundDemoKey as 'institution' | 'admin' | 'super_admin');
        return { success: true };
      }

      // Generic demo sign in strictly as institution user (NEVER admin)
      this.currentUser = {
        id: `user-${Date.now()}`,
        email,
        full_name: email.split('@')[0],
        roles: ['institution'], // Cannot obtain admin role via arbitrary email
        institution_id: 'inst-1',
        institution: SYNTHETIC_INSTITUTIONS[0],
        isDemoSession: true
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(this.currentUser));
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign in failed' };
    }
  }

  async signOut(): Promise<void> {
    if (isConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('SignOut exception:', e);
      }
    }
    this.currentUser = null;
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    this.notify();
  }

  /**
   * Super Admin Bootstrap procedure
   */
  async bootstrapSuperAdmin(userId: string, token: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (isConfigured) {
        const { data, error } = await supabase.rpc('bootstrap_initial_super_admin', {
          p_user_id: userId,
          p_bootstrap_token: token
        });

        if (error) return { success: false, error: error.message };
        return data as { success: boolean; message?: string; error?: string };
      }

      if (token === 'AICTE_SUPER_ADMIN_INIT_SECURE_TOKEN_2026') {
        if (this.currentUser) {
          this.currentUser.roles = ['admin', 'super_admin'];
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(this.currentUser));
          this.notify();
        }
        return { success: true, message: 'Super admin role successfully bootstrapped.' };
      }
      return { success: false, error: 'Invalid bootstrap token.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Bootstrap failed' };
    }
  }
}

export const authService = new AuthService();
