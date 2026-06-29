# External Integration Flow

OpenFleet includes a mock external integration system to demonstrate how an enterprise fleet API would connect to third-party services. This is intentionally implemented with mock data to keep the project self-contained.

---

## Overview

```
IntegrationSyncService (every 5 minutes)
    │
    ├── FuelUsageConnector         → imports fuel usage records
    ├── VendorRepairConnector      → imports vendor repair status updates
    ├── PartsSupplierConnector     → imports parts inventory levels
    └── ExternalAssetConnector     → imports assets from an external CMMS
         │
         ▼
    IOpenFleetDbContext            → updates are applied to the database
         │
         ▼
    IntegrationLog                 → every sync attempt is logged
         │
         ▼
    AuditLog (on permanent failure) → audit trail entry written
```

---

## Connectors

Each connector implements `IExternalIntegrationConnector`:

```csharp
public interface IExternalIntegrationConnector
{
    string Source { get; }
    Task<IntegrationResult> SyncAsync(CancellationToken cancellationToken);
}
```

| Connector | Source Name | What It Simulates |
|-----------|------------|-------------------|
| `FuelUsageConnector` | `FuelUsage` | Imports daily fuel consumption per vehicle, updates mileage |
| `VendorRepairConnector` | `VendorRepair` | Imports repair status updates from external vendor system |
| `PartsSupplierConnector` | `PartsSupplier` | Syncs current inventory levels from parts supplier |
| `ExternalAssetConnector` | `ExternalAsset` | Imports assets from an external CMMS / asset management system |

In production, each connector would replace mock data with real HTTP client calls to the respective vendor APIs.

---

## Integration Log Lifecycle

Every sync attempt creates or updates an `IntegrationLog` record:

```
Pending → Success          (on first-attempt success)
Pending → Failed           (on error, retried up to 3 times)
Failed  → Failed           (all retries exhausted → permanent failure)
```

On permanent failure (all retries exhausted), `AuditService.LogAsync(AuditAction.IntegrationSyncFailed)` is called to create an audit trail entry.

---

## Retry Strategy

Retries use **exponential backoff** with up to 3 attempts:

| Attempt | Delay before retry |
|---------|-------------------|
| 1st failure | 30 seconds |
| 2nd failure | 120 seconds |
| 3rd failure | permanent failure |

`NextRetryAt` is set on the `IntegrationLog` and the `IntegrationSyncService` skips logs where `NextRetryAt > now`.

---

## API Endpoints

### View integration history

```http
GET /api/integrations
Authorization: Bearer {token}
```

Optional query parameters: `source`, `status`, `from`, `to`

**Response:**
```json
[
  {
    "id": "...",
    "source": "FuelUsage",
    "direction": "Import",
    "status": "Success",
    "recordsProcessed": 12,
    "lastAttemptAt": "2026-07-07T17:05:17Z",
    "attemptCount": 1,
    "errorMessage": null
  }
]
```

### Trigger a manual sync

```http
POST /api/integrations/{source}/sync
Authorization: Bearer {token}   (FleetManager or above)
```

Where `{source}` is one of: `FuelUsage`, `VendorRepair`, `PartsSupplier`, `ExternalAsset`.

### Export integration data as JSON

```http
GET /api/integrations/{id}/export
Authorization: Bearer {token}
```

Returns the raw `Payload` JSON that was captured during the sync.

---

## Extending with a Real Connector

To replace a mock connector with a real HTTP integration:

1. Implement `IExternalIntegrationConnector` in `OpenFleet.Infrastructure.Integrations`
2. Inject `HttpClient` via `IHttpClientFactory`
3. Register in `Program.cs`:
   ```csharp
   builder.Services.AddScoped<IExternalIntegrationConnector, MyRealConnector>();
   ```
4. The `IntegrationSyncService` will automatically pick it up on the next cycle

No changes to `IntegrationSyncService` or `IntegrationLogService` are needed - they work against the interface.
