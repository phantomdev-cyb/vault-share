import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    // Security: Use OTP/Magic Link to prevent password credential theft
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        // Redirects back to the app after clicking the email link
        emailRedirectTo: window.location.origin 
      }
    });

    if (error) {
      alert(error.message);
      setStatus('error');
    } else {
      setStatus('success');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vault-900 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-vault-800 rounded-2xl flex items-center justify-center border border-vault-700 shadow-xl shadow-black/50">
            <ShieldCheck className="h-8 w-8 text-vault-accent" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Vault Access
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            End-to-end encrypted storage for sensitive assets.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-vault-800 py-8 px-4 shadow-2xl rounded-2xl border border-vault-700 sm:px-10">
          {status === 'success' ? (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="bg-emerald-900/30 text-emerald-400 p-4 rounded-lg border border-emerald-500/20">
                <p className="font-semibold">Check your secure inbox.</p>
                <p className="text-sm opacity-80 mt-1">We sent a magic link to {email}</p>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Authorized Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    className="block w-full pl-10 bg-vault-900 border border-vault-700 rounded-lg py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-vault-accent focus:border-transparent transition-all sm:text-sm"
                    placeholder="operative@secure.net"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-vault-900 bg-vault-accent hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vault-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Verify Identity <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}
        </div>
        
        <p className="text-center text-xs text-gray-600">
          Protected by AES-256-GCM. Zero Knowledge Architecture.
        </p>
      </div>
    </div>
  );
}