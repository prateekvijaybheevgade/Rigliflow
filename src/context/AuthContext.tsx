import React, { createContext, useContext, useMemo } from 'react';
import { useUser, useClerk } from '@clerk/react';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  openSignIn: () => void;
  openSignUp: () => void;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  openSignIn: () => {},
  openSignUp: () => {},
  logout: async () => {},
  error: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  const user = useMemo<AppUser | null>(() => {
    if (!isSignedIn || !clerkUser) return null;
    return {
      uid: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      displayName: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'User',
      photoURL: clerkUser.imageUrl || '',
    };
  }, [isSignedIn, clerkUser]);

  const loginWithGoogle = async () => {
    try {
      clerk.openSignIn();
    } catch (err: any) {
      console.error('Clerk sign-in failed:', err);
    }
  };

  const openSignIn = () => {
    try {
      clerk.openSignIn();
    } catch (err: any) {
      console.error('Clerk openSignIn error:', err);
    }
  };

  const openSignUp = () => {
    try {
      clerk.openSignUp();
    } catch (err: any) {
      console.error('Clerk openSignUp error:', err);
    }
  };

  const logout = async () => {
    try {
      await clerk.signOut();
    } catch (err: any) {
      console.error('Sign-out failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: !isLoaded,
        loginWithGoogle,
        openSignIn,
        openSignUp,
        logout,
        error: null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

