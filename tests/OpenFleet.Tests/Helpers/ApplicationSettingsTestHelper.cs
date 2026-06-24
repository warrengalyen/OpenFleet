using OpenFleet.Application.Services;
using OpenFleet.Infrastructure.Persistence;

namespace OpenFleet.Tests.Helpers;

public static class ApplicationSettingsTestHelper
{
    public static async Task<ApplicationSettingsService> CreateProviderAsync(OpenFleetDbContext context)
    {
        var auditService = new AuditService(context);
        await ApplicationSettingsService.EnsureDefaultsAsync(context);
        return new ApplicationSettingsService(context, auditService);
    }
}
