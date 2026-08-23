import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  getAuthErrorMessage,
  supabaseConfigurationMessage,
} from "./authErrors";

type SignUpResult = {
  requiresEmailConfirmation: boolean;
};

type AuthContextValue = {
  authError: string;
  clearLocalSession: () => Promise<void>;
  clearAuthError: () => void;
  isConfigured: boolean;
  isInitializing: boolean;
  isSubmitting: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setIsInitializing(false);
      return;
    }

    let isMounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setIsInitializing(false);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;

      if (error) {
        console.error("[auth] Initial session check failed", error);
        setAuthError(getAuthErrorMessage(error));
      } else {
        setSession(data.session);
      }
      setIsInitializing(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const requireClient = () => {
    if (!supabase) {
      setAuthError(supabaseConfigurationMessage);
      throw new Error(supabaseConfigurationMessage);
    }
    return supabase;
  };

  const runAuthRequest = async <T,>(request: () => Promise<T>) => {
    setAuthError("");
    setIsSubmitting(true);
    try {
      return await request();
    } catch (error) {
      if (!(error instanceof Error && error.message === supabaseConfigurationMessage)) {
        console.error("[auth] Supabase request failed", error);
        setAuthError(getAuthErrorMessage(error));
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const signUp = (email: string, password: string) =>
    runAuthRequest(async () => {
      const client = requireClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      return { requiresEmailConfirmation: data.session === null };
    });

  const signIn = (email: string, password: string) =>
    runAuthRequest(async () => {
      const client = requireClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    });

  const signOut = () =>
    runAuthRequest(async () => {
      const client = requireClient();
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
    });

  const clearLocalSession = async () => {
    setAuthError("");
    try {
      await supabase?.auth.signOut({ scope: "local" });
    } catch {
      // The server-side account may already be gone. Always clear the UI session.
    } finally {
      setSession(null);
    }
  };

  const value: AuthContextValue = {
    authError,
    clearLocalSession,
    clearAuthError: () => setAuthError(""),
    isConfigured: isSupabaseConfigured,
    isInitializing,
    isSubmitting,
    session,
    signIn,
    signOut,
    signUp,
    user: session?.user ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
