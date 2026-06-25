import { useQuery } from '@tanstack/react-query'
import { settingsService } from '@/services/settings.service'

export const settingsKeys = {
  all: ['settings'] as const,
  current: () => [...settingsKeys.all, 'current'] as const,
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.current(),
    queryFn: settingsService.get,
    staleTime: 5 * 60 * 1000,
  })
}
