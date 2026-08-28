import { useQuery } from '@tanstack/react-query';
import { initialize } from '@microsoft/power-apps/app';
import { Office365UsersService } from '@/generated/services/Office365UsersService';

const wait = (milliseconds: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, milliseconds);
});

export function usePeopleSearch(searchTerm: string) {
  const normalizedTerm = searchTerm.trim();

  return useQuery({
    queryKey: ['office365users', 'search', normalizedTerm],
    queryFn: async () => {
      await wait(500);
      let lastError = 'Directory search failed.';

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await initialize();
          const result = await Office365UsersService.SearchUser(normalizedTerm, 8);
          if (result.success) {
            return result.data ?? [];
          }
          lastError = result.error?.message ?? lastError;
        } catch (error: unknown) {
          lastError = error instanceof Error ? error.message : lastError;
        }

        if (attempt < 2) {
          await wait(500 * 2 ** attempt);
        }
      }

      throw new Error(lastError);
    },
    enabled: normalizedTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
