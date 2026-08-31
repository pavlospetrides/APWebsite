'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Images } from 'lucide-react';
import { categoryLabel, type PortfolioProject, type ProjectCategory } from '@/lib/project-types';
import type { Locale } from '@/lib/i18n';

export function ProjectsGrid({ locale, projects }: { locale: Locale; projects: PortfolioProject[] }) {
  const [filter, setFilter] = useState<'all' | ProjectCategory>('all');
  const categories: Array<'all' | ProjectCategory> = ['all','renovation','new-build','repair','lighting'];
  const filtered = filter === 'all' ? projects : projects.filter(project => project.category === filter);
  return <><div className="project-filters" aria-label={locale === 'el' ? 'Φίλτρα έργων' : 'Project filters'}>{categories.map(category => <button type="button" aria-pressed={filter === category} className={filter === category ? 'active' : ''} onClick={() => setFilter(category)} key={category}>{category === 'all' ? (locale === 'el' ? 'Όλα' : 'All') : categoryLabel[category][locale]}</button>)}</div><div className="project-grid portfolio-grid">{filtered.map(project => <a className="project-card" href={`/${locale}/projects/${project.slug}`} key={project.slug}><div className="project-image">{project.cover ? <Image src={project.cover} alt={project.coverAlt[locale]} fill sizes="(max-width: 800px) 100vw, 50vw" /> : <span className="project-image-empty"><Images />{locale === 'el' ? 'Χωρίς εικόνα' : 'No image'}</span>}</div><div><span>{categoryLabel[project.category][locale]}{project.year ? ` · ${project.year}` : ''}</span><h2>{project.title[locale]}</h2><p>{project.description[locale]}</p><span className="card-link">{locale === 'el' ? 'Προβολή' : 'View'}<ArrowUpRight /></span></div></a>)}</div>{filtered.length === 0 && <p className="empty-state">{locale === 'el' ? 'Δεν υπάρχουν δημοσιευμένα έργα σε αυτή την κατηγορία.' : 'There are no published projects in this category.'}</p>}</>;
}
