using OpenFleet.Domain.Entities;

namespace OpenFleet.Domain.Services;

public static class MaintenanceDueCalculator
{
    /// <summary>
    /// Returns true when a schedule is due now or will be due within the configured lead window.
    /// </summary>
    public static bool IsDueOrWithinLeadDays(
        MaintenanceSchedule schedule,
        DateTime now,
        int leadDays,
        int? currentMileage)
    {
        if (IsDue(schedule, now, currentMileage))
            return true;

        if (leadDays <= 0 || !schedule.DayInterval.HasValue)
            return false;

        var nextDue = NextDueDate(schedule);
        return nextDue.HasValue && now >= nextDue.Value.AddDays(-leadDays);
    }

    /// <summary>
    /// Returns true if the schedule is due based on date interval, mileage interval, or both.
    /// A schedule that has never been performed is always considered due.
    /// </summary>
    public static bool IsDue(MaintenanceSchedule schedule, DateTime now, int? currentMileage)
    {
        var dueDateMet = false;
        var dueMileageMet = false;

        if (schedule.DayInterval.HasValue)
        {
            var nextDue = NextDueDate(schedule);
            dueDateMet = nextDue.HasValue && now >= nextDue.Value;
        }

        if (schedule.MileageInterval.HasValue && currentMileage.HasValue)
        {
            var nextMileage = NextDueMileage(schedule);
            dueMileageMet = nextMileage.HasValue && currentMileage.Value >= nextMileage.Value;
        }

        // Never performed with any interval → immediately due
        if (schedule.LastPerformedAt is null && schedule.DayInterval.HasValue)
            return true;
        if (schedule.LastPerformedMileage is null && schedule.MileageInterval.HasValue)
            return true;

        return dueDateMet || dueMileageMet;
    }

    /// <summary>Returns the next due date based on the day interval, or null if no day interval is set.</summary>
    public static DateTime? NextDueDate(MaintenanceSchedule schedule)
    {
        if (!schedule.DayInterval.HasValue) return null;
        var baseline = schedule.LastPerformedAt ?? DateTime.MinValue;
        return baseline.AddDays(schedule.DayInterval.Value);
    }

    /// <summary>Returns the next due mileage based on the mileage interval, or null if not configured.</summary>
    public static int? NextDueMileage(MaintenanceSchedule schedule)
    {
        if (!schedule.MileageInterval.HasValue) return null;
        var baseline = schedule.LastPerformedMileage ?? 0;
        return baseline + schedule.MileageInterval.Value;
    }

    /// <summary>Returns how long overdue this schedule is by date, or null if not overdue.</summary>
    public static TimeSpan? DaysOverdue(MaintenanceSchedule schedule, DateTime now)
    {
        var nextDue = NextDueDate(schedule);
        if (nextDue is null || now < nextDue.Value) return null;
        return now - nextDue.Value;
    }

    /// <summary>Returns how many miles overdue this schedule is, or null if not overdue by mileage.</summary>
    public static int? MilesOverdue(MaintenanceSchedule schedule, int? currentMileage)
    {
        var nextMileage = NextDueMileage(schedule);
        if (nextMileage is null || currentMileage is null || currentMileage.Value < nextMileage.Value)
            return null;
        return currentMileage.Value - nextMileage.Value;
    }
}
