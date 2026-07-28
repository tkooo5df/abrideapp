import { createContext, useContext, ReactNode } from 'react';
import useAuth from '@/hooks/useAuth';

interface AuthContextType {
  session: any;
  user: any;
  profile: any;
  loading: boolean;
  updateProfile: (updates: any) => Promise<any>;
  signOut: () => Promise<any>;
  signInWithGoogle: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};