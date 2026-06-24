using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Domain.Services;

namespace OpenFleet.Application.Services;

public class WorkOrderService
{
    private readonly IOpenFleetDbContext _context;
    private readonly AuditService _auditService;
    private readonly IApplicationSettingsProvider _settingsProvider;

    public WorkOrderService(
        IOpenFleetDbContext context,
        AuditService auditService,
        IApplicationSettingsProvider settingsProvider)
    {
        _context = context;
        _auditService = auditService;
        _settingsProvider = settingsProvider;
    }

    public async Task<Result<WorkOrderResponse>> CreateAsync(
        CreateWorkOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.VehicleId.HasValue)
        {
            var vehicleExists = await _context.Vehicles
                .AnyAsync(v => v.Id == request.VehicleId.Value, cancellationToken);
            if (!vehicleExists)
                return Result<WorkOrderResponse>.NotFound("Vehicle not found.");
        }

        if (request.AssetId.HasValue)
        {
            var assetExists = await _context.Assets
                .AnyAsync(a => a.Id == request.AssetId.Value, cancellationToken);
            if (!assetExists)
                return Result<WorkOrderResponse>.NotFound("Asset not found.");
        }

        if (request.AssignedUserId.HasValue)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.Id == request.AssignedUserId.Value, cancellationToken);
            if (!userExists)
                return Result<WorkOrderResponse>.NotFound("Assigned user not found.");
        }

        var settings = await _settingsProvider.GetValuesAsync(cancellationToken);
        var priority = request.Priority ?? settings.DefaultWorkOrderPriority;
        var dueDate = DateTime.UtcNow.AddDays(settings.DefaultWorkOrderDueDays);

        var workOrder = new WorkOrder
        {
            Title = request.Title,
            Description = request.Description ?? string.Empty,
            Priority = priority,
            DueDate = dueDate,
            VehicleId = request.VehicleId,
            AssetId = request.AssetId,
            AssignedUserId = request.AssignedUserId
        };

        _context.WorkOrders.Add(workOrder);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<WorkOrderResponse>.Success(await LoadResponseAsync(workOrder.Id, cancellationToken)
            ?? throw new InvalidOperationException("Work order not found after create."));
    }

    public async Task<Result<WorkOrderResponse>> UpdateAsync(
        Guid id,
        UpdateWorkOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        var workOrder = await _context.WorkOrders
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);

        if (workOrder is null)
            return Result<WorkOrderResponse>.NotFound($"Work order {id} not found.");

        if (workOrder.Status is WorkOrderStatus.Completed or WorkOrderStatus.Cancelled)
            return Result<WorkOrderResponse>.Invalid(
                $"Cannot update a work order in {workOrder.Status} status.");

        if (request.VehicleId.HasValue && request.VehicleId != Guid.Empty)
        {
            var exists = await _context.Vehicles.AnyAsync(v => v.Id == request.VehicleId.Value, cancellationToken);
            if (!exists) return Result<WorkOrderResponse>.NotFound("Vehicle not found.");
        }

        if (request.AssetId.HasValue && request.AssetId != Guid.Empty)
        {
            var exists = await _context.Assets.AnyAsync(a => a.Id == request.AssetId.Value, cancellationToken);
            if (!exists) return Result<WorkOrderResponse>.NotFound("Asset not found.");
        }

        if (request.AssignedUserId.HasValue && request.AssignedUserId != Guid.Empty)
        {
            var exists = await _context.Users.AnyAsync(u => u.Id == request.AssignedUserId.Value, cancellationToken);
            if (!exists) return Result<WorkOrderResponse>.NotFound("Assigned user not found.");
        }

        if (request.Title is not null) workOrder.Title = request.Title;
        if (request.Description is not null) workOrder.Description = request.Description;
        if (request.Priority.HasValue) workOrder.Priority = request.Priority.Value;
        if (request.VehicleId is not null) workOrder.VehicleId = request.VehicleId;
        if (request.AssetId is not null) workOrder.AssetId = request.AssetId;
        if (request.AssignedUserId is not null) workOrder.AssignedUserId = request.AssignedUserId;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<WorkOrderResponse>.Success(
            (await LoadResponseAsync(id, cancellationToken))!);
    }

    public async Task<Result<WorkOrderResponse>> TransitionStatusAsync(
        Guid id,
        WorkOrderStatus newStatus,
        string? changedBy = null,
        CancellationToken cancellationToken = default)
    {
        var workOrder = await _context.WorkOrders
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);

        if (workOrder is null)
            return Result<WorkOrderResponse>.NotFound($"Work order {id} not found.");

        if (!WorkOrderStatusRules.CanTransition(workOrder.Status, newStatus))
            return Result<WorkOrderResponse>.Conflict(
                $"Cannot transition from {workOrder.Status} to {newStatus}. " +
                $"Allowed: [{string.Join(", ", WorkOrderStatusRules.AllowedTransitions(workOrder.Status))}]");

        var oldStatus = workOrder.Status;
        workOrder.Status = newStatus;

        if (newStatus == WorkOrderStatus.Completed)
            workOrder.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.WorkOrderStatusChanged,
            "WorkOrder",
            workOrder.Id,
            changedBy,
            oldValue: oldStatus.ToString(),
            newValue: newStatus.ToString(),
            cancellationToken: cancellationToken);

        return Result<WorkOrderResponse>.Success(
            (await LoadResponseAsync(id, cancellationToken))!);
    }

    public async Task<Result<WorkOrderNoteResponse>> AddNoteAsync(
        Guid workOrderId,
        AddNoteRequest request,
        CancellationToken cancellationToken = default)
    {
        var exists = await _context.WorkOrders
            .AnyAsync(w => w.Id == workOrderId, cancellationToken);

        if (!exists)
            return Result<WorkOrderNoteResponse>.NotFound($"Work order {workOrderId} not found.");

        var note = new WorkOrderNote
        {
            WorkOrderId = workOrderId,
            Content = request.Content,
            AuthorName = request.AuthorName
        };

        _context.WorkOrderNotes.Add(note);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<WorkOrderNoteResponse>.Success(new WorkOrderNoteResponse(
            note.Id,
            note.WorkOrderId,
            note.Content,
            note.AuthorName,
            note.CreatedAt));
    }

    public async Task<Result<WorkOrderResponse>> RecordLaborAsync(
        Guid id,
        RecordLaborRequest request,
        CancellationToken cancellationToken = default)
    {
        var workOrder = await _context.WorkOrders
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);

        if (workOrder is null)
            return Result<WorkOrderResponse>.NotFound($"Work order {id} not found.");

        if (workOrder.Status == WorkOrderStatus.Cancelled)
            return Result<WorkOrderResponse>.Invalid("Cannot record labor on a cancelled work order.");

        workOrder.LaborHours += request.Hours;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<WorkOrderResponse>.Success(
            (await LoadResponseAsync(id, cancellationToken))!);
    }

    public async Task<Result<MaintenanceRecordResponse>> LinkMaintenanceRecordAsync(
        Guid workOrderId,
        CreateMaintenanceRecordRequest request,
        CancellationToken cancellationToken = default)
    {
        var workOrder = await _context.WorkOrders
            .Include(w => w.MaintenanceRecord)
            .FirstOrDefaultAsync(w => w.Id == workOrderId, cancellationToken);

        if (workOrder is null)
            return Result<MaintenanceRecordResponse>.NotFound($"Work order {workOrderId} not found.");

        if (workOrder.Status != WorkOrderStatus.Completed)
            return Result<MaintenanceRecordResponse>.Invalid(
                "A maintenance record can only be linked to a Completed work order.");

        if (workOrder.MaintenanceRecord is not null)
            return Result<MaintenanceRecordResponse>.Conflict(
                "A maintenance record is already linked to this work order.");

        var record = new MaintenanceRecord
        {
            WorkOrderId = workOrderId,
            PerformedAt = request.PerformedAt,
            OdometerReading = request.OdometerReading,
            Notes = request.Notes
        };

        _context.MaintenanceRecords.Add(record);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<MaintenanceRecordResponse>.Success(new MaintenanceRecordResponse(
            record.Id,
            record.WorkOrderId,
            record.PerformedAt,
            record.OdometerReading,
            record.Notes,
            record.CreatedAt));
    }

    public async Task<Result> CancelAsync(Guid id, string? changedBy = null, CancellationToken cancellationToken = default)
    {
        var result = await TransitionStatusAsync(id, WorkOrderStatus.Cancelled, changedBy, cancellationToken);
        if (!result.IsSuccess)
            return Result.Failure(result.Error!, result.Code ?? ErrorCode.Validation);

        return Result.Success();
    }

    private async Task<WorkOrderResponse?> LoadResponseAsync(Guid id, CancellationToken cancellationToken)
    {
        var w = await _context.WorkOrders
            .Include(x => x.Vehicle)
            .Include(x => x.Asset)
            .Include(x => x.AssignedUser)
            .Include(x => x.MaintenanceRecord)
            .Include(x => x.Notes)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (w is null) return null;

        return ToResponse(w);
    }

    public static WorkOrderResponse ToResponse(WorkOrder w) => new(
        w.Id,
        w.Title,
        w.Description,
        w.Status,
        w.Priority,
        w.VehicleId,
        w.Vehicle is null ? null : $"{w.Vehicle.Year} {w.Vehicle.Make} {w.Vehicle.Model}",
        w.AssetId,
        w.Asset?.Name,
        w.AssignedUserId,
        w.AssignedUser is null ? null : $"{w.AssignedUser.FirstName} {w.AssignedUser.LastName}",
        w.LaborHours,
        w.DueDate,
        w.CompletedAt,
        w.Notes.Count,
        WorkOrderStatusRules.AllowedTransitions(w.Status),
        w.MaintenanceRecord is not null,
        w.CreatedAt,
        w.UpdatedAt
    );
}
