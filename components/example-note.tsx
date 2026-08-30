import { Info } from 'lucide-react';
import { type Locale } from '@/lib/i18n';

export function ExampleNote({ locale }: { locale: Locale }) {
  return <p className="example-note"><Info aria-hidden="true" />{locale === 'el' ? 'Οι εικόνες παρουσιάζουν ενδεικτικές εργασίες και όχι πραγματικά ολοκληρωμένα έργα του επαγγελματία.' : 'Images show example services and are not presented as the professional’s completed projects.'}</p>;
}
