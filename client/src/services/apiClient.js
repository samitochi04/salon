import axios from 'axios';
import { env } from '../utils/env.js';

const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message) {
      const enriched = new Error(error.response.data.message);
      enriched.details = error.response.data;
      throw enriched;
    }
    throw error;
  },
);

export async function fetchServices() {
  const { data } = await api.get('/api/public/services');
  return data.data ?? [];
}

export async function fetchAvailability({ serviceSlug, from, to }) {
  const { data } = await api.get(
    `/api/public/services/${serviceSlug}/availability`,
    {
      params: { from, to },
    },
  );
  return data;
}

export async function createBooking(payload) {
  const { data } = await api.post('/api/public/bookings', payload);
  return data;
}

export async function subscribeNewsletter(payload) {
  const { data } = await api.post('/api/public/newsletter', payload);
  return data;
}

export async function fetchAdminBookings({ token, filters }) {
  const { data } = await api.get('/api/admin/bookings', {
    params: filters,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data ?? [];
}

export async function updateAdminBooking({ token, bookingId, updates }) {
  const { data } = await api.patch(`/api/admin/bookings/${bookingId}`, updates, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data;
}

export async function fetchOperatingSchedule({ token }) {
  const { data } = await api.get('/api/admin/schedule', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data;
}

export async function updateOperatingSchedule({ token, payload }) {
  const { data } = await api.put('/api/admin/schedule', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data;
}

export async function fetchClosedDays({ token, params }) {
  const { data } = await api.get('/api/admin/closures', {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data ?? [];
}

export async function createClosedDay({ token, payload }) {
  const { data } = await api.post('/api/admin/closures', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data;
}

export async function deleteClosedDay({ token, closureId }) {
  await api.delete(`/api/admin/closures/${closureId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createAdminService({ token, payload }) {
  const { data } = await api.post('/api/admin/services', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data;
}