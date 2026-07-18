namespace OpenFleet.Application.Common;

public enum ErrorCode
{
    NotFound,
    Conflict,
    Validation,
    InvalidOperation,
    Forbidden
}

public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public ErrorCode? Code { get; }

    private Result(T value)
    {
        IsSuccess = true;
        Value = value;
    }

    private Result(string error, ErrorCode code)
    {
        IsSuccess = false;
        Error = error;
        Code = code;
    }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error, ErrorCode code = ErrorCode.Validation) => new(error, code);
    public static Result<T> NotFound(string error) => new(error, ErrorCode.NotFound);
    public static Result<T> Conflict(string error) => new(error, ErrorCode.Conflict);
    public static Result<T> Invalid(string error) => new(error, ErrorCode.InvalidOperation);
    public static Result<T> Forbidden(string error) => new(error, ErrorCode.Forbidden);
}

public class Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }
    public ErrorCode? Code { get; }

    private Result(bool isSuccess, string? error, ErrorCode? code = null)
    {
        IsSuccess = isSuccess;
        Error = error;
        Code = code;
    }

    public static Result Success() => new(true, null);
    public static Result Failure(string error, ErrorCode code = ErrorCode.Validation) => new(false, error, code);
    public static Result NotFound(string error) => new(false, error, ErrorCode.NotFound);
    public static Result Conflict(string error) => new(false, error, ErrorCode.Conflict);
    public static Result Invalid(string error) => new(false, error, ErrorCode.InvalidOperation);
    public static Result Forbidden(string error) => new(false, error, ErrorCode.Forbidden);
}
