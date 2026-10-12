import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/react';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

export const AuthButton: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400">
        <Loader2 size={13} className="animate-spin" />
        <span className="hidden sm:inline">Connecting...</span>
      </div>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-1.5">
          <SignInButton mode="modal">
            <button
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-2xs hover:border-slate-400 transition-all cursor-pointer"
              title="Sign in to your account"
            >
              <LogIn size={13} className="text-blue-600" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Create a free account"
            >
              <UserPlus size={13} />
              <span className="hidden sm:inline">Sign Up</span>
            </button>
          </SignUpButton>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="flex items-center gap-2 px-1">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-7 h-7 rounded-full border border-slate-300',
              },
            }}
          />
          <span className="text-xs font-semibold text-slate-700 max-w-[110px] truncate hidden md:inline">
            {user?.displayName || 'User'}
          </span>
        </div>
      </Show>
    </>
  );
};

