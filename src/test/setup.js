import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase for testing
vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));