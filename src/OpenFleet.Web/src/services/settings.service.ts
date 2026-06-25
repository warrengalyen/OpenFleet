import { api } from '@/lib/api'
import type { ApplicationSettingsResponse, UpdateApplicationSettingsRequest } from '@/types/settings'

export const settingsService = {
  async get(): Promise<ApplicationSettingsResponse> {
    const { data } = await api.get<ApplicationSettingsResponse>('/settings')
    return data
  },

  async update(request: UpdateApplicationSettingsRequest): Promise<ApplicationSettingsResponse> {
    const { data } = await api.put<ApplicationSettingsResponse>('/settings', request)
    return data
  },
}
