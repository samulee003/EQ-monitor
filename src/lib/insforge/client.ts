import { createClient } from '@insforge/sdk';

const API_BASE_URL = import.meta.env.VITE_INSFORGE_URL || '';

export const insforge = createClient({
  baseUrl: API_BASE_URL,
});

export type InsForgeClient = typeof insforge;
