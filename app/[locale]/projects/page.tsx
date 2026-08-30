import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/page-hero';
import { PublicPage } from '@/components/public-page';
import { ProjectsGrid } from '@/components/projects-grid';
import { ExampleNote } from '@/components/example-note';
import { getPublishedProjects } from '@/lib/projects';
import { isLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const el = locale === 'el';
  return {
    title: el
      ? 'Έργα και ενδεικτικές εργασίες'
      : 'Projects and example services',
    description: el
      ? 'Δείτε ενδεικτικές κατηγορίες ηλεκτρολογικών εργασιών για κατοικίες.'
      : 'Browse example categories of residential electrical work.',
    alternates: {
      canonical: `/${locale}/projects`,
      languages: { el: '/el/projects', en: '/en/projects' },
    },
  };
}
export default async function Projects({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const projects = await getPublishedProjects();
  const el = locale === 'el';
  return (
    <PublicPage locale={locale} active="projects">
      <PageHero
        eyebrow={el ? 'Portfolio' : 'Portfolio'}
        title={
          el ? 'Έργα & ενδεικτικές εργασίες' : 'Projects & example services'
        }
        description={
          el
            ? 'Φιλτράρετε τις εργασίες ανά κατηγορία και δείτε περισσότερες πληροφορίες.'
            : 'Filter the work by category and view more information.'
        }
        image="/images/finished-lighting.webp"
        alt={
          el
            ? 'Ενδεικτικό ολοκληρωμένο σύστημα φωτισμού κατοικίας'
            : 'Example completed residential lighting system'
        }
      />
      <section className="section portfolio-section">
        <ExampleNote locale={locale} />
        <ProjectsGrid locale={locale} projects={projects} />
      </section>
    </PublicPage>
  );
}
