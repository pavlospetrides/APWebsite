'use client';

import { type SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { ArrowDown, ArrowUp, CalendarDays, Eye, ImagePlus, LoaderCircle, LogOut, Pencil, Plus, ShieldX, Trash2, Zap } from 'lucide-react';
import { createSupabaseBrowserClient, hasSupabaseConfig } from '@/lib/supabase/client';
import type { AppointmentStatus, Database, ProjectStatus } from '@/types/database';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectImage = Database['public']['Tables']['project_images']['Row'] & { signedUrl?: string };
type Request = Database['public']['Tables']['appointment_requests']['Row'];
type AuthState = 'checking' | 'signed-out' | 'denied' | 'admin' | 'error';
type NoticeKind = 'success' | 'error';
type FormState = {
  id?: string; slug: string; title_el: string; title_en: string; description_el: string; description_en: string;
  category: string; year: string; location_el: string; location_en: string; featured: boolean; status: ProjectStatus;
};
type PendingImage = { id: string; file: File; alt_el: string; alt_en: string };

const emptyForm: FormState = {
  slug: '', title_el: '', title_en: '', description_el: '', description_en: '', category: 'renovation',
  year: String(new Date().getFullYear()), location_el: '', location_en: '', featured: false, status: 'draft',
};
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const maxImageBytes = 8 * 1024 * 1024;

function makeSlug(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `project-${Date.now()}`;
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function AdminDashboard() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>(hasSupabaseConfig() ? 'checking' : 'signed-out');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeKind, setNoticeKind] = useState<NoticeKind>('success');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [tab, setTab] = useState<'projects' | 'requests'>('projects');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [existingImages, setExistingImages] = useState<ProjectImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [coverChoice, setCoverChoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  const showNotice = useCallback((message: string, kind: NoticeKind = 'success') => {
    setNotice(message);
    setNoticeKind(kind);
  }, []);

  const loadData = useCallback(async () => {
    if (!supabase) return;
    const [projectResult, imageResult, requestResult] = await Promise.all([
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('project_images').select('*').order('sort_order', { ascending: true }),
      supabase.from('appointment_requests').select('*').order('created_at', { ascending: false }),
    ]);
    const firstError = projectResult.error || imageResult.error || requestResult.error;
    if (firstError) throw firstError;
    const images = (imageResult.data || []) as ProjectImage[];
    const signedImages = await Promise.all(images.map(async (image) => {
      const result = await supabase.storage.from('project-images').createSignedUrl(image.storage_path, 3600);
      return { ...image, signedUrl: result.data?.signedUrl };
    }));
    setProjects(projectResult.data || []);
    setProjectImages(signedImages);
    setRequests(requestResult.data || []);
  }, [supabase]);

  const verifySession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!supabase || !nextSession) {
      setProjects([]); setProjectImages([]); setRequests([]); setAuthState('signed-out');
      return;
    }
    setAuthState('checking');
    const userResult = await supabase.auth.getUser(nextSession.access_token);
    if (userResult.error || !userResult.data.user) {
      await supabase.auth.signOut();
      setAuthState('signed-out');
      showNotice('Η συνεδρία έληξε. Συνδεθείτε ξανά.', 'error');
      return;
    }
    const membership = await supabase.from('admin_users').select('user_id').eq('user_id', userResult.data.user.id).maybeSingle();
    if (membership.error) {
      setAuthState('error');
      showNotice('Δεν ήταν δυνατή η επαλήθευση πρόσβασης διαχειριστή.', 'error');
      return;
    }
    if (!membership.data) { setAuthState('denied'); return; }
    setAuthState('admin');
    try { await loadData(); }
    catch { showNotice('Η πρόσβαση επαληθεύτηκε, αλλά τα δεδομένα δεν φορτώθηκαν.', 'error'); }
  }, [loadData, showNotice, supabase]);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => verifySession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => void verifySession(nextSession), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, verifySession]);

  async function login(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setAuthState('checking'); setNotice('');
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPassword('');
    if (result.error || !result.data.session) {
      setAuthState('signed-out');
      showNotice('Η σύνδεση απέτυχε. Ελέγξτε το email, τον κωδικό και τη ρύθμιση Supabase.', 'error');
      return;
    }
    await verifySession(result.data.session);
  }

  async function logout() {
    setAuthState('checking'); setSession(null); setProjects([]); setProjectImages([]); setRequests([]); setEditing(false);
    await supabase?.auth.signOut();
    setAuthState('signed-out');
  }

  function startCreate() {
    setForm({ ...emptyForm, year: String(new Date().getFullYear()) });
    setExistingImages([]); setPendingImages([]); setCoverChoice(null); setNotice(''); setEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editProject(project: Project) {
    const images = projectImages.filter((image) => image.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order);
    setForm({ id: project.id, slug: project.slug, title_el: project.title_el, title_en: project.title_en,
      description_el: project.description_el, description_en: project.description_en, category: project.category,
      year: String(project.year || ''), location_el: project.location_el || '', location_en: project.location_en || '',
      featured: project.featured, status: project.status });
    setExistingImages(images); setPendingImages([]); setCoverChoice(project.cover_path || images[0]?.storage_path || null);
    setNotice(''); setEditing(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditing(false); setForm(emptyForm); setExistingImages([]); setPendingImages([]); setCoverChoice(null);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const accepted = Array.from(list).filter((file) => allowedImageTypes.includes(file.type) && file.size <= maxImageBytes);
    const additions = accepted.map((file) => ({ id: crypto.randomUUID(), file, alt_el: form.title_el.trim(), alt_en: form.title_en.trim() }));
    setPendingImages((current) => [...current, ...additions]);
    if (!coverChoice && additions[0]) setCoverChoice(`pending:${additions[0].id}`);
    if (accepted.length !== list.length) showNotice('Ορισμένα αρχεία απορρίφθηκαν. Επιτρέπονται JPG, PNG, WebP ή AVIF έως 8 MB.', 'error');
  }

  function removePendingImage(image: PendingImage) {
    const remaining = pendingImages.filter((item) => item.id !== image.id);
    setPendingImages(remaining);
    if (coverChoice === `pending:${image.id}`) setCoverChoice(existingImages[0]?.storage_path || (remaining[0] ? `pending:${remaining[0].id}` : null));
  }

  async function deleteExistingImage(image: ProjectImage) {
    if (!supabase || !form.id || !window.confirm('Να διαγραφεί οριστικά αυτή η εικόνα;')) return;
    setDeletingImageId(image.id); setNotice('');
    const remaining = existingImages.filter((item) => item.id !== image.id);
    const nextCover = coverChoice === image.storage_path ? remaining[0]?.storage_path || null : coverChoice;
    if (coverChoice === image.storage_path) {
      const coverResult = await supabase.from('projects').update({ cover_path: nextCover }).eq('id', form.id);
      if (coverResult.error) { setDeletingImageId(null); showNotice('Δεν ήταν δυνατή η αλλαγή εξωφύλλου πριν από τη διαγραφή.', 'error'); return; }
    }
    const recordResult = await supabase.from('project_images').delete().eq('id', image.id);
    if (recordResult.error) { setDeletingImageId(null); showNotice('Δεν ήταν δυνατή η διαγραφή της εικόνας.', 'error'); return; }
    const storageResult = await supabase.storage.from('project-images').remove([image.storage_path]);
    setExistingImages(remaining); setCoverChoice(nextCover); setDeletingImageId(null);
    showNotice(storageResult.error ? 'Η εγγραφή διαγράφηκε, αλλά απέτυχε η εκκαθάριση του ιδιωτικού αρχείου.' : 'Η εικόνα διαγράφηκε.', storageResult.error ? 'error' : 'success');
    await loadData();
  }

  async function saveProject(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true); setNotice('');
    const payload = { slug: makeSlug(form.slug || form.title_en), title_el: form.title_el.trim(), title_en: form.title_en.trim(),
      description_el: form.description_el.trim(), description_en: form.description_en.trim(), category: form.category,
      year: form.year ? Number(form.year) : null, location_el: form.location_el.trim() || null, location_en: form.location_en.trim() || null,
      cover_path: coverChoice && !coverChoice.startsWith('pending:') ? coverChoice : null, featured: form.featured, status: form.status };
    const result = form.id
      ? await supabase.from('projects').update(payload).eq('id', form.id).select().single()
      : await supabase.from('projects').insert(payload).select().single();
    if (result.error || !result.data) { setSaving(false); showNotice(result.error?.message || 'Δεν ήταν δυνατή η αποθήκευση του έργου.', 'error'); return; }
    const projectId = result.data.id;
    const problems: string[] = [];
    for (let index = 0; index < existingImages.length; index += 1) {
      const image = existingImages[index];
      const update = await supabase.from('project_images').update({ alt_el: image.alt_el.trim(), alt_en: image.alt_en.trim(), sort_order: index }).eq('id', image.id);
      if (update.error) problems.push(`metadata:${image.id}`);
    }
    const uploadedPaths = new Map<string, string>();
    for (let index = 0; index < pendingImages.length; index += 1) {
      const image = pendingImages[index];
      const extension = image.file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${projectId}/${crypto.randomUUID()}.${extension}`;
      const upload = await supabase.storage.from('project-images').upload(path, image.file, { contentType: image.file.type, upsert: false });
      if (upload.error) { problems.push(`upload:${image.file.name}`); continue; }
      const record = await supabase.from('project_images').insert({ project_id: projectId, storage_path: path,
        alt_el: image.alt_el.trim() || form.title_el.trim(), alt_en: image.alt_en.trim() || form.title_en.trim(),
        sort_order: existingImages.length + index });
      if (record.error) { await supabase.storage.from('project-images').remove([path]); problems.push(`record:${image.file.name}`); continue; }
      uploadedPaths.set(image.id, path);
    }
    let finalCover = coverChoice;
    if (finalCover?.startsWith('pending:')) finalCover = uploadedPaths.get(finalCover.slice(8)) || null;
    finalCover ||= existingImages[0]?.storage_path || uploadedPaths.values().next().value || null;
    const coverResult = await supabase.from('projects').update({ cover_path: finalCover }).eq('id', projectId);
    if (coverResult.error) problems.push('cover');
    setSaving(false); cancelEdit(); await loadData();
    showNotice(problems.length ? 'Το έργο αποθηκεύτηκε, αλλά ορισμένες αλλαγές εικόνων δεν ολοκληρώθηκαν.' : form.status === 'published' ? 'Το έργο αποθηκεύτηκε και δημοσιεύτηκε.' : 'Το έργο αποθηκεύτηκε ως πρόχειρο.', problems.length ? 'error' : 'success');
  }

  async function removeProject(project: Project) {
    if (!supabase || !window.confirm(`Να διαγραφεί οριστικά το έργο «${project.title_el}» και οι εικόνες του;`)) return;
    setNotice('');
    const paths = projectImages.filter((image) => image.project_id === project.id).map((image) => image.storage_path);
    const result = await supabase.from('projects').delete().eq('id', project.id);
    if (result.error) { showNotice('Δεν ήταν δυνατή η διαγραφή του έργου.', 'error'); return; }
    const storageResult = paths.length ? await supabase.storage.from('project-images').remove(paths) : { error: null };
    await loadData();
    showNotice(storageResult.error ? 'Το έργο διαγράφηκε, αλλά απέτυχε η εκκαθάριση ορισμένων ιδιωτικών αρχείων.' : 'Το έργο και οι εικόνες του διαγράφηκαν.', storageResult.error ? 'error' : 'success');
  }

  async function updateRequest(id: string, status: AppointmentStatus) {
    if (!supabase) return;
    setUpdatingRequestId(id); setNotice('');
    const result = await supabase.from('appointment_requests').update({ status }).eq('id', id);
    setUpdatingRequestId(null);
    if (result.error) { showNotice('Δεν ήταν δυνατή η ενημέρωση του αιτήματος.', 'error'); return; }
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    showNotice('Η κατάσταση του αιτήματος ενημερώθηκε.');
  }

  if (!hasSupabaseConfig()) return <main className="admin-shell"><div className="admin-login setup-card"><Zap /><h1>Ρύθμιση διαχείρισης</h1><p>Συμπληρώστε τα <code>NEXT_PUBLIC_SUPABASE_URL</code> και <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> στο <code>.env.local</code>, εκτελέστε το migration και δημιουργήστε τον πρώτο admin.</p><Link href="/el">Επιστροφή στην ιστοσελίδα</Link></div></main>;
  if (authState === 'checking') return <main className="admin-shell admin-loading"><LoaderCircle className="spin" /><span>Έλεγχος ασφαλούς πρόσβασης…</span></main>;
  if (authState === 'signed-out') return <main className="admin-shell"><form className="admin-login" onSubmit={login}><span className="admin-symbol"><Zap /></span><p>AP Electrical Services</p><h1>Σύνδεση διαχειριστή</h1><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label><label>Κωδικός<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><button className="button button-primary" type="submit">Σύνδεση</button>{notice && <p className="admin-notice error" role="alert">{notice}</p>}<Link href="/el">Επιστροφή στην ιστοσελίδα</Link></form></main>;
  if (authState === 'denied' || authState === 'error') return <main className="admin-shell"><div className="admin-login setup-card"><ShieldX /><p>AP Electrical Services</p><h1>{authState === 'denied' ? 'Δεν υπάρχει πρόσβαση' : 'Αποτυχία επαλήθευσης'}</h1><p>{authState === 'denied' ? 'Ο συνδεδεμένος λογαριασμός δεν ανήκει στους διαχειριστές.' : 'Ελέγξτε τη σύνδεση και τις ρυθμίσεις Supabase και δοκιμάστε ξανά.'}</p>{session?.user.email && <small>{session.user.email}</small>}<button className="button button-primary" type="button" onClick={() => void logout()}>Αποσύνδεση</button></div></main>;

  return <main className="admin-dashboard">
    <header><div><span className="admin-symbol"><Zap /></span><div><strong>AP Admin</strong><small>{session?.user.email}</small></div></div><button type="button" onClick={() => void logout()}><LogOut />Αποσύνδεση</button></header>
    <div className="admin-content"><aside><button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>Έργα <span>{projects.length}</span></button><button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}>Αιτήματα <span>{requests.filter((request) => request.status === 'new').length}</span></button><Link href="/el" target="_blank"><Eye />Προβολή site</Link></aside><section>
      {notice && <output className={`admin-notice ${noticeKind === 'error' ? 'error' : ''}`}>{notice}</output>}
      {tab === 'projects' && (editing ? <form className="project-editor" onSubmit={saveProject}>
        <div className="admin-title"><div><p>{form.id ? 'Επεξεργασία' : 'Νέο έργο'}</p><h1>{form.id ? form.title_el : 'Δημιουργία έργου'}</h1></div><button type="button" className="ghost-button" onClick={cancelEdit}>Ακύρωση</button></div>
        <div className="editor-grid">
          <label>Τίτλος (EL)<input value={form.title_el} onChange={(event) => setForm({ ...form, title_el: event.target.value })} minLength={2} maxLength={160} required /></label>
          <label>Title (EN)<input value={form.title_en} onChange={(event) => setForm({ ...form, title_en: event.target.value })} minLength={2} maxLength={160} required /></label>
          <label>Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} onBlur={() => setForm((current) => ({ ...current, slug: makeSlug(current.slug || current.title_en) }))} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="project-slug" required /></label>
          <label>Κατηγορία<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="renovation">Ανακαίνιση</option><option value="new-build">Νέα κατασκευή</option><option value="repair">Επισκευή</option><option value="lighting">Φωτισμός</option></select></label>
          <label>Περιγραφή (EL)<textarea rows={5} value={form.description_el} onChange={(event) => setForm({ ...form, description_el: event.target.value })} minLength={10} maxLength={3000} required /></label>
          <label>Description (EN)<textarea rows={5} value={form.description_en} onChange={(event) => setForm({ ...form, description_en: event.target.value })} minLength={10} maxLength={3000} required /></label>
          <label>Έτος<input type="number" min="2000" max="2100" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} /></label>
          <label>Τοποθεσία (EL)<input value={form.location_el} onChange={(event) => setForm({ ...form, location_el: event.target.value })} /></label>
          <label>Location (EN)<input value={form.location_en} onChange={(event) => setForm({ ...form, location_en: event.target.value })} /></label>
        </div>
        <div className="upload-zone"><ImagePlus /><strong>Φωτογραφίες έργου</strong><span>Ιδιωτικό bucket · JPG, PNG, WebP ή AVIF · έως 8 MB ανά αρχείο</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} /></div>
        {(existingImages.length > 0 || pendingImages.length > 0) && <div className="image-manager">
          {existingImages.map((image, index) => <div className="image-record" key={image.id}>
            <div className="image-thumb">{image.signedUrl ? <img src={image.signedUrl} alt={image.alt_el} /> : <ImagePlus />}</div>
            <div className="image-fields"><label>Alt text (EL)<input value={image.alt_el} minLength={2} maxLength={300} onChange={(event) => setExistingImages((current) => current.map((item) => item.id === image.id ? { ...item, alt_el: event.target.value } : item))} required /></label><label>Alt text (EN)<input value={image.alt_en} minLength={2} maxLength={300} onChange={(event) => setExistingImages((current) => current.map((item) => item.id === image.id ? { ...item, alt_en: event.target.value } : item))} required /></label></div>
            <label className="cover-choice"><input type="radio" name="cover" checked={coverChoice === image.storage_path} onChange={() => setCoverChoice(image.storage_path)} />Εξώφυλλο</label>
            <div className="image-actions"><button type="button" onClick={() => setExistingImages((current) => moveItem(current, index, -1))} aria-label="Μετακίνηση πάνω"><ArrowUp /></button><button type="button" onClick={() => setExistingImages((current) => moveItem(current, index, 1))} aria-label="Μετακίνηση κάτω"><ArrowDown /></button><button type="button" className="danger" disabled={deletingImageId === image.id} onClick={() => void deleteExistingImage(image)} aria-label="Διαγραφή εικόνας">{deletingImageId === image.id ? <LoaderCircle className="spin" /> : <Trash2 />}</button></div>
          </div>)}
          {pendingImages.map((image, index) => <div className="image-record pending" key={image.id}>
            <div className="image-thumb"><ImagePlus /><small>Νέα</small></div>
            <div className="image-fields"><strong>{image.file.name}</strong><label>Alt text (EL)<input value={image.alt_el} minLength={2} maxLength={300} onChange={(event) => setPendingImages((current) => current.map((item) => item.id === image.id ? { ...item, alt_el: event.target.value } : item))} required /></label><label>Alt text (EN)<input value={image.alt_en} minLength={2} maxLength={300} onChange={(event) => setPendingImages((current) => current.map((item) => item.id === image.id ? { ...item, alt_en: event.target.value } : item))} required /></label></div>
            <label className="cover-choice"><input type="radio" name="cover" checked={coverChoice === `pending:${image.id}`} onChange={() => setCoverChoice(`pending:${image.id}`)} />Εξώφυλλο</label>
            <div className="image-actions"><button type="button" onClick={() => setPendingImages((current) => moveItem(current, index, -1))} aria-label="Μετακίνηση πάνω"><ArrowUp /></button><button type="button" onClick={() => setPendingImages((current) => moveItem(current, index, 1))} aria-label="Μετακίνηση κάτω"><ArrowDown /></button><button type="button" className="danger" onClick={() => removePendingImage(image)} aria-label="Αφαίρεση εικόνας"><Trash2 /></button></div>
          </div>)}
        </div>}
        <div className="publish-row"><label><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />Προτεινόμενο έργο</label><label>Κατάσταση<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}><option value="draft">Πρόχειρο</option><option value="published">Δημοσιευμένο</option></select></label><button className="button button-primary" disabled={saving} type="submit">{saving && <LoaderCircle className="spin" />}{saving ? 'Αποθήκευση…' : 'Αποθήκευση'}</button></div>
      </form> : <><div className="admin-title"><div><p>Περιεχόμενο</p><h1>Έργα</h1></div><button className="button button-primary" onClick={startCreate}><Plus />Νέο έργο</button></div><div className="admin-table"><div className="table-head"><span>Έργο</span><span>Κατηγορία</span><span>Κατάσταση</span><span>Ενέργειες</span></div>{projects.map((project) => <div className="table-row" key={project.id}><span><strong>{project.title_el}</strong><small>{project.year || '—'} · /{project.slug}</small></span><span>{project.category}</span><span><i className={project.status}>{project.status === 'published' ? 'Δημοσιευμένο' : 'Πρόχειρο'}</i></span><span><button onClick={() => editProject(project)} aria-label="Επεξεργασία"><Pencil /></button>{project.status === 'published' && <a href={`/el/projects/${project.slug}`} target="_blank" aria-label="Προβολή"><Eye /></a>}<button className="danger" onClick={() => void removeProject(project)} aria-label="Διαγραφή"><Trash2 /></button></span></div>)}{projects.length === 0 && <p className="empty-state">Δεν υπάρχουν ακόμη έργα.</p>}</div></>)}
      {tab === 'requests' && <><div className="admin-title"><div><p>Επικοινωνία</p><h1>Αιτήματα ραντεβού</h1></div></div><div className="request-list">{requests.map((request) => <article key={request.id}><div><span className={`request-status ${request.status}`}>{request.status}</span><time>{new Date(request.created_at).toLocaleString('el-GR')}</time></div><h2>{request.name}</h2><p>{request.work_type} · {request.area}</p>{(request.preferred_date || request.preferred_time) && <p className="request-meta"><CalendarDays />{request.preferred_date || 'Χωρίς ημερομηνία'}{request.preferred_time && ` · ${request.preferred_time.slice(0, 5)}`}</p>}<p>{request.message}</p><div className="request-contact"><a href={`tel:${request.phone}`}>{request.phone}</a>{request.email && <a href={`mailto:${request.email}`}>{request.email}</a>}</div><label>Κατάσταση<select disabled={updatingRequestId === request.id} value={request.status} onChange={(event) => void updateRequest(request.id, event.target.value as AppointmentStatus)}><option value="new">Νέο</option><option value="contacted">Επικοινωνήθηκε</option><option value="completed">Ολοκληρώθηκε</option></select></label></article>)}{requests.length === 0 && <p className="empty-state">Δεν υπάρχουν αιτήματα.</p>}</div></>}
    </section></div>
  </main>;
}
