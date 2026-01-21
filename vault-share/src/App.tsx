import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import Vault from './components/Vault';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(res?.data?.session ?? null);
      } catch (err) {
        console.error('Failed to get session', err);
        if (!mounted) return;
        setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Listen for changes
    const onAuth = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => {
      mounted = false;
      try {
        onAuth?.data?.subscription?.unsubscribe?.();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-vault-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-vault-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="antialiased text-slate-200">
      {!session ? (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-vault-800 border border-vault-700 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold mb-2">You're not signed in</h2>
            <p className="text-sm text-gray-400 mb-4">To access the Secure Vault, please sign in or create an account.</p>
            <Auth />
            <p className="mt-4 text-xs text-gray-500">Changes are saved locally and encrypted client-side.</p>
          </div>
        </div>
      ) : (
        <Vault session={session} />
      )}
    </div>
  );
}