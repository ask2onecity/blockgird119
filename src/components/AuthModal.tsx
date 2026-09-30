import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { X, Mail, Lock, User, Loader2, ArrowRight, Shield } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthView = 'login' | 'register';

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const reset = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setSuccess('');
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const switchView = (v: AuthView) => {
    reset();
    setView(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (view === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err === 'Invalid login credentials' ? 'Email or password is incorrect' : err);
      } else {
        handleClose();
      }
    } else {
      const { error: err } = await signUp(email, password, displayName || undefined);
      if (err) {
        setError(err);
      } else {
        setSuccess('Account created successfully! You are now logged in.');
        setTimeout(() => handleClose(), 1200);
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Close button */}
        <button onClick={handleClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-400 dark:text-gray-500 dark:text-gray-400 z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {view === 'login' ? (
                <Lock className="w-5 h-5 text-white" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {view === 'login' ? 'Member Login' : 'Create Account'}
              </h2>
              <p className="text-sm text-emerald-100">
                {view === 'login' ? 'Sign in to your XCITYDAO account' : 'Join the XCITYDAO community'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Display name - register only */}
          {view === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name (optional)"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 dark:border-red-900/30">
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <span className="text-sm text-emerald-700 dark:text-emerald-400">{success}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-300 dark:disabled:from-gray-700 disabled:to-gray-300 dark:disabled:to-gray-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-200/50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {view === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Switch view */}
          <div className="text-center pt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {view === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() => switchView(view === 'login' ? 'register' : 'login')}
              className="ml-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              {view === 'login' ? 'Register' : 'Sign In'}
            </button>
          </div>

          {/* Admin hint */}
          {view === 'login' && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 dark:border-amber-900/30 mt-2">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-400">Admin: admin@admin.com / 111111</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
