'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { KeyRound, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Phase = 'checking' | 'password' | 'challenge' | 'enroll';

const genericError = 'Η σύνδεση δεν ολοκληρώθηκε. Ελέγξτε τα στοιχεία σας και δοκιμάστε ξανά.';

export function AdminLogin() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const initialized = useRef(false);
  const [phase, setPhase] = useState<Phase>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function continueAuthentication() {
    if (!supabase) {
      setPhase('password');
      setMessage('Η ασφαλής σύνδεση δεν είναι διαθέσιμη αυτή τη στιγμή.');
      return;
    }

    const userResult = await supabase.auth.getUser();
    if (userResult.error || !userResult.data.user) {
      setPhase('password');
      return;
    }
    const membership = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userResult.data.user.id)
      .maybeSingle();
    if (membership.error || !membership.data) {
      await supabase.auth.signOut();
      setPhase('password');
      setMessage(genericError);
      return;
    }

    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!assurance.error && assurance.data.currentLevel === 'aal2') {
      window.location.replace('/admin');
      return;
    }

    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error) {
      setPhase('password');
      setMessage(genericError);
      return;
    }
    const verified = factors.data.totp[0];
    if (verified) {
      setFactorId(verified.id);
      setPhase('challenge');
      return;
    }

    await Promise.all(
      factors.data.all
        .filter((factor) => factor.factor_type === 'totp' && factor.status === 'unverified')
        .map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })),
    );
    const enrollment = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'AP Electrical Services administration',
    });
    if (enrollment.error || enrollment.data.type !== 'totp') {
      setPhase('password');
      setMessage(genericError);
      return;
    }
    setFactorId(enrollment.data.id);
    setQrCode(enrollment.data.totp.qr_code);
    setSecret(enrollment.data.totp.secret);
    setPhase('enroll');
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!supabase) {
      setPhase('password');
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void continueAuthentication();
      else setPhase('password');
    });
  }, [supabase]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setMessage('');
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPassword('');
    if (result.error || !result.data.session) {
      setMessage(genericError);
      setBusy(false);
      return;
    }
    await continueAuthentication();
    setBusy(false);
  }

  async function verifyMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !factorId || busy || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setMessage('');
    const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setCode('');
    if (result.error) {
      setMessage('Ο κωδικός επαλήθευσης δεν έγινε δεκτός. Δοκιμάστε έναν νέο κωδικό.');
      setBusy(false);
      return;
    }
    window.location.replace('/admin');
  }

  return (
    <main className="private-login-shell">
      <section className="private-login-card" aria-labelledby="private-login-title">
        <div className="private-login-brand">
          <span className="private-login-mark"><LockKeyhole /></span>
          <div><strong>AP</strong><span>Electrical Services</span></div>
        </div>

        {phase === 'checking' ? (
          <div className="private-login-check"><LoaderCircle className="spin" /><span>Έλεγχος ασφαλούς συνεδρίας…</span></div>
        ) : phase === 'password' ? (
          <form onSubmit={signIn} className="private-login-form">
            <div className="private-login-heading">
              <span>Secure access</span>
              <h1 id="private-login-title">Καλώς ήρθατε</h1>
              <p>Συνδεθείτε με τα στοιχεία που σας έχουν δοθεί.</p>
            </div>
            <label>Email<Input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} /></label>
            <label>Κωδικός<Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} /></label>
            {message && <p className="private-login-message" role="alert">{message}</p>}
            <Button type="submit" size="lg" disabled={busy || !email || !password}>
              {busy ? <LoaderCircle className="spin" /> : <KeyRound />} Σύνδεση
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyMfa} className="private-login-form">
            <div className="private-login-heading">
              <span>Two-step verification</span>
              <h1 id="private-login-title">{phase === 'enroll' ? 'Ενεργοποίηση 2FA' : 'Κωδικός ασφαλείας'}</h1>
              <p>{phase === 'enroll' ? 'Σαρώστε τον κωδικό με την εφαρμογή authenticator και πληκτρολογήστε τον εξαψήφιο κωδικό.' : 'Πληκτρολογήστε τον εξαψήφιο κωδικό από την εφαρμογή authenticator.'}</p>
            </div>
            {phase === 'enroll' && qrCode && (
              <div className="mfa-enrollment">
                <img src={qrCode} alt="QR code για ενεργοποίηση εφαρμογής authenticator" />
                <details><summary>Χειροκίνητη εισαγωγή</summary><code>{secret}</code></details>
              </div>
            )}
            <label>Κωδικός επαλήθευσης<Input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required disabled={busy} /></label>
            {message && <p className="private-login-message" role="alert">{message}</p>}
            <Button type="submit" size="lg" disabled={busy || code.length !== 6}>
              {busy ? <LoaderCircle className="spin" /> : <ShieldCheck />} Επαλήθευση
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
