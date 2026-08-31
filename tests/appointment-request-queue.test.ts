import { describe, expect, it } from 'vitest';
import {
  APPOINTMENT_REQUEST_EMPTY_STATES,
  APPOINTMENT_STATUS_LABELS,
  countAppointmentRequests,
  DEFAULT_APPOINTMENT_REQUEST_FILTER,
  filterAppointmentRequests,
} from '../lib/appointment-request-queue';
import type { AppointmentStatus } from '../types/database';

type QueueRequest = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  area: string;
  status: AppointmentStatus;
  created_at: string;
};

const requests: QueueRequest[] = [
  { id: 'pending-old', name: 'Άννα Ιωάννου', phone: '99111222', email: 'anna@example.com', area: 'Λεμεσός', status: 'new', created_at: '2026-08-01T10:00:00Z' },
  { id: 'contacted', name: 'Maria Georgiou', phone: '99222333', email: 'maria@example.com', area: 'Paphos', status: 'contacted', created_at: '2026-08-02T10:00:00Z' },
  { id: 'completed', name: 'Andreas Petrou', phone: '99333444', email: null, area: 'Larnaca', status: 'completed', created_at: '2026-08-03T10:00:00Z' },
  { id: 'pending-new', name: 'Giorgos Nicolaou', phone: '99444555', email: 'giorgos@example.com', area: 'Nicosia', status: 'new', created_at: '2026-08-04T10:00:00Z' },
];

describe('appointment request queue', () => {
  it('defaults to pending and maps every database status to the requested Greek label', () => {
    expect(DEFAULT_APPOINTMENT_REQUEST_FILTER).toBe('new');
    expect(APPOINTMENT_STATUS_LABELS).toEqual({
      new: 'Εκκρεμές',
      contacted: 'Επικοινωνήσαμε',
      completed: 'Ολοκληρωμένο',
    });
  });

  it('derives all live counts from the already-authorized request collection', () => {
    expect(countAppointmentRequests(requests)).toEqual({ all: 4, new: 2, contacted: 1, completed: 1 });
  });

  it.each([
    ['all', ['pending-new', 'completed', 'contacted', 'pending-old']],
    ['new', ['pending-new', 'pending-old']],
    ['contacted', ['contacted']],
    ['completed', ['completed']],
  ] as const)('filters %s requests and keeps newest-created first', (filter, ids) => {
    expect(filterAppointmentRequests(requests, filter, '').map((request) => request.id)).toEqual(ids);
  });

  it('searches name, phone, email, and area only inside the active status', () => {
    expect(filterAppointmentRequests(requests, 'new', '9944').map((request) => request.id)).toEqual(['pending-new']);
    expect(filterAppointmentRequests(requests, 'all', 'maria@example.com').map((request) => request.id)).toEqual(['contacted']);
    expect(filterAppointmentRequests(requests, 'completed', 'LARNACA').map((request) => request.id)).toEqual(['completed']);
    expect(filterAppointmentRequests(requests, 'new', 'Paphos')).toEqual([]);
  });

  it('moves a successfully updated request between status views without a reload', () => {
    const contacted = requests.map((request) => request.id === 'pending-new' ? { ...request, status: 'contacted' as const } : request);
    expect(filterAppointmentRequests(contacted, 'new', '').map((request) => request.id)).not.toContain('pending-new');
    expect(filterAppointmentRequests(contacted, 'contacted', '').map((request) => request.id)).toContain('pending-new');

    const completed = contacted.map((request) => request.id === 'pending-new' ? { ...request, status: 'completed' as const } : request);
    expect(filterAppointmentRequests(completed, 'contacted', '').map((request) => request.id)).not.toContain('pending-new');
    expect(filterAppointmentRequests(completed, 'completed', '').map((request) => request.id)).toContain('pending-new');
  });

  it('provides a specific empty state for every filter', () => {
    expect(APPOINTMENT_REQUEST_EMPTY_STATES).toEqual({
      all: 'Δεν υπάρχουν ακόμη αιτήματα πελατών.',
      new: 'Δεν υπάρχουν εκκρεμή αιτήματα.',
      contacted: 'Δεν υπάρχουν αιτήματα στα οποία έχει γίνει επικοινωνία.',
      completed: 'Δεν υπάρχουν ολοκληρωμένα αιτήματα.',
    });
  });
});

