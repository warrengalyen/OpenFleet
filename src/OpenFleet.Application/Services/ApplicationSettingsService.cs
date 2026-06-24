using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.Services;

public class ApplicationSettingsService : IApplicationSettingsProvider
{
    private readonly IOpenFleetDbContext _context;
    private readonly AuditService _auditService;

    public ApplicationSettingsService(IOpenFleetDbContext context, AuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<ApplicationSettingsResponse> GetAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateEntityAsync(cancellationToken);
        return ToResponse(settings);
    }

    public async Task<Result<ApplicationSettingsResponse>> UpdateAsync(
        UpdateApplicationSettingsRequest request,
        string? changedBy = null,
        CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateEntityAsync(cancellationToken);

        settings.OrganizationName = request.OrganizationName.Trim();
        settings.DefaultWorkOrderPriority = request.DefaultWorkOrderPriority;
        settings.DefaultWorkOrderDueDays = request.DefaultWorkOrderDueDays;
        settings.AutoCreateWorkOrderOnFailedInspection = request.AutoCreateWorkOrderOnFailedInspection;
        settings.MaintenanceReminderLeadDays = request.MaintenanceReminderLeadDays;
        settings.LowPartsStockThreshold = request.LowPartsStockThreshold;
        settings.IntegrationRetryLimit = request.IntegrationRetryLimit;
        settings.AuditLogRetentionDays = request.AuditLogRetentionDays;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.SettingsUpdated,
            "ApplicationSettings",
            settings.Id,
            changedBy,
            notes: "Application settings updated",
            cancellationToken: cancellationToken);

        return Result<ApplicationSettingsResponse>.Success(ToResponse(settings));
    }

    public async Task<ApplicationSettingsValues> GetValuesAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateEntityAsync(cancellationToken);
        return ToValues(settings);
    }

    public static async Task EnsureDefaultsAsync(IOpenFleetDbContext context, CancellationToken cancellationToken = default)
    {
        if (await context.ApplicationSettings.AnyAsync(cancellationToken))
            return;

        context.ApplicationSettings.Add(CreateDefaultEntity());
        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task<ApplicationSettings> GetOrCreateEntityAsync(CancellationToken cancellationToken)
    {
        var settings = await _context.ApplicationSettings
            .FirstOrDefaultAsync(s => s.Id == ApplicationSettingsDefaults.SingletonId, cancellationToken);

        if (settings is not null)
            return settings;

        settings = CreateDefaultEntity();
        _context.ApplicationSettings.Add(settings);
        await _context.SaveChangesAsync(cancellationToken);
        return settings;
    }

    private static ApplicationSettings CreateDefaultEntity() => new()
    {
        Id = ApplicationSettingsDefaults.SingletonId,
        OrganizationName = ApplicationSettingsDefaults.OrganizationName,
        DefaultWorkOrderPriority = ApplicationSettingsDefaults.DefaultWorkOrderPriority,
        DefaultWorkOrderDueDays = ApplicationSettingsDefaults.DefaultWorkOrderDueDays,
        AutoCreateWorkOrderOnFailedInspection = ApplicationSettingsDefaults.AutoCreateWorkOrderOnFailedInspection,
        MaintenanceReminderLeadDays = ApplicationSettingsDefaults.MaintenanceReminderLeadDays,
        LowPartsStockThreshold = ApplicationSettingsDefaults.LowPartsStockThreshold,
        IntegrationRetryLimit = ApplicationSettingsDefaults.IntegrationRetryLimit,
        AuditLogRetentionDays = ApplicationSettingsDefaults.AuditLogRetentionDays,
    };

    private static ApplicationSettingsResponse ToResponse(ApplicationSettings settings) => new(
        settings.OrganizationName,
        settings.DefaultWorkOrderPriority,
        settings.DefaultWorkOrderDueDays,
        settings.AutoCreateWorkOrderOnFailedInspection,
        settings.MaintenanceReminderLeadDays,
        settings.LowPartsStockThreshold,
        settings.IntegrationRetryLimit,
        settings.AuditLogRetentionDays,
        settings.UpdatedAt);

    private static ApplicationSettingsValues ToValues(ApplicationSettings settings) => new(
        settings.OrganizationName,
        settings.DefaultWorkOrderPriority,
        settings.DefaultWorkOrderDueDays,
        settings.AutoCreateWorkOrderOnFailedInspection,
        settings.MaintenanceReminderLeadDays,
        settings.LowPartsStockThreshold,
        settings.IntegrationRetryLimit,
        settings.AuditLogRetentionDays);
}
