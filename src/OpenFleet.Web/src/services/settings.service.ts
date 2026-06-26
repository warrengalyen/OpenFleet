import { api } from '@/lib/api'
import { normalizeWorkOrderPriority, serializeWorkOrderPriority } from '@/lib/enums'
import type { ApplicationSettingsResponse, UpdateApplicationSettingsRequest } from '@/types/settings'

function normalizeSettings(
  settings: ApplicationSettingsResponse,
): ApplicationSettingsResponse {
  return {
    ...settings,
    defaultWorkOrderPriority: normalizeWorkOrderPriority(settings.defaultWorkOrderPriority),
  }
}

function toApiRequest(request: UpdateApplicationSettingsRequest) {
  return {
    ...request,
    defaultWorkOrderPriority: serializeWorkOrderPriority(request.defaultWorkOrderPriority),
  }
}

export const settingsService = {
  async get(): Promise<ApplicationSettingsResponse> {
    const { data } = await api.get<ApplicationSettingsResponse>('/settings')
    return normalizeSettings(data)
  },

  async update(request: UpdateApplicationSettingsRequest): Promise<ApplicationSettingsResponse> {
    const { data } = await api.put<ApplicationSettingsResponse>('/settings', toApiRequest(request))
    return normalizeSettings(data)
  },
}
