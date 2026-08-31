'use client';

import { type DragEvent, type FormEvent, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, GripVertical,
  ImagePlus, LoaderCircle, RefreshCw, Trash2, UploadCloud, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/database';
import type { FieldErrors, ProjectFormValues } from '@/lib/project-validation';
import { formatBytes, type ProcessedProjectImage } from '@/lib/admin-image-processing';

export type ProjectImageRecord = Database['public']['Tables']['project_images']['Row'] & { signedUrl?: string };
export type ImageWorkStatus = 'preparing' | 'optimizing' | 'ready' | 'uploading' | 'complete' | 'error';
export type EditorImage =
  | { kind: 'existing'; key: string; record: ProjectImageRecord; alt_el: string; alt_en: string }
  | {
      kind: 'pending'; key: string; sourceName: string; sourceFile?: File; previewUrl: string;
      processed?: ProcessedProjectImage; alt_el: string; alt_en: string; status: ImageWorkStatus;
      error?: string; uploadProgress?: string;
    };

const categories = [
  ['renovation', 'Ανακαίνιση'], ['new-build', 'Νέα κατασκευή'],
  ['repair', 'Επισκευή'], ['lighting', 'Φωτισμός'],
] as const;

const statusText: Record<ImageWorkStatus, string> = {
  preparing: 'Προετοιμασία…', optimizing: 'Βελτιστοποίηση…', ready: 'Έτοιμο',
  uploading: 'Μεταφόρτωση…', complete: 'Ολοκληρώθηκε', error: 'Χρειάζεται ενέργεια',
};

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function Field({ name, label, error, wide = false, hint, children }: {
  name: string; label: string; error?: string; wide?: boolean; hint?: string; children: React.ReactNode;
}) {
  const errorId = `${name.replace(/[^a-z0-9_-]/gi, '-')}-error`;
  const hintId = `${name.replace(/[^a-z0-9_-]/gi, '-')}-hint`;
  return (
    <label className={`cms-field${wide ? ' wide' : ''}${error ? ' invalid' : ''}`} data-field-error={error ? 'true' : undefined}>
      <span>{label}</span>
      <span className="cms-field-control">{children}</span>
      {hint && !error && <small id={hintId}>{hint}</small>}
      {error && <small className="cms-field-error" id={errorId} role="alert"><AlertCircle />{error}</small>}
    </label>
  );
}

function fieldA11y(name: string, error?: string, hint?: string) {
  const base = name.replace(/[^a-z0-9_-]/gi, '-');
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${base}-error` : hint ? `${base}-hint` : undefined,
    'data-error-key': name,
  };
}

export function AdminProjectEditor({
  form, onFormChange, images, setImages, coverChoice, setCoverChoice, errors,
  addFiles, retryImage, saving, onSubmit, onCancel, requestImageDelete,
}: {
  form: ProjectFormValues;
  onFormChange: (next: ProjectFormValues, changed: keyof ProjectFormValues) => void;
  images: EditorImage[];
  setImages: React.Dispatch<React.SetStateAction<EditorImage[]>>;
  coverChoice: string | null;
  setCoverChoice: (value: string | null) => void;
  errors: FieldErrors;
  addFiles: (files: File[]) => void;
  retryImage: (key: string) => void;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  requestImageDelete: (image: EditorImage) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const processing = images.some((image) => image.kind === 'pending' && ['preparing', 'optimizing', 'uploading'].includes(image.status));

  const update = <K extends keyof ProjectFormValues>(field: K, value: ProjectFormValues[K]) =>
    onFormChange({ ...form, [field]: value }, field);
  const changeImage = (key: string, field: 'alt_el' | 'alt_en', value: string) =>
    setImages((current) => current.map((image) => image.key === key ? { ...image, [field]: value } : image));
  const removeImage = (image: EditorImage) => {
    if (image.kind === 'existing') requestImageDelete(image);
    else {
      URL.revokeObjectURL(image.previewUrl);
      const remaining = images.filter((item) => item.key !== image.key);
      setImages(remaining);
      if (coverChoice === image.key) setCoverChoice(remaining[0]?.key || null);
    }
  };
  const chooseFiles = (files: FileList | null) => files && addFiles(Array.from(files));
  const dropFiles = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) chooseFiles(event.dataTransfer.files);
  };
  const dropCard = (targetKey: string) => {
    if (!draggedKey || draggedKey === targetKey) return;
    setImages((current) => {
      const from = current.findIndex((image) => image.key === draggedKey);
      const to = current.findIndex((image) => image.key === targetKey);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedKey(null);
  };

  return (
    <form className="cms-editor" onSubmit={onSubmit} noValidate>
      <div className="cms-page-heading cms-editor-heading">
        <div><span>{form.id ? 'Edit project' : 'New project'}</span><h1>{form.id ? (form.title_el || form.title_en || 'Επεξεργασία έργου') : 'Νέο έργο'}</h1><p>Μία έγκυρη γλώσσα αρκεί. Οι κενές μεταφράσεις συμπληρώνονται με ασφαλές fallback στη δημόσια σελίδα.</p></div>
        <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={saving}><X />Κλείσιμο</Button>
      </div>

      <section className="cms-form-card">
        <div className="cms-form-section-title"><span>01</span><div><h2>Βασικό περιεχόμενο</h2><p>Συμπλήρωσε τουλάχιστον μία γλώσσα για τίτλο και περιγραφή.</p></div></div>
        <div className="cms-form-grid">
          <Field name="title_el" label="Τίτλος (EL)" error={errors.title_el} hint="Προαιρετικό όταν υπάρχει αγγλικός τίτλος."><input value={form.title_el} maxLength={160} onChange={(event) => update('title_el', event.target.value)} {...fieldA11y('title_el', errors.title_el, 'hint')} /></Field>
          <Field name="title_en" label="Title (EN)" error={errors.title_en} hint="Προαιρετικό όταν υπάρχει ελληνικός τίτλος."><input value={form.title_en} maxLength={160} onChange={(event) => update('title_en', event.target.value)} {...fieldA11y('title_en', errors.title_en, 'hint')} /></Field>
          <Field name="description_el" label="Περιγραφή (EL)" error={errors.description_el} wide><textarea rows={7} value={form.description_el} maxLength={3000} onChange={(event) => update('description_el', event.target.value)} {...fieldA11y('description_el', errors.description_el)} /></Field>
          <Field name="description_en" label="Description (EN)" error={errors.description_en} wide><textarea rows={7} value={form.description_en} maxLength={3000} onChange={(event) => update('description_en', event.target.value)} {...fieldA11y('description_en', errors.description_en)} /></Field>
          <Field name="slug" label="Slug" error={errors.slug} hint="Αφήστε το κενό και θα δημιουργηθεί από τον τίτλο."><input value={form.slug} maxLength={180} autoCapitalize="none" spellCheck={false} placeholder="π.χ. apartment-renovation" onChange={(event) => update('slug', event.target.value)} {...fieldA11y('slug', errors.slug, 'hint')} /></Field>
          <Field name="category" label="Κατηγορία" error={errors.category}><select value={form.category} onChange={(event) => update('category', event.target.value)} {...fieldA11y('category', errors.category)}>{categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></Field>
          <Field name="year" label="Έτος" error={errors.year} hint="Προαιρετικό · 2000–2100"><input inputMode="numeric" value={form.year} onChange={(event) => update('year', event.target.value)} {...fieldA11y('year', errors.year, 'hint')} /></Field>
          <Field name="location_el" label="Τοποθεσία (EL)" error={errors.location_el}><input value={form.location_el} maxLength={160} onChange={(event) => update('location_el', event.target.value)} {...fieldA11y('location_el', errors.location_el)} /></Field>
          <Field name="location_en" label="Location (EN)" error={errors.location_en}><input value={form.location_en} maxLength={160} onChange={(event) => update('location_en', event.target.value)} {...fieldA11y('location_en', errors.location_en)} /></Field>
        </div>
      </section>

      <section className="cms-form-card">
        <div className="cms-form-section-title"><span>02</span><div><h2>Εικόνες έργου</h2><p>Άμεση προεπισκόπηση, βελτιστοποίηση WebP, 8:5 εξώφυλλο και ακριβής σειρά.</p></div></div>
        <section
          className={`cms-upload${dragging ? ' dragging' : ''}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
          onDrop={dropFiles}
          aria-label="Μεταφόρτωση εικόνων"
        >
          <UploadCloud /><div><strong>Σύρε εικόνες εδώ</strong><span>ή επίλεξε από Φωτογραφίες, Κάμερα ή Αρχεία · έως 25 MB πηγή</span></div>
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={saving}><ImagePlus />Επιλογή εικόνων</Button>
          <input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif" multiple onChange={(event) => { chooseFiles(event.target.files); event.target.value = ''; }} disabled={saving} />
        </section>

        <div className="cms-image-grid" aria-live="polite">
          {images.map((image, index) => {
            const altElKey = `images.${image.key}.alt_el`;
            const altEnKey = `images.${image.key}.alt_en`;
            const isCover = coverChoice === image.key;
            const preview = image.kind === 'existing' ? image.record.signedUrl : image.previewUrl;
            return (
              <article
                className={`cms-image-card${isCover ? ' cover' : ''}${image.kind === 'pending' && image.status === 'error' ? ' failed' : ''}`}
                key={image.key} draggable={!saving} onDragStart={() => setDraggedKey(image.key)}
                onDragOver={(event) => event.preventDefault()} onDrop={() => dropCard(image.key)}
              >
                <div className="cms-image-card-preview">
                  {preview ? <Image src={preview} alt="" fill unoptimized sizes="(max-width: 600px) 100vw, 260px" /> : <ImagePlus />}
                  <span className="cms-order"><GripVertical />{index + 1}</span>
                  {isCover && <span className="cms-cover-badge"><Check />Εξώφυλλο</span>}
                </div>
                <div className="cms-image-card-body">
                  <div className="cms-image-file"><strong>{image.kind === 'existing' ? image.record.storage_path.split('/').at(-1) : image.sourceName}</strong>
                    {image.kind === 'pending' && <span className={`cms-image-state ${image.status}`}>{['preparing', 'optimizing', 'uploading'].includes(image.status) && <LoaderCircle className="spin" />}{image.status === 'ready' || image.status === 'complete' ? <CheckCircle2 /> : image.status === 'error' ? <AlertCircle /> : null}{statusText[image.status]}</span>}
                  </div>
                  {image.kind === 'pending' && image.processed && <p className="cms-image-metadata">{formatBytes(image.processed.originalBytes)} → {formatBytes(image.processed.optimizedBytes)} · {image.processed.width}×{image.processed.height}</p>}
                  {image.kind === 'pending' && image.error && <p className="cms-image-processing-error" role="alert"><AlertCircle />{image.error}</p>}
                  <div className="cms-image-alt-grid">
                    <Field name={altElKey} label="Alt text (EL)" error={errors[altElKey]}><input value={image.alt_el} maxLength={300} onChange={(event) => changeImage(image.key, 'alt_el', event.target.value)} {...fieldA11y(altElKey, errors[altElKey])} /></Field>
                    <Field name={altEnKey} label="Alt text (EN)" error={errors[altEnKey]}><input value={image.alt_en} maxLength={300} onChange={(event) => changeImage(image.key, 'alt_en', event.target.value)} {...fieldA11y(altEnKey, errors[altEnKey])} /></Field>
                  </div>
                  <div className="cms-image-card-actions">
                    <Button type="button" variant={isCover ? 'default' : 'outline'} onClick={() => setCoverChoice(image.key)} disabled={saving}>{isCover ? <Check /> : <ImagePlus />}{isCover ? 'Εξώφυλλο' : 'Ορισμός εξωφύλλου'}</Button>
                    {image.kind === 'pending' && image.status === 'error' && (image.sourceFile || image.processed) && <Button type="button" variant="outline" size="icon" aria-label={`Νέα προσπάθεια για ${image.sourceName}`} onClick={() => retryImage(image.key)}><RefreshCw /></Button>}
                    <span className="cms-reorder-actions"><Button type="button" variant="outline" size="icon" aria-label={`Μετακίνηση ${index + 1} αριστερά`} disabled={index === 0 || saving} onClick={() => setImages((current) => moveItem(current, index, -1))}><ArrowLeft /></Button><Button type="button" variant="outline" size="icon" aria-label={`Μετακίνηση ${index + 1} δεξιά`} disabled={index === images.length - 1 || saving} onClick={() => setImages((current) => moveItem(current, index, 1))}><ArrowRight /></Button></span>
                    <Button type="button" variant="destructive" size="icon" aria-label={`Διαγραφή εικόνας ${index + 1}`} disabled={saving} onClick={() => removeImage(image)}><Trash2 /></Button>
                  </div>
                </div>
              </article>
            );
          })}
          <button className="cms-image-add-tile" type="button" onClick={() => fileInput.current?.click()} disabled={saving}><ImagePlus /><span>Προσθήκη</span></button>
        </div>
      </section>

      <section className="cms-publish-card">
        <label><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /><span><strong>Προτεινόμενο έργο</strong><small>Εμφάνιση στην αρχική όταν δημοσιευτεί.</small></span></label>
        <Field name="status" label="Κατάσταση" error={errors.status}><select value={form.status} onChange={(event) => update('status', event.target.value as ProjectFormValues['status'])} {...fieldA11y('status', errors.status)}><option value="draft">Πρόχειρο</option><option value="published">Δημοσιευμένο</option></select></Field>
        <Button type="submit" size="lg" disabled={saving || processing}>{saving ? <LoaderCircle className="spin" /> : <CheckCircle2 />}{saving ? 'Αποθήκευση…' : processing ? 'Οι εικόνες ετοιμάζονται…' : 'Αποθήκευση έργου'}</Button>
      </section>
    </form>
  );
}
