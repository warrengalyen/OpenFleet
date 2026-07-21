import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import { tokenStorage } from '@/lib/api'

const apiOrigin = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function getNotificationsHubUrl(): string {
  return `${apiOrigin}/hubs/notifications`
}

export function createNotificationsConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(getNotificationsHubUrl(), {
      accessTokenFactory: () => tokenStorage.get() ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build()
}

export async function startNotificationsConnection(connection: HubConnection): Promise<void> {
  if (connection.state === HubConnectionState.Connected) return
  if (connection.state === HubConnectionState.Connecting) return
  await connection.start()
}

export async function stopNotificationsConnection(connection: HubConnection): Promise<void> {
  if (connection.state === HubConnectionState.Disconnected) return
  await connection.stop()
}
