'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle, CalendarDays, CheckCircle2, CircleGauge, ExternalLink,
  FileText, Images, LayoutDashboard, LoaderCircle, LogOut, Mail,
  MapPin, Menu, Pencil, Phone, Plus, Search, Send, Star, Trash2, X,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AppointmentStatus, Database, ProjectStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AdminProjectEditor, type EditorImage, type ProjectImageRecord,
} from '@/components/admin-project-editor';
import {
  errorsByPath, imageAltSchema, makeProjectSlug, projectFormSchema, toNullableText,
  type FieldErrors, type ProjectFormValues,
} from '@/lib/project-validation';
import { bilingualValue } from '@/lib/project-types';
import {
  APPOINTMENT_REQUEST_EMPTY_STATES,
  APPOINTMENT_REQUEST_FILTERS,
  APPOINTMENT_STATUS_LABELS,
  countAppointmentRequests,
  DEFAULT_APPOINTMENT_REQUEST_FILTER,
  filterAppointmentRequests,
  type AppointmentRequestFilter,
} from '@/lib/appointment-request-queue';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectImage = ProjectImageRecord;
type Request = Database['public']['Tables']['appointment_requests']['Row'];
type Section = 'dashboard' | 'projects' | 'requests';
type NoticeKind = 'success' | 'error';
type Notice = { kind: NoticeKind; text: string } | null;
const emptyForm: ProjectFormValues = {
  slug: '', title_el: '', title_en: '', description_el: '', description_en: '',
  category: 'renovation', year: '', location_el: '', location_en: '', featured: false,
  status: 'draft',
};
const categories = [
  ['renovation', 'Ανακαίνιση'], ['new-build', 'Νέα κατασκευή'],
  ['repair', 'Επισκευή'], ['lighting', 'Φωτισμός'],
] as const;
function categoryName(value: string) {
  return categories.find(([key]) => key === value)?.[1] || value;
}

function projectName(project: Project) {
  return bilingualValue(project.title_el, project.title_en, { el: 'Έργο', en: 'Project' }).el;
}

function coverPathFor(images: EditorImage[], choice: string | null) {
  const selected = images.find((image) => image.key === choice);
  return selected?.kind === 'existing' ? selected.record.cover_storage_path || selected.record.storage_path : null;
}

function revokePendingPreviews(images: EditorImage[]) {
  images.forEach((image) => image.kind === 'pending' && image.previewUrl && URL.revokeObjectURL(image.previewUrl));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('el-GR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function AdminDashboard({ loginPath }: { loginPath: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [section, setSection] = useState<Section>('dashboard');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [projectQuery, setProjectQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [requestFilter, setRequestFilter] = useState<AppointmentRequestFilter>(DEFAULT_APPOINTMENT_REQUEST_FILTER);
  const [requestQuery, setRequestQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProjectFormValues>(emptyForm);
  const [editorImages, setEditorImages] = useState<EditorImage[]>([]);
  const [coverChoice, setCoverChoice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [dirty, setDirty] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [requestUpdatingId, setRequestUpdatingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [imageToDelete, setImageToDelete] = useState<EditorImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateEditorImages: React.Dispatch<React.SetStateAction<EditorImage[]>> = (value) => {
    setDirty(true);
    setEditorImages(value);
  };

  function updateCoverChoice(value: string | null) {
    setDirty(true);
    setCoverChoice(value);
  }

  function updateForm(next: ProjectFormValues) {
    setDirty(true);
    setForm(next);
  }

  function leaveEditor(action: () => void) {
    if (editing && dirty) {
      pendingNavigation.current = action;
      setUnsavedOpen(true);
      return;
    }
    action();
  }

  function discardAndContinue() {
    revokePendingPreviews(editorImages);
    setDirty(false);
    setUnsavedOpen(false);
    const action = pendingNavigation.current;
    pendingNavigation.current = null;
    action?.();
  }

  function navigate(sectionName: Section) {
    leaveEditor(() => {
      setSection(sectionName);
      setEditing(false);
      setMobileMenuOpen(false);
    });
  }

  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (!editing || !dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty, editing]);

  const loadData = useCallback(async () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const [projectResult, imageResult, requestResult] = await Promise.all([
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('project_images').select('*').order('sort_order'),
      supabase.from('appointment_requests').select('*').order('created_at', { ascending: false }),
    ]);
    const error = projectResult.error || imageResult.error || requestResult.error;
    if (error) throw error;
    const images = (imageResult.data || []) as ProjectImage[];
    const signed = await Promise.all(images.map(async (image) => {
      const result = await supabase.storage.from('project-images').createSignedUrl(image.storage_path, 3600);
      return { ...image, signedUrl: result.data?.signedUrl };
    }));
    setProjects(projectResult.data || []);
    setProjectImages(signed);
    setRequests(requestResult.data || []);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      window.location.replace(loginPath);
      return;
    }
    void Promise.all([
      supabase.auth.getUser(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.rpc('is_admin_mfa'),
    ]).then(async ([user, assurance, membership]) => {
      if (user.error || !user.data.user || assurance.error || assurance.data.currentLevel !== 'aal2' || membership.error || membership.data !== true) {
        await supabase.auth.signOut();
        window.location.replace(loginPath);
        return;
      }
      try {
        await loadData();
      } catch {
        setNotice({ kind: 'error', text: 'Τα δεδομένα δεν φορτώθηκαν. Ανανεώστε τη σελίδα και δοκιμάστε ξανά.' });
      } finally {
        setLoading(false);
      }
    });
  }, [loadData, loginPath, supabase]);

  const summary = useMemo(() => ({
    total: projects.length,
    published: projects.filter((project) => project.status === 'published').length,
    drafts: projects.filter((project) => project.status === 'draft').length,
    newRequests: requests.filter((request) => request.status === 'new').length,
  }), [projects, requests]);

  const visibleProjects = useMemo(() => projects.filter((project) => {
    const search = projectQuery.trim().toLocaleLowerCase('el');
    const matchesQuery = !search || `${project.title_el} ${project.title_en} ${project.slug} ${project.category}`.toLocaleLowerCase('el').includes(search);
    return matchesQuery && (statusFilter === 'all' || project.status === statusFilter);
  }), [projectQuery, projects, statusFilter]);

  const requestCounts = useMemo(() => countAppointmentRequests(requests), [requests]);
  const visibleRequests = useMemo(
    () => filterAppointmentRequests(requests, requestFilter, requestQuery),
    [requestFilter, requestQuery, requests],
  );

  function showNotice(text: string, kind: NoticeKind = 'success') {
    setNotice({ kind, text });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startCreate() {
    revokePendingPreviews(editorImages);
    setForm({ ...emptyForm });
    setEditorImages([]);
    setCoverChoice(null);
    setFieldErrors({});
    setDirty(false);
    setEditing(true);
    setSection('projects');
    setNotice(null);
  }

  function startEdit(project: Project) {
    revokePendingPreviews(editorImages);
    const images: EditorImage[] = projectImages.filter((image) => image.project_id === project.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((record) => ({ kind: 'existing', key: record.storage_path, record, alt_el: record.alt_el || '', alt_en: record.alt_en || '' }));
    setForm({
      id: project.id, slug: project.slug, title_el: project.title_el || '', title_en: project.title_en || '',
      description_el: project.description_el || '', description_en: project.description_en || '',
      category: project.category, year: project.year ? String(project.year) : '',
      location_el: project.location_el || '', location_en: project.location_en || '',
      featured: project.featured, status: project.status,
    });
    setEditorImages(images);
    setCoverChoice(images.find((image) => image.kind === 'existing' && (image.record.storage_path === project.cover_path || image.record.cover_storage_path === project.cover_path))?.key || images[0]?.key || null);
    setFieldErrors({});
    setDirty(false);
    setEditing(true);
    setSection('projects');
    setNotice(null);
  }

  async function processPendingImage(key: string, file: File, rawPreview: string) {
    setEditorImages((current) => current.map((image) => image.key === key && image.kind === 'pending' ? { ...image, status: 'optimizing', error: undefined } : image));
    try {
      const { processProjectImage } = await import('@/lib/admin-image-processing');
      const processed = await processProjectImage(file);
      const previewUrl = URL.createObjectURL(processed.galleryBlob);
      URL.revokeObjectURL(rawPreview);
      setEditorImages((current) => current.map((image) => image.key === key && image.kind === 'pending' ? {
        ...image, sourceFile: undefined, previewUrl, processed, status: 'ready', error: undefined,
      } : image));
    } catch (error) {
      URL.revokeObjectURL(rawPreview);
      const message = error instanceof Error ? error.message : 'Δεν ήταν δυνατή η επεξεργασία της εικόνας.';
      setEditorImages((current) => current.map((image) => image.key === key && image.kind === 'pending' ? {
        ...image, previewUrl: '', sourceFile: file, status: 'error', error: message,
      } : image));
    }
  }

  function addFiles(files: File[]) {
    if (!files.length) return;
    const additions: EditorImage[] = files.map((file) => {
      const key = `pending:${crypto.randomUUID()}`;
      return {
        kind: 'pending', key, sourceName: file.name, sourceFile: file,
        previewUrl: URL.createObjectURL(file), alt_el: form.title_el.trim(), alt_en: form.title_en.trim(),
        status: 'preparing',
      };
    });
    setDirty(true);
    setEditorImages((current) => [...current, ...additions]);
    if (!coverChoice && additions[0]) setCoverChoice(additions[0].key);

    let cursor = 0;
    const worker = async () => {
      while (cursor < additions.length) {
        const image = additions[cursor++];
        if (image.kind === 'pending' && image.sourceFile) await processPendingImage(image.key, image.sourceFile, image.previewUrl);
      }
    };
    void Promise.all(Array.from({ length: Math.min(2, additions.length) }, worker));
  }

  function retryImage(key: string) {
    const image = editorImages.find((item) => item.key === key);
    if (image?.kind !== 'pending') return;
    if (image.processed) {
      setEditorImages((current) => current.map((item) => item.key === key && item.kind === 'pending' ? { ...item, status: 'ready', error: undefined } : item));
      return;
    }
    if (!image.sourceFile) return;
    const rawPreview = URL.createObjectURL(image.sourceFile);
    setEditorImages((current) => current.map((item) => item.key === key && item.kind === 'pending' ? { ...item, previewUrl: rawPreview, status: 'preparing', error: undefined } : item));
    void processPendingImage(key, image.sourceFile, rawPreview);
  }

  function collectValidationErrors(values: ProjectFormValues, images: EditorImage[]) {
    const normalized = { ...values, slug: makeProjectSlug(values.slug || values.title_en || values.title_el) };
    const parsed = projectFormSchema.safeParse(normalized);
    const result = parsed.success ? {} : errorsByPath(parsed.error);
    for (const image of images) {
      const alt = imageAltSchema.safeParse({ alt_el: image.alt_el, alt_en: image.alt_en });
      if (!alt.success) {
        for (const [key, message] of Object.entries(errorsByPath(alt.error))) result[`images.${image.key}.${key}`] = message;
      }
    }
    return { normalized, errors: result };
  }

  useEffect(() => {
    setFieldErrors((current) => {
      if (!Object.keys(current).length) return current;
      const currentValidation = collectValidationErrors(form, editorImages).errors;
      const next = Object.fromEntries(Object.keys(current).flatMap((key) => currentValidation[key] ? [[key, currentValidation[key]]] : []));
      return JSON.stringify(current) === JSON.stringify(next) ? current : next;
    });
  }, [editorImages, form]);

  function focusFirstProblem() {
    window.setTimeout(() => {
      const problem = document.querySelector<HTMLElement>('[data-field-error="true"], .cms-image-card.failed');
      (problem?.querySelector<HTMLElement>('input,textarea,select,button') || problem)?.focus({ preventScroll: true });
      problem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || saving) return;
    const validation = collectValidationErrors(form, editorImages);
    const unprocessed = editorImages.filter((image) => image.kind === 'pending' && !image.processed);
    if (Object.keys(validation.errors).length || unprocessed.length) {
      setFieldErrors(validation.errors);
      if (unprocessed.length) showNotice('Διόρθωσε ή αφαίρεσε τις εικόνες που χρειάζονται ενέργεια.', 'error');
      focusFirstProblem();
      return;
    }

    const wasEditing = Boolean(form.id);
    setSaving(true);
    setNotice(null);
    const payload = {
      slug: validation.normalized.slug,
      title_el: toNullableText(form.title_el), title_en: toNullableText(form.title_en),
      description_el: toNullableText(form.description_el), description_en: toNullableText(form.description_en),
      category: form.category, year: form.year ? Number(form.year) : null,
      location_el: toNullableText(form.location_el), location_en: toNullableText(form.location_en),
      cover_path: coverPathFor(editorImages, coverChoice), featured: form.featured, status: form.status,
    };
    const projectResult = form.id
      ? await supabase.from('projects').update(payload).eq('id', form.id).select().single()
      : await supabase.from('projects').insert(payload).select().single();
    if (projectResult.error || !projectResult.data) {
      console.error('Project save failed', { code: projectResult.error?.code });
      setSaving(false);
      if (projectResult.error?.code === '23505') {
        setFieldErrors({ slug: 'Αυτό το slug χρησιμοποιείται ήδη από άλλο έργο.' });
        focusFirstProblem();
      }
      showNotice(projectResult.error?.code === '23505' ? 'Διάλεξε διαφορετικό slug.' : 'Το έργο δεν αποθηκεύτηκε. Τα δεδομένα σου παραμένουν στη φόρμα.', 'error');
      return;
    }

    const projectId = projectResult.data.id;
    setForm((current) => ({ ...current, id: projectId, slug: validation.normalized.slug }));
    let finalCover = payload.cover_path;
    for (const [index, image] of editorImages.entries()) {
      if (image.kind === 'existing') {
        const result = await supabase.from('project_images').update({
          alt_el: toNullableText(image.alt_el), alt_en: toNullableText(image.alt_en), sort_order: index,
        }).eq('id', image.record.id);
        if (result.error) {
          console.error('Project image metadata update failed', { code: result.error.code });
          setSaving(false);
          setDirty(true);
          showNotice(`Το έργο αποθηκεύτηκε, αλλά δεν ενημερώθηκαν τα στοιχεία της εικόνας ${index + 1}. Δοκίμασε ξανά.`, 'error');
          return;
        }
        if (coverChoice === image.key) finalCover = image.record.cover_storage_path || image.record.storage_path;
        continue;
      }

      if (!image.processed) continue;
      setEditorImages((current) => current.map((item) => item.key === image.key && item.kind === 'pending' ? { ...item, status: 'uploading', error: undefined } : item));
      const base = `projects/${projectId}/${crypto.randomUUID()}`;
      const storagePath = `${base}-gallery.webp`;
      const coverStoragePath = `${base}-cover.webp`;
      const galleryUpload = await supabase.storage.from('project-images').upload(storagePath, image.processed.galleryBlob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
      if (galleryUpload.error) {
        console.error('Gallery upload failed', { code: galleryUpload.error.name });
        setEditorImages((current) => current.map((item) => item.key === image.key && item.kind === 'pending' ? { ...item, status: 'error', error: 'Η μεταφόρτωση της βελτιστοποιημένης εικόνας απέτυχε. Πάτησε αποθήκευση για νέα προσπάθεια.' } : item));
        setSaving(false); setDirty(true);
        showNotice(`Το έργο αποθηκεύτηκε, αλλά το «${image.sourceName}» δεν μεταφορτώθηκε. Οι υπόλοιπες αλλαγές διατηρήθηκαν.`, 'error');
        return;
      }
      const coverUpload = await supabase.storage.from('project-images').upload(coverStoragePath, image.processed.coverBlob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
      if (coverUpload.error) {
        await supabase.storage.from('project-images').remove([storagePath]);
        console.error('Cover upload failed', { code: coverUpload.error.name });
        setEditorImages((current) => current.map((item) => item.key === image.key && item.kind === 'pending' ? { ...item, status: 'error', error: 'Η μεταφόρτωση του εξωφύλλου απέτυχε. Το αρχείο gallery καθαρίστηκε και μπορείς να δοκιμάσεις ξανά.' } : item));
        setSaving(false); setDirty(true);
        showNotice(`Το έργο αποθηκεύτηκε, αλλά το εξώφυλλο του «${image.sourceName}» δεν μεταφορτώθηκε.`, 'error');
        return;
      }
      const inserted = await supabase.from('project_images').insert({
        project_id: projectId, storage_path: storagePath, cover_storage_path: coverStoragePath,
        alt_el: toNullableText(image.alt_el), alt_en: toNullableText(image.alt_en), sort_order: index,
      }).select().single();
      if (inserted.error || !inserted.data) {
        await supabase.storage.from('project-images').remove([storagePath, coverStoragePath]);
        console.error('Project image insert failed', { code: inserted.error?.code });
        setEditorImages((current) => current.map((item) => item.key === image.key && item.kind === 'pending' ? { ...item, status: 'error', error: 'Η καταχώριση της εικόνας απέτυχε. Τα μεταφορτωμένα αρχεία καθαρίστηκαν και μπορείς να δοκιμάσεις ξανά.' } : item));
        setSaving(false); setDirty(true);
        showNotice(`Το έργο αποθηκεύτηκε, αλλά το «${image.sourceName}» δεν καταχωρίστηκε.`, 'error');
        return;
      }
      const signed = await supabase.storage.from('project-images').createSignedUrl(storagePath, 3600);
      URL.revokeObjectURL(image.previewUrl);
      const record: ProjectImage = { ...inserted.data, signedUrl: signed.data?.signedUrl };
      setEditorImages((current) => current.map((item) => item.key === image.key ? { kind: 'existing', key: image.key, record, alt_el: image.alt_el, alt_en: image.alt_en } : item));
      if (coverChoice === image.key) finalCover = coverStoragePath;
    }

    const safeDefaultCover = finalCover || (() => {
      const first = editorImages[0];
      return first?.kind === 'existing' ? first.record.cover_storage_path || first.record.storage_path : null;
    })();
    const coverUpdate = await supabase.from('projects').update({ cover_path: safeDefaultCover }).eq('id', projectId);
    if (coverUpdate.error) {
      console.error('Project cover update failed', { code: coverUpdate.error.code });
      setSaving(false); setDirty(true);
      showNotice('Το έργο και οι εικόνες αποθηκεύτηκαν, αλλά το εξώφυλλο δεν ορίστηκε. Επίλεξέ το και δοκίμασε ξανά.', 'error');
      return;
    }
    await loadData();
    setSaving(false);
    setDirty(false);
    setEditing(false);
    setFieldErrors({});
    showNotice(wasEditing ? 'Οι αλλαγές αποθηκεύτηκαν.' : 'Το νέο έργο δημιουργήθηκε.');
  }

  async function confirmImageDelete() {
    if (!supabase || !imageToDelete || imageToDelete.kind !== 'existing' || deleting) return;
    setDeleting(true);
    const remaining = editorImages.filter((image) => image.key !== imageToDelete.key);
    const nextCover = coverChoice === imageToDelete.key ? remaining[0]?.key || null : coverChoice;
    if (form.id && coverChoice === imageToDelete.key) {
      const cover = await supabase.from('projects').update({ cover_path: coverPathFor(remaining, nextCover) }).eq('id', form.id);
      if (cover.error) {
        setDeleting(false);
        showNotice('Η εικόνα δεν διαγράφηκε επειδή δεν ενημερώθηκε το εξώφυλλο.', 'error');
        return;
      }
    }
    const imagePaths = [imageToDelete.record.storage_path, imageToDelete.record.cover_storage_path].filter((path): path is string => Boolean(path));
    const storage = await supabase.storage.from('project-images').remove(imagePaths);
    if (storage.error) {
      setDeleting(false);
      showNotice('Η εικόνα δεν διαγράφηκε από τον ιδιωτικό χώρο αρχείων.', 'error');
      return;
    }
    const record = await supabase.from('project_images').delete().eq('id', imageToDelete.record.id);
    setDeleting(false);
    setImageToDelete(null);
    if (record.error) {
      showNotice('Το αρχείο διαγράφηκε, αλλά η εγγραφή εικόνας χρειάζεται χειροκίνητο έλεγχο.', 'error');
      return;
    }
    setEditorImages(remaining);
    setCoverChoice(nextCover);
    await loadData();
    showNotice('Η εικόνα διαγράφηκε.');
  }

  async function confirmProjectDelete() {
    if (!supabase || !projectToDelete || deleting) return;
    setDeleting(true);
    const paths = projectImages.filter((image) => image.project_id === projectToDelete.id)
      .flatMap((image) => [image.storage_path, image.cover_storage_path]).filter((path): path is string => Boolean(path));
    if (paths.length) {
      const storage = await supabase.storage.from('project-images').remove(paths);
      if (storage.error) {
        setDeleting(false);
        showNotice('Η διαγραφή σταμάτησε επειδή δεν αφαιρέθηκαν όλα τα αρχεία.', 'error');
        return;
      }
    }
    const result = await supabase.from('projects').delete().eq('id', projectToDelete.id);
    setDeleting(false);
    setProjectToDelete(null);
    if (result.error) {
      showNotice('Τα αρχεία αφαιρέθηκαν, αλλά η εγγραφή έργου χρειάζεται χειροκίνητο έλεγχο.', 'error');
      return;
    }
    await loadData();
    showNotice('Το έργο διαγράφηκε οριστικά.');
  }

  async function togglePublish(project: Project) {
    if (!supabase || publishingId) return;
    setPublishingId(project.id);
    const status: ProjectStatus = project.status === 'published' ? 'draft' : 'published';
    const result = await supabase.from('projects').update({ status }).eq('id', project.id);
    setPublishingId(null);
    if (result.error) showNotice('Η κατάσταση δημοσίευσης δεν άλλαξε.', 'error');
    else {
      await loadData();
      showNotice(status === 'published' ? 'Το έργο δημοσιεύτηκε.' : 'Το έργο μεταφέρθηκε στα πρόχειρα.');
    }
  }

  async function updateRequest(id: string, status: AppointmentStatus) {
    if (!supabase || requestUpdatingId) return;
    setRequestUpdatingId(id);
    const result = await supabase.from('appointment_requests').update({ status }).eq('id', id);
    setRequestUpdatingId(null);
    if (result.error) showNotice('Η κατάσταση του αιτήματος δεν ενημερώθηκε.', 'error');
    else {
      setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
      showNotice('Η κατάσταση του αιτήματος ενημερώθηκε.');
    }
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.replace(loginPath);
  }

  if (loading) return <main className="admin-loading-screen"><LoaderCircle className="spin" /><span>Φόρτωση διαχείρισης…</span></main>;

  return (
    <main className="cms-shell">
      <aside className="cms-sidebar cms-desktop-sidebar">
        <div className="cms-brand"><span><FileText /></span><div><strong>AP Electrical</strong><small>Content studio</small></div></div>
        <nav aria-label="Διαχείριση">
          <button className={section === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><LayoutDashboard />Επισκόπηση</button>
          <button className={section === 'projects' ? 'active' : ''} onClick={() => navigate('projects')}><Images />Έργα<span>{projects.length}</span></button>
          <button className={section === 'requests' ? 'active' : ''} onClick={() => navigate('requests')}><Mail />Αιτήματα{summary.newRequests > 0 && <span className="attention">{summary.newRequests}</span>}</button>
        </nav>
        <div className="cms-sidebar-foot"><a href="/el" target="_blank" rel="noreferrer"><ExternalLink />Προβολή ιστοσελίδας</a><button onClick={() => void logout()}><LogOut />Αποσύνδεση</button></div>
      </aside>

      <div className="cms-main">
        <header className="cms-topbar"><button className="cms-mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Άνοιγμα μενού"><Menu /></button><div><span>Ιδιωτική διαχείριση</span><strong>AP Electrical Services</strong></div><span className="cms-secure"><CheckCircle2 /> MFA ενεργό</span></header>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="cms-mobile-drawer">
            <SheetHeader><SheetTitle>AP Electrical</SheetTitle><SheetDescription>Ιδιωτική διαχείριση περιεχομένου</SheetDescription></SheetHeader>
            <nav aria-label="Διαχείριση κινητού">
              <button className={section === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><LayoutDashboard />Επισκόπηση</button>
              <button className={section === 'projects' ? 'active' : ''} onClick={() => navigate('projects')}><Images />Έργα<span>{projects.length}</span></button>
              <button className={section === 'requests' ? 'active' : ''} onClick={() => navigate('requests')}><Mail />Αιτήματα{summary.newRequests > 0 && <span>{summary.newRequests}</span>}</button>
            </nav>
            <div className="cms-mobile-drawer-foot"><a href="/el" target="_blank" rel="noreferrer"><ExternalLink />Προβολή ιστοσελίδας</a><button onClick={() => void logout()}><LogOut />Αποσύνδεση</button></div>
          </SheetContent>
        </Sheet>
        <section className="cms-workspace">
          {notice && <div className={`cms-notice ${notice.kind}`} role="status"><span>{notice.text}</span><button onClick={() => setNotice(null)} aria-label="Κλείσιμο"><X /></button></div>}

          {section === 'dashboard' && <>
            <div className="cms-page-heading"><div><span>Dashboard</span><h1>Καλή συνέχεια.</h1><p>Γρήγορη εικόνα του περιεχομένου και των νέων αιτημάτων.</p></div><Button size="lg" onClick={startCreate}><Plus />Νέο έργο</Button></div>
            <div className="cms-stats">
              <article><span><Images /></span><div><small>Σύνολο έργων</small><strong>{summary.total}</strong></div></article>
              <article><span className="green"><CheckCircle2 /></span><div><small>Δημοσιευμένα</small><strong>{summary.published}</strong></div></article>
              <article><span className="amber"><FileText /></span><div><small>Πρόχειρα</small><strong>{summary.drafts}</strong></div></article>
              <article><span className="blue"><Mail /></span><div><small>Νέα αιτήματα</small><strong>{summary.newRequests}</strong></div></article>
            </div>
            <div className="cms-dashboard-grid">
              <section className="cms-panel"><div className="cms-panel-title"><div><span>Πρόσφατο περιεχόμενο</span><h2>Τελευταία έργα</h2></div><button onClick={() => navigate('projects')}>Όλα τα έργα</button></div>{projects.slice(0, 5).map((project) => <button className="cms-recent-project" key={project.id} onClick={() => startEdit(project)}><ProjectThumbnail project={project} images={projectImages} /><span><strong>{projectName(project)}</strong><small>{categoryName(project.category)} · {formatDate(project.updated_at)}</small></span><StatusBadge status={project.status} /></button>)}{!projects.length && <EmptyState text="Δεν υπάρχουν ακόμη έργα στη βάση." />}</section>
              <section className="cms-panel"><div className="cms-panel-title"><div><span>Εισερχόμενα</span><h2>Νέα αιτήματα</h2></div><button onClick={() => setSection('requests')}>Όλα</button></div>{requests.filter((request) => request.status === 'new').slice(0, 4).map((request) => <article className="cms-request-preview" key={request.id}><span>{request.name.slice(0, 1).toUpperCase()}</span><div><strong>{request.name}</strong><small>{request.work_type} · {request.area}</small></div><time>{new Intl.DateTimeFormat('el-GR').format(new Date(request.created_at))}</time></article>)}{!summary.newRequests && <EmptyState text="Δεν υπάρχουν νέα αιτήματα." />}</section>
            </div>
          </>}

          {section === 'projects' && (editing ? <AdminProjectEditor form={form} onFormChange={updateForm} images={editorImages} setImages={updateEditorImages} coverChoice={coverChoice} setCoverChoice={updateCoverChoice} errors={fieldErrors} addFiles={addFiles} retryImage={retryImage} saving={saving} onSubmit={saveProject} onCancel={() => leaveEditor(() => setEditing(false))} requestImageDelete={setImageToDelete} /> : <>
            <div className="cms-page-heading"><div><span>Portfolio</span><h1>Έργα</h1><p>Διαχειριστείτε δημοσίευση, περιεχόμενο και εικόνες.</p></div><Button size="lg" onClick={startCreate}><Plus />Νέο έργο</Button></div>
            <div className="cms-toolbar"><label><Search /><input value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Αναζήτηση έργου…" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Φίλτρο κατάστασης"><option value="all">Όλες οι καταστάσεις</option><option value="published">Δημοσιευμένα</option><option value="draft">Πρόχειρα</option></select></div>
            <div className="cms-project-list"><div className="cms-project-head"><span>Έργο</span><span>Κατηγορία</span><span>Κατάσταση</span><span>Ενημέρωση</span><span>Ενέργειες</span></div>{visibleProjects.map((project) => <article className="cms-project-row" key={project.id}><div className="cms-project-identity"><ProjectThumbnail project={project} images={projectImages} /><span><strong>{projectName(project)}</strong><small>/{project.slug}{project.featured && <em><Star />Προτεινόμενο</em>}</small></span></div><span>{categoryName(project.category)}</span><StatusBadge status={project.status} /><time>{formatDate(project.updated_at)}</time><div className="cms-row-actions"><Button variant="outline" size="sm" onClick={() => void togglePublish(project)} disabled={publishingId === project.id}>{publishingId === project.id ? <LoaderCircle className="spin" /> : <Send />}{project.status === 'published' ? 'Απόσυρση' : 'Δημοσίευση'}</Button><Button variant="outline" size="icon" onClick={() => startEdit(project)} aria-label={`Επεξεργασία ${projectName(project)}`}><Pencil /></Button><Button variant="destructive" size="icon" onClick={() => setProjectToDelete(project)} aria-label={`Διαγραφή ${projectName(project)}`}><Trash2 /></Button></div></article>)}{!visibleProjects.length && <EmptyState text={projects.length ? 'Δεν βρέθηκαν έργα με αυτά τα φίλτρα.' : 'Δεν υπάρχουν έργα. Δημιουργήστε το πρώτο πραγματικό έργο.'} />}</div>
          </>)}

          {section === 'requests' && <>
            <div className="cms-page-heading"><div><span>Customer requests</span><h1>Αιτήματα ραντεβού</h1><p>Στοιχεία επικοινωνίας, προτίμηση χρόνου και πορεία εξυπηρέτησης.</p></div></div>
            <div className="cms-request-controls">
              <Tabs value={requestFilter} onValueChange={(value) => setRequestFilter(value as AppointmentRequestFilter)} className="cms-request-tabs">
                <TabsList aria-label="Φίλτρο κατάστασης αιτημάτων" className="cms-request-tab-list">
                  {APPOINTMENT_REQUEST_FILTERS.map((filter) => <TabsTrigger key={filter.value} value={filter.value} className="cms-request-tab">{filter.label}<span>{requestCounts[filter.value]}</span></TabsTrigger>)}
                </TabsList>
              </Tabs>
              <label className="cms-request-search"><Search /><Input type="search" value={requestQuery} onChange={(event) => setRequestQuery(event.target.value)} placeholder="Όνομα, τηλέφωνο, email ή περιοχή…" aria-label="Αναζήτηση αιτημάτων" /></label>
            </div>
            <div className="cms-request-results-summary" aria-live="polite"><strong>{visibleRequests.length} {visibleRequests.length === 1 ? 'αίτημα' : 'αιτήματα'}</strong><span>Νεότερα πρώτα · βάσει ημερομηνίας υποβολής</span></div>
            <div className="cms-requests">{visibleRequests.map((request) => <article key={request.id} className={`request-${request.status}`}><header><div><span className="cms-avatar">{request.name.slice(0, 1).toUpperCase()}</span><div><h2>{request.name}</h2><time dateTime={request.created_at}>Υποβλήθηκε {formatDate(request.created_at)}</time></div></div><div className="cms-request-status-control"><RequestStatusBadge status={request.status} /><select value={request.status} disabled={requestUpdatingId === request.id} onChange={(event) => void updateRequest(request.id, event.target.value as AppointmentStatus)} aria-label={`Κατάσταση αιτήματος ${request.name}`} aria-busy={requestUpdatingId === request.id}><option value="new">Εκκρεμές</option><option value="contacted">Επικοινωνήσαμε</option><option value="completed">Ολοκληρωμένο</option></select></div></header><div className="cms-request-facts"><span><CircleGauge />{categoryName(request.work_type)}</span><span><MapPin />{request.area}</span>{(request.preferred_date || request.preferred_time) && <span><CalendarDays />{request.preferred_date || 'Χωρίς ημερομηνία'}{request.preferred_time ? ` · ${request.preferred_time.slice(0, 5)}` : ''}</span>}</div><p>{request.message}</p><footer><a href={`tel:${request.phone}`}><Phone />{request.phone}</a>{request.email && <a href={`mailto:${request.email}`}><Mail />{request.email}</a>}</footer></article>)}{!visibleRequests.length && <EmptyState text={requestQuery.trim() ? 'Δεν βρέθηκαν αιτήματα με αυτή την αναζήτηση στο ενεργό φίλτρο.' : APPOINTMENT_REQUEST_EMPTY_STATES[requestFilter]} />}</div>
          </>}
        </section>
      </div>

      <AlertDialog open={Boolean(projectToDelete)} onOpenChange={(open) => !open && !deleting && setProjectToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><Trash2 /></AlertDialogMedia><AlertDialogTitle>Οριστική διαγραφή έργου;</AlertDialogTitle><AlertDialogDescription>Θα διαγραφεί το έργο «{projectToDelete ? projectName(projectToDelete) : ''}», όλες οι εγγραφές εικόνων και τα αντίστοιχα ιδιωτικά αρχεία. Η ενέργεια δεν αναιρείται.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleting}>Ακύρωση</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void confirmProjectDelete()}>{deleting && <LoaderCircle className="spin" />}Οριστική διαγραφή</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={Boolean(imageToDelete)} onOpenChange={(open) => !open && !deleting && setImageToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><Trash2 /></AlertDialogMedia><AlertDialogTitle>Διαγραφή εικόνας;</AlertDialogTitle><AlertDialogDescription>Το αρχείο και η εγγραφή εικόνας θα διαγραφούν οριστικά από αυτό το έργο.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleting}>Ακύρωση</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void confirmImageDelete()}>{deleting && <LoaderCircle className="spin" />}Διαγραφή εικόνας</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={unsavedOpen} onOpenChange={(open) => { if (!open) { setUnsavedOpen(false); pendingNavigation.current = null; } }}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><AlertCircle /></AlertDialogMedia><AlertDialogTitle>Απόρριψη μη αποθηκευμένων αλλαγών;</AlertDialogTitle><AlertDialogDescription>Το περιεχόμενο, η σειρά εικόνων ή οι νέες φωτογραφίες που δεν έχουν αποθηκευτεί θα χαθούν.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Συνέχεια επεξεργασίας</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={discardAndContinue}>Απόρριψη αλλαγών</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </main>
  );
}

function ProjectThumbnail({ project, images }: { project: Project; images: ProjectImage[] }) {
  const image = images.find((item) => item.storage_path === project.cover_path || item.cover_storage_path === project.cover_path) || images.find((item) => item.project_id === project.id);
  return <span className="cms-thumbnail">{image?.signedUrl ? <Image src={image.signedUrl} alt="" fill sizes="64px" /> : <Images />}</span>;
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`cms-status ${status}`}>{status === 'published' ? 'Δημοσιευμένο' : 'Πρόχειρο'}</span>;
}

function RequestStatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`cms-request-status ${status}`}>{APPOINTMENT_STATUS_LABELS[status]}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="cms-empty"><FileText /><p>{text}</p></div>;
}
