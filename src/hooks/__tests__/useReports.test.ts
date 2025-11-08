import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateReport } from '../useReports';
import { createElement } from 'react';

// Mock Supabase
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
    auth: {
      getUser: mockGetUser,
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useCreateReport', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { id: 'report-123' },
      error: null,
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
  });

  it('creates a report successfully', async () => {
    const { result } = renderHook(() => useCreateReport(), {
      wrapper: ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children),
    });

    result.current.mutate({
      profileId: 'profile-123',
      reason: 'spam',
      message: 'This is spam',
    });

    // Wait for mutation to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(result.current.isSuccess).toBe(true);

    expect(mockInsert).toHaveBeenCalledWith({
      profile_id: 'profile-123',
      reporter_user_id: 'user-123',
      reason: 'spam',
      message: 'This is spam',
      status: 'open',
    });
  });

  it('handles error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useCreateReport(), {
      wrapper: ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children),
    });

    result.current.mutate({
      profileId: 'profile-123',
      reason: 'spam',
      message: 'This is spam',
    });

    // Wait for mutation to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(result.current.isError).toBe(true);
  });
});
