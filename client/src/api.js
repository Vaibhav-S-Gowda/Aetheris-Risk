/**
 * api.js – Centralised API layer for the Aetheris Risk client.
 */
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE, timeout: 30000 });

export const fetchCountries = () =>
  api.get('/countries').then(r => r.data);

export const fetchCountryESG = (iso3) =>
  api.get(`/countries/${iso3}`).then(r => r.data);

export const evaluate = (payload) =>
  api.post('/evaluate', payload).then(r => r.data);

export const fetchHistory = (limit = 50) =>
  api.get('/history', { params: { limit } }).then(r => r.data);

export const deleteHistory = (id) =>
  api.delete(`/history/${id}`).then(r => r.data);

export const clearHistory = () =>
  api.delete('/history').then(r => r.data);
