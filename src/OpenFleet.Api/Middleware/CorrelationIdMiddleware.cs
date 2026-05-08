using Serilog.Context;

namespace OpenFleet.Api.Middleware;

/// <summary>
/// Reads the X-Correlation-ID request header (or generates a new GUID if absent),
/// stores it in HttpContext.Items for downstream use, enriches the Serilog log context
/// so every log line within the request carries the CorrelationId property, and echoes
/// the value back in the X-Correlation-ID response header.
/// </summary>
public class CorrelationIdMiddleware
{
    public const string HeaderName = "X-Correlation-ID";
    public const string ItemsKey = "CorrelationId";

    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(HeaderName, out var headerValue)
            && !string.IsNullOrWhiteSpace(headerValue)
            ? headerValue.ToString()
            : Guid.NewGuid().ToString();

        context.Items[ItemsKey] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }
}
