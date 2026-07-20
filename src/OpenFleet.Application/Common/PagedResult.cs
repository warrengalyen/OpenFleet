namespace OpenFleet.Application.Common;

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int PageCount)
{
    public static PagedResult<T> Create(
        IReadOnlyList<T> items,
        int totalCount,
        int page,
        int pageSize)
    {
        var pageCount = pageSize <= 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)pageSize);
        return new(items, totalCount, page, pageSize, pageCount);
    }
}
