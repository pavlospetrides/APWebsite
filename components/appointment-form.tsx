'use client';

import { type SyntheticEvent, useState } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

export function AppointmentForm({ locale }: { locale: Locale }) {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const el = locale === 'el';
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setState('sending'); setMessage('');
    const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    try { const response = await fetch('/api/appointments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, consent: data.consent === 'on' }) }); const result = await response.json() as { message?: string; preview?: boolean }; if (!response.ok) throw new Error(result.message || 'Request failed'); setState('success'); setMessage(result.preview ? (el ? 'Το αίτημα ελέγχθηκε. Συνδέστε το Supabase για πραγματική αποθήκευση.' : 'The request was validated. Connect Supabase for live storage.') : (el ? 'Το αίτημά σας στάλθηκε. Θα χρησιμοποιηθούν τα στοιχεία που δώσατε για επικοινωνία.' : 'Your request was sent. The details you provided will be used to contact you.')); form.reset(); }
    catch (error) { setState('error'); setMessage(error instanceof Error ? error.message : (el ? 'Παρουσιάστηκε σφάλμα.' : 'An error occurred.')); }
  }
  return <form className="appointment-form" onSubmit={submit} noValidate>
    <div className="form-grid">
      <label>{el ? 'Όνομα' : 'Name'}<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
      <label>{el ? 'Τηλέφωνο' : 'Phone'}<input name="phone" type="tel" autoComplete="tel" minLength={6} maxLength={30} required /></label>
      <label>Email<input name="email" type="email" autoComplete="email" maxLength={160} /></label>
      <label>{el ? 'Είδος εργασίας' : 'Type of work'}<select name="workType" required defaultValue=""><option value="" disabled>{el ? 'Επιλέξτε' : 'Select'}</option><option value="renovation">{el ? 'Ανακαίνιση' : 'Renovation'}</option><option value="new-build">{el ? 'Νέα κατασκευή' : 'New build'}</option><option value="repair">{el ? 'Επισκευή / βλάβη' : 'Repair / fault'}</option><option value="other">{el ? 'Άλλο' : 'Other'}</option></select></label>
      <label>{el ? 'Περιοχή' : 'Area'}<input name="area" autoComplete="address-level2" minLength={2} maxLength={120} required /></label>
      <label>{el ? 'Προτιμώμενη ημερομηνία' : 'Preferred date'}<input name="preferredDate" type="date" min={new Date().toISOString().split('T')[0]} /></label>
      <label>{el ? 'Προτιμώμενη ώρα' : 'Preferred time'}<input name="preferredTime" type="time" /></label>
      <label className="full-width">{el ? 'Μήνυμα' : 'Message'}<textarea name="message" rows={5} minLength={10} maxLength={1500} required /></label>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="consent full-width"><input type="checkbox" name="consent" required /><span>{el ? 'Συμφωνώ με την επεξεργασία των στοιχείων μου αποκλειστικά για την επικοινωνία σχετικά με αυτό το αίτημα.' : 'I consent to my details being processed solely to contact me about this request.'}</span></label>
    </div>
    <button className="button button-primary submit-button" type="submit" disabled={state === 'sending'}>{state === 'sending' && <LoaderCircle className="spin" />}{el ? 'Αποστολή αιτήματος' : 'Send request'}</button>
    {message && <output className={`form-status ${state}`} aria-live="polite">{state === 'success' && <CheckCircle2 />}{message}</output>}
  </form>;
}
