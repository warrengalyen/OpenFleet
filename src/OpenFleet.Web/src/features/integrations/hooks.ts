import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { integrationsService } from '@/services/integrations.service'
import type { IntegrationHistoryFilter, IntegrationSource } from '@/types'

export const integrationKeys = {
  all: ['integrations'] as const,
  lists: () => [...integrationKeys.all, 'list'] as const,
  list: (filter: IntegrationHistoryFilter) => [...integrationKeys.lists(), filter] as const,
  details: () => [...integrationKeys.all, 'detail'] as const,
  detail: (id: string) => [...integrationKeys.details(), id] as const,
  summary: () => [...integrationKeys.all, 'summary'] as const,
}

export function useIntegrationHistory(filter: IntegrationHistoryFilter = {}) {
  return useQuery({
    queryKey: integrationKeys.list(filter),
    queryFn: () => integrationsService.getHistory(filter),
  })
}

export function useIntegrationSummary() {
  return useQuery({
    queryKey: integrationKeys.summary(),
    queryFn: () => integrationsService.getHistory({ page: 1, pageSize: 100 }),
    staleTime: 30_000,
  })
}

export function useIntegration(id: string) {
  return useQuery({
    queryKey: integrationKeys.detail(id),
    queryFn: () => integrationsService.getById(id),
    enabled: !!id,
  })
}

export function useTriggerSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (source: IntegrationSource) => integrationsService.triggerSync(source),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: integrationKeys.all })
    },
  })
}

export function useRetryIntegration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => integrationsService.retry(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: integrationKeys.all })
      void queryClient.invalidateQueries({ queryKey: integrationKeys.detail(id) })
    },
  })
}

export function useExportIntegration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (source: IntegrationSource) => integrationsService.export(source),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: integrationKeys.all })
    },
  })
}
