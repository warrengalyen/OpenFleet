using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Domain.Services;

namespace OpenFleet.Application.Services;

public class InspectionService
{
    private readonly IOpenFleetDbContext _context;
    private readonly WorkOrderService _workOrderService;

    public InspectionService(IOpenFleetDbContext context, WorkOrderService workOrderService)
    {
        _context = context;
        _workOrderService = workOrderService;
    }

    public async Task<Result<InspectionResponse>> CreateAsync(
        CreateInspectionRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.VehicleId.HasValue)
        {
            var exists = await _context.Vehicles.AnyAsync(v => v.Id == request.VehicleId.Value, cancellationToken);
            if (!exists) return Result<InspectionResponse>.NotFound("Vehicle not found.");
        }

        if (request.AssetId.HasValue)
        {
            var exists = await _context.Assets.AnyAsync(a => a.Id == request.AssetId.Value, cancellationToken);
            if (!exists) return Result<InspectionResponse>.NotFound("Asset not found.");
        }

        var inspectorExists = await _context.Users.AnyAsync(u => u.Id == request.InspectorUserId, cancellationToken);
        if (!inspectorExists) return Result<InspectionResponse>.NotFound("Inspector user not found.");

        var inspection = new Inspection
        {
            VehicleId = request.VehicleId,
            AssetId = request.AssetId,
            InspectorUserId = request.InspectorUserId,
            InspectedAt = request.InspectedAt,
            Status = request.Status,
            Notes = request.Notes ?? string.Empty
        };

        _context.Inspections.Add(inspection);
        await _context.SaveChangesAsync(cancellationToken);

        if (InspectionWorkOrderPolicy.ShouldCreateWorkOrder(request.Status))
        {
            var workOrderTitle = await BuildWorkOrderTitleAsync(inspection, cancellationToken);
            var woResult = await _workOrderService.CreateAsync(new CreateWorkOrderRequest(
                Title: workOrderTitle,
                Description: $"Auto-generated from failed inspection on {request.InspectedAt:yyyy-MM-dd}. Notes: {inspection.Notes}",
                Priority: InspectionWorkOrderPolicy.RecommendedPriority(),
                VehicleId: request.VehicleId,
                AssetId: request.AssetId,
                AssignedUserId: null
            ), cancellationToken);

            if (woResult.IsSuccess)
            {
                inspection.GeneratedWorkOrderId = woResult.Value!.Id;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return Result<InspectionResponse>.Success(
            (await LoadResponseAsync(inspection.Id, cancellationToken))!);
    }

    public async Task<Result<InspectionResponse>> UpdateAsync(
        Guid id,
        UpdateInspectionRequest request,
        CancellationToken cancellationToken = default)
    {
        var inspection = await _context.Inspections
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (inspection is null)
            return Result<InspectionResponse>.NotFound($"Inspection {id} not found.");

        var previousStatus = inspection.Status;

        if (request.Status.HasValue) inspection.Status = request.Status.Value;
        if (request.Notes is not null) inspection.Notes = request.Notes;

        await _context.SaveChangesAsync(cancellationToken);

        // Auto-create work order if transitioning to Failed and one doesn't already exist
        if (request.Status == InspectionStatus.Failed
            && previousStatus != InspectionStatus.Failed
            && inspection.GeneratedWorkOrderId is null
            && InspectionWorkOrderPolicy.ShouldCreateWorkOrder(InspectionStatus.Failed))
        {
            var workOrderTitle = await BuildWorkOrderTitleAsync(inspection, cancellationToken);
            var woResult = await _workOrderService.CreateAsync(new CreateWorkOrderRequest(
                Title: workOrderTitle,
                Description: $"Auto-generated from failed inspection update on {DateTime.UtcNow:yyyy-MM-dd}. Notes: {inspection.Notes}",
                Priority: InspectionWorkOrderPolicy.RecommendedPriority(),
                VehicleId: inspection.VehicleId,
                AssetId: inspection.AssetId,
                AssignedUserId: null
            ), cancellationToken);

            if (woResult.IsSuccess)
            {
                inspection.GeneratedWorkOrderId = woResult.Value!.Id;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return Result<InspectionResponse>.Success(
            (await LoadResponseAsync(id, cancellationToken))!);
    }

    public async Task<InspectionResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await LoadResponseAsync(id, cancellationToken);

    public async Task<IReadOnlyList<InspectionResponse>> GetAllAsync(
        Guid? vehicleId,
        Guid? assetId,
        InspectionStatus? status,
        Guid? inspectorUserId,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Inspections
            .Include(i => i.Vehicle)
            .Include(i => i.Asset)
            .Include(i => i.InspectorUser)
            .AsNoTracking()
            .AsQueryable();

        if (vehicleId.HasValue) query = query.Where(i => i.VehicleId == vehicleId.Value);
        if (assetId.HasValue) query = query.Where(i => i.AssetId == assetId.Value);
        if (status.HasValue) query = query.Where(i => i.Status == status.Value);
        if (inspectorUserId.HasValue) query = query.Where(i => i.InspectorUserId == inspectorUserId.Value);

        return await query
            .OrderByDescending(i => i.InspectedAt)
            .Select(i => ToResponse(i))
            .ToListAsync(cancellationToken);
    }

    private async Task<string> BuildWorkOrderTitleAsync(Inspection inspection, CancellationToken ct)
    {
        string description = "Unknown";
        if (inspection.VehicleId.HasValue)
        {
            var vehicle = await _context.Vehicles
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == inspection.VehicleId.Value, ct);
            if (vehicle is not null)
                description = $"{vehicle.Year} {vehicle.Make} {vehicle.Model}";
        }
        else if (inspection.AssetId.HasValue)
        {
            var asset = await _context.Assets
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == inspection.AssetId.Value, ct);
            if (asset is not null)
                description = asset.Name;
        }
        return InspectionWorkOrderPolicy.GenerateWorkOrderTitle(description);
    }

    private async Task<InspectionResponse?> LoadResponseAsync(Guid id, CancellationToken ct)
    {
        var i = await _context.Inspections
            .Include(x => x.Vehicle)
            .Include(x => x.Asset)
            .Include(x => x.InspectorUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        return i is null ? null : ToResponse(i);
    }

    public static InspectionResponse ToResponse(Inspection i) => new(
        i.Id,
        i.VehicleId,
        i.Vehicle is null ? null : $"{i.Vehicle.Year} {i.Vehicle.Make} {i.Vehicle.Model}",
        i.AssetId,
        i.Asset?.Name,
        i.InspectorUserId,
        i.InspectorUser is null ? string.Empty : $"{i.InspectorUser.FirstName} {i.InspectorUser.LastName}",
        i.InspectedAt,
        i.Status,
        i.Notes,
        i.GeneratedWorkOrderId,
        i.CreatedAt,
        i.UpdatedAt
    );
}
