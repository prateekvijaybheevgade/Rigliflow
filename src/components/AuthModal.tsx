import React from 'react';
import { X, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  title = 'Access Flowlify Platform',
  subtitle = 'Sign in or create an account with Clerk to unlock the full AI flowchart studio, cloud persistence, and vector exports.',
}) => {
  const { loading } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Top Banner */}
        <div className="px-6 pt-8 pb-6 text-center border-b border-slate-100 bg-gradient-to-b from-blue-50/70 to-white">
          <img
            src="/flowify.png"
            alt="Flowlify"
            className="w-14 h-14 rounded-2xl object-contain mx-auto mb-3.5 shadow-md shadow-blue-500/10 border border-slate-100"
          />
          <h3 className="font-bold text-slate-900 text-lg mb-1.5">{title}</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Value Props & Security */}
        <div className="p-6 space-y-4">
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Convert hand sketches & diagrams to interactive flowcharts</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Full drag-and-drop vector editor with orthogonal wire routing</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Secure cloud workspace persistence & multi-device sync</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Export unlimited standalone SVG, high-DPI PDF & PNG</span>
            </div>
          </div>

          <div className="pt-2 space-y-2.5">
            <SignInButton mode="modal">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <span>Sign In to Your Account</span>
                <ArrowRight size={14} />
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl border border-slate-300 shadow-2xs hover:border-slate-400 transition-all cursor-pointer"
              >
                <span>Don't have an account? Sign Up</span>
              </button>
            </SignUpButton>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
            <Lock size={11} />
            <span>Secured with Clerk Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};
