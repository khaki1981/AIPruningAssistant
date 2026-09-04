import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  getAuthErrorMessage,
  supabaseConfigurationMessage,
} from "./authErrors";
import {
  getPasswordResetRedirectUrl,
  isPasswordResetRouteRequested,
  PasswordRecoveryUnavailableError,
  type PasswordRecoveryStatus,
} from "./passwordReset";

type AuthContextValue = {
  authError: string;
  clearLocalSession: () => Promise<void>;
  clearAuthError: () => void;
  isConfigured: boolean;
  isInitializing: boolean;
  isSubmitting: boolean;
  passwordRecoveryStatus: PasswordRecoveryStatus;
  requestPasswordReset: (email: string) => Promise<void>;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateRecoveredPassword: (password: string) => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const recoveryWasRequestedRef = useRef(isPasswordResetRouteRequested());
  const recoveryWasRequested = recoveryWasRequestedRef.current;
  const [passwordRecoveryStatus, setPasswordRecoveryStatus] =
    useState<PasswordRecoveryStatus>(
      recoveryWasRequested
        ? isSupabaseConfigured
          ? "checking"
          : "invalid"
        : "idle",
    );
  const passwordRecoveryStatusRef = useRef(passwordRecoveryStatus);

  const updatePasswordRecoveryStatus = (status: PasswordRecoveryStatus) => {
    passwordRecoveryStatusRef.current = status;
    setPasswordRecoveryStatus(status);
  };

  useEffect(() => {
    if (!supabase) {
      setIsInitializing(false);
      return;
    }

    let isMounted = true;
    let recoveryCheckTimer: number | undefined;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setIsInitializing(false);
      if (event === "PASSWORD_RECOVERY") {
        updatePasswordRecoveryStatus(nextSession ? "ready" : "invalid");
      } else if (
        event === "SIGNED_OUT" &&
        (passwordRecoveryStatusRef.current === "checking" ||
          passwordRecoveryStatusRef.current === "ready")
      ) {
        updatePasswordRecoveryStatus("invalid");
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;

      if (error) {
        console.error("[auth] Initial session check failed");
        setAuthError(getAuthErrorMessage(error));
      } else {
        setSession(data.session);
      }
      setIsInitializing(false);
      if (recoveryWasRequested) {
        recoveryCheckTimer = window.setTimeout(() => {
          if (
            isMounted &&
            passwordRecoveryStatusRef.current === "checking"
          ) {
            updatePasswordRecoveryStatus("invalid");
          }
        }, 0);
      }
    });

    return () => {
      isMounted = false;
      if (recoveryCheckTimer !== undefined) window.clearTimeout(recoveryCheckTimer);
      subscription.unsubscribe();
    };
  }, [recoveryWasRequested]);

  const requireClient = () => {
    if (!supabase) {
      setAuthError(supabaseConfigurationMessage);
      throw new Error(supabaseConfigurationMessage);
    }
    return supabase;
  };

  const runAuthRequest = async <T,>(
    request: () => Promise<T>,
    storeError = true,
  ) => {
    setAuthError("");
    setIsSubmitting(true);
    try {
      return await request();
    } catch (error) {
      if (!(error instanceof Error && error.message === supabaseConfigurationMessage)) {
        console.error("[auth] Supabase request failed");
        if (storeError) setAuthError(getAuthErrorMessage(error));
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const updatePassword = (password: string) =>
    runAuthRequest(async () => {
      const client = requireClient();
      const updateRequest = client.auth.updateUser({ password });
      password = "";
      const { error } = await updateRequest;
      if (error) throw error;
    }, false);

  const requestPasswordReset = async (email: string) => {
    const client = requireClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetRedirectUrl(),
    });
    if (error) throw error;
  };

  const updateRecoveredPassword = async (newPassword: string) => {
    const client = requireClient();
    if (passwordRecoveryStatusRef.current !== "ready") {
      throw new PasswordRecoveryUnavailableError();
    }

    let submittedPassword = newPassword;
    const updateRequest = client.auth.updateUser({ password: submittedPassword });
    submittedPassword = "";
    const { error } = await updateRequest;
    if (error) throw error;

    updatePasswordRecoveryStatus("completed");
    try {
      await client.auth.signOut({ scope: "local" });
    } catch {
      // The password update succeeded. Do not expose sign-out internals or retry it here.
    } finally {
      setSession(null);
    }
  };

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
    passwordRecoveryStatus,
    requestPasswordReset,
    session,
    signIn,
    signOut,
    updatePassword,
    updateRecoveredPassword,
    user: session?.user ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
