using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Services;
using Xunit;

namespace OpenFleet.Tests.Domain;

public class MaintenanceDueCalculatorTests
{
    private static MaintenanceSchedule DateSchedule(int dayInterval, DateTime? lastPerformed = null) => new()
    {
        Name = "Test",
        DayInterval = dayInterval,
        LastPerformedAt = lastPerformed
    };

    private static MaintenanceSchedule MileageSchedule(int mileageInterval, int? lastMileage = null) => new()
    {
        Name = "Test",
        MileageInterval = mileageInterval,
        LastPerformedMileage = lastMileage
    };

    [Fact]
    public void IsDue_date_schedule_past_interval_returns_true()
    {
        var schedule = DateSchedule(30, DateTime.UtcNow.AddDays(-31));
        Assert.True(MaintenanceDueCalculator.IsDue(schedule, DateTime.UtcNow, null));
    }

    [Fact]
    public void IsDue_date_schedule_before_interval_returns_false()
    {
        var schedule = DateSchedule(30, DateTime.UtcNow.AddDays(-10));
        Assert.False(MaintenanceDueCalculator.IsDue(schedule, DateTime.UtcNow, null));
    }

    [Fact]
    public void IsDue_mileage_schedule_over_threshold_returns_true()
    {
        var schedule = MileageSchedule(5000, 10000);
        Assert.True(MaintenanceDueCalculator.IsDue(schedule, DateTime.UtcNow, 15001));
    }

    [Fact]
    public void IsDue_mileage_schedule_under_threshold_returns_false()
    {
        var schedule = MileageSchedule(5000, 10000);
        Assert.False(MaintenanceDueCalculator.IsDue(schedule, DateTime.UtcNow, 14000));
    }

    [Fact]
    public void IsDue_never_performed_date_schedule_returns_true()
    {
        var schedule = DateSchedule(90, lastPerformed: null);
        Assert.True(MaintenanceDueCalculator.IsDue(schedule, DateTime.UtcNow, null));
    }

    [Fact]
    public void IsDue_never_performed_mileage_schedule_returns_true()
    {
        var schedule = MileageSchedule(5000, lastMileage: null);
        Assert.True(MaintenanceDueCalculator.IsDue(schedule, DateTime.UtcNow, 1000));
    }

    [Fact]
    public void IsDue_dual_interval_due_by_date_only_returns_true()
    {
        var schedule = new MaintenanceSchedule
        {
            Name = "Dual",
            DayInterval = 30,
            MileageInterval = 5000,
            LastPerformedAt = DateTime.UtcNow.AddDays(-31),
            LastPerformedMileage = 10000
        };
        Assert.True(MaintenanceDueCalculator.IsDue(schedule, DateTime.UtcNow, 11000));
    }

    [Fact]
    public void IsDue_dual_interval_due_by_mileage_only_returns_true()
    {
        var schedule = new MaintenanceSchedule
        {
            Name = "Dual",
            DayInterval = 365,
            MileageInterval = 5000,
            LastPerformedAt = DateTime.UtcNow.AddDays(-10),
            LastPerformedMileage = 10000
        };
        Assert.True(MaintenanceDueCalculator.IsDue(schedule, DateTime.UtcNow, 15001));
    }

    [Fact]
    public void NextDueDate_returns_correct_date()
    {
        var lastPerformed = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var schedule = DateSchedule(30, lastPerformed);
        var expected = lastPerformed.AddDays(30);
        Assert.Equal(expected, MaintenanceDueCalculator.NextDueDate(schedule));
    }

    [Fact]
    public void NextDueDate_returns_null_when_no_interval()
    {
        var schedule = MileageSchedule(5000, 10000);
        Assert.Null(MaintenanceDueCalculator.NextDueDate(schedule));
    }

    [Fact]
    public void NextDueMileage_returns_correct_mileage()
    {
        var schedule = MileageSchedule(5000, 10000);
        Assert.Equal(15000, MaintenanceDueCalculator.NextDueMileage(schedule));
    }

    [Fact]
    public void NextDueMileage_returns_null_when_no_interval()
    {
        var schedule = DateSchedule(30, DateTime.UtcNow.AddDays(-10));
        Assert.Null(MaintenanceDueCalculator.NextDueMileage(schedule));
    }

    [Fact]
    public void DaysOverdue_returns_correct_span()
    {
        var lastPerformed = DateTime.UtcNow.AddDays(-35);
        var schedule = DateSchedule(30, lastPerformed);
        var overdue = MaintenanceDueCalculator.DaysOverdue(schedule, DateTime.UtcNow);
        Assert.NotNull(overdue);
        Assert.True(overdue!.Value.TotalDays >= 4);
    }

    [Fact]
    public void DaysOverdue_returns_null_when_not_overdue()
    {
        var schedule = DateSchedule(30, DateTime.UtcNow.AddDays(-10));
        Assert.Null(MaintenanceDueCalculator.DaysOverdue(schedule, DateTime.UtcNow));
    }

    [Fact]
    public void MilesOverdue_returns_correct_count()
    {
        var schedule = MileageSchedule(5000, 10000);
        Assert.Equal(1000, MaintenanceDueCalculator.MilesOverdue(schedule, 16000));
    }

    [Fact]
    public void MilesOverdue_returns_null_when_not_overdue()
    {
        var schedule = MileageSchedule(5000, 10000);
        Assert.Null(MaintenanceDueCalculator.MilesOverdue(schedule, 12000));
    }

    [Fact]
    public void IsDueOrWithinLeadDays_returns_true_before_due_date_within_lead_window()
    {
        var lastPerformed = DateTime.UtcNow.AddDays(-25);
        var schedule = DateSchedule(30, lastPerformed);
        Assert.False(MaintenanceDueCalculator.IsDue(schedule, DateTime.UtcNow, null));
        Assert.True(MaintenanceDueCalculator.IsDueOrWithinLeadDays(schedule, DateTime.UtcNow, 7, null));
    }
}
