import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PublicPage } from '@/components/public-page';
import { ExampleNote } from '@/components/example-note';
import { CtaBand } from '@/components/cta-band';
import { getProject } from '@/lib/projects';
import { categoryLabel, exampleProjects } from '@/lib/projects.seed';
import { isLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return ['el','en'].flatMap(locale => exampleProjects.map(p => ({ locale, slug: p.slug }))); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { locale, slug } = await params; if (!isLocale(locale)) return {}; const project = await getProject(slug); if (!project) return {}; return { title: `${project.title[locale]} | AP Electrical Services`, description: project.description[locale], openGraph: { title: project.title[locale], description: project.description[locale], images: [{ url: project.cover }] }, twitter: { card: 'summary_large_image', title: project.title[locale], description: project.description[locale], images: [project.cover] }, alternates: { canonical: `/${locale}/projects/${slug}`, languages: { el: `/el/projects/${slug}`, en: `/en/projects/${slug}` } } }; }
export default async function ProjectDetail({ params }: Props) { const { locale, slug } = await params; if (!isLocale(locale)) notFound(); const project = await getProject(slug); if (!project) notFound(); const el = locale === 'el'; return <PublicPage locale={locale} active="projects"><article className="project-detail"><div className="project-detail-head"><a href={`/${locale}/projects`}><ArrowLeft />{el ? 'Όλα τα έργα' : 'All projects'}</a><p className="section-kicker">{categoryLabel[project.category][locale]}</p><h1>{project.title[locale]}</h1><p>{project.description[locale]}</p><div className="project-meta"><span><CalendarDays />{project.year}</span>{project.location[locale] && <span><MapPin />{project.location[locale]}</span>}</div></div><ExampleNote locale={locale} /><div className="detail-gallery">{project.images.map((src, i) => <div key={`${src}-${i}`}><Image src={src} alt={`${project.alt[locale]} ${i+1}`} fill priority={i===0} sizes="(max-width: 800px) 100vw, 80vw" /></div>)}</div></article><CtaBand locale={locale} title={el ? 'Θέλετε να συζητήσουμε μια παρόμοια εργασία;' : 'Would you like to discuss similar work?'} text={el ? 'Στείλτε τις βασικές πληροφορίες για τον χώρο και την ανάγκη σας.' : 'Send the key information about the property and your requirements.'} /></PublicPage>; }
