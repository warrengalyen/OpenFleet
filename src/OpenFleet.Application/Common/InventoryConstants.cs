namespace OpenFleet.Application.Common;

using OpenFleet.Domain.Entities;

public static class InventoryConstants
{
    /// <summary>Fallback default when settings are unavailable (matches seeded application settings).</summary>
    public const int LowStockThreshold = ApplicationSettingsDefaults.LowPartsStockThreshold;
}
