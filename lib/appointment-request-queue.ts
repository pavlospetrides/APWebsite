import type { AppointmentStatus, Database } from '@/types/database';

export type AppointmentRequestFilter = 'all' | AppointmentStatus;

type AppointmentRequest = Database['public']['Tables']['appointment_requests']['Row'];
type SearchableAppointmentRequest = Pick<
  AppointmentRequest,
  'name' | 'phone' | 'email' | 'area' | 'status' | 'created_at'
>;

export const DEFAULT_APPOINTMENT_REQUEST_FILTER: AppointmentRequestFilter = 'new';

export const APPOINTMENT_REQUEST_FILTERS: ReadonlyArray<{
  value: AppointmentRequestFilter;
  label: string;
}> = [
  { value: 'all', label: 'Όλα' },
  { value: 'new', label: 'Εκκρεμή' },
  { value: 'contacted', label: 'Επικοινωνήσαμε' },
  { value: 'completed', label: 'Ολοκληρωμένα' },
];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  new: 'Εκκρεμές',
  contacted: 'Επικοινωνήσαμε',
  completed: 'Ολοκληρωμένο',
};

export const APPOINTMENT_REQUEST_EMPTY_STATES: Record<AppointmentRequestFilter, string> = {
  all: 'Δεν υπάρχουν ακόμη αιτήματα πελατών.',
  new: 'Δεν υπάρχουν εκκρεμή αιτήματα.',
  contacted: 'Δεν υπάρχουν αιτήματα στα οποία έχει γίνει επικοινωνία.',
  completed: 'Δεν υπάρχουν ολοκληρωμένα αιτήματα.',
};

export function countAppointmentRequests(requests: readonly SearchableAppointmentRequest[]) {
  const counts = { all: requests.length, new: 0, contacted: 0, completed: 0 };
  for (const request of requests) counts[request.status] += 1;
  return counts;
}

export function filterAppointmentRequests<T extends SearchableAppointmentRequest>(
  requests: readonly T[],
  filter: AppointmentRequestFilter,
  query: string,
) {
  const search = query.trim().toLocaleLowerCase('el-GR');
  return requests
    .filter((request) => {
      if (filter !== 'all' && request.status !== filter) return false;
      if (!search) return true;
      return [request.name, request.phone, request.email, request.area]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase('el-GR').includes(search));
    })
    .toSorted((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

