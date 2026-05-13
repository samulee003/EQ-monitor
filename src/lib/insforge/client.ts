import { createClient } from '@insforge/sdk';

const API_BASE_URL = import.meta.env.VITE_INSFORGE_URL || '';
const ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY || '';

export const insforge = createClient({
  baseUrl: API_BASE_URL,
  anonKey: ANON_KEY,
});

export type InsForgeClient = typeof insforge;
