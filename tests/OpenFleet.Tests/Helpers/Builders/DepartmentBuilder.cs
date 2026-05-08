using OpenFleet.Domain.Entities;

namespace OpenFleet.Tests.Helpers.Builders;

/// <summary>
/// Fluent builder for <see cref="Department"/> test instances.
/// Generates unique Code values by default so multiple calls don't collide.
/// </summary>
public class DepartmentBuilder
{
    private static int _counter;

    private Guid _id = Guid.NewGuid();
    private string _name;
    private string _code;

    public DepartmentBuilder()
    {
        var n = Interlocked.Increment(ref _counter);
        _name = $"Department {n}";
        _code = $"D{n:D3}";
    }

    public DepartmentBuilder WithId(Guid id) { _id = id; return this; }
    public DepartmentBuilder WithName(string name) { _name = name; return this; }
    public DepartmentBuilder WithCode(string code) { _code = code; return this; }

    public Department Build() => new()
    {
        Id = _id,
        Name = _name,
        Code = _code
    };
}
