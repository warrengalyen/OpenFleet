using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.Interfaces;

/// <summary>
/// Abstraction for a mock external system adapter. Each connector handles import and export
/// for one integration source.
/// </summary>
public interface IExternalIntegrationConnector
{
    IntegrationSource Source { get; }

    /// <summary>Pull data from the external system and apply side effects to the local database.</summary>
    Task<ConnectorResult> ImportAsync(CancellationToken cancellationToken = default);

    /// <summary>Push local data to the external system (returns serialized payload).</summary>
    Task<ConnectorResult> ExportAsync(CancellationToken cancellationToken = default);
}

/// <summary>Result returned by a connector after an import or export operation.</summary>
public record ConnectorResult(
    bool Success,
    string Payload,
    int RecordsProcessed,
    string? ErrorMessage
);
