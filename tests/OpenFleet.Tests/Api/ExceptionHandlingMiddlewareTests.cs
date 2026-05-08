using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using OpenFleet.Api.Middleware;
using OpenFleet.Domain.Exceptions;
using System.Text.Json;

namespace OpenFleet.Tests.Api;

/// <summary>
/// Unit tests for <see cref="ExceptionHandlingMiddleware"/>.
/// Each test constructs a minimal DefaultHttpContext and a fake next-delegate
/// that throws a specific exception, then asserts the correct HTTP status and
/// application/problem+json response body.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    private static ExceptionHandlingMiddleware BuildMiddleware(Exception? toThrow)
    {
        RequestDelegate next = toThrow is null
            ? _ => Task.CompletedTask
            : _ => Task.FromException(toThrow);

        return new ExceptionHandlingMiddleware(next, NullLogger<ExceptionHandlingMiddleware>.Instance);
    }

    private static async Task<(int StatusCode, JsonElement? Body)> InvokeAsync(
        ExceptionHandlingMiddleware middleware, string? correlationId = null)
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        if (correlationId is not null)
            context.Items[CorrelationIdMiddleware.ItemsKey] = correlationId;

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var json = await new StreamReader(context.Response.Body).ReadToEndAsync();

        if (string.IsNullOrWhiteSpace(json))
            return (context.Response.StatusCode, null);

        return (context.Response.StatusCode, JsonSerializer.Deserialize<JsonElement>(json));
    }

    // ── No exception → pipeline continues normally ────────────────────────────

    [Fact]
    public async Task No_exception_passes_through_with_200()
    {
        var middleware = BuildMiddleware(null);
        var (status, body) = await InvokeAsync(middleware);
        Assert.Equal(200, status);
        Assert.Null(body); // no body written when no exception occurs
    }

    // ── DomainException → 400 ────────────────────────────────────────────────

    [Fact]
    public async Task DomainException_returns_400()
    {
        var middleware = BuildMiddleware(new DomainException("Invalid status transition."));
        var (status, _) = await InvokeAsync(middleware);
        Assert.Equal(400, status);
    }

    [Fact]
    public async Task DomainException_response_has_problem_json_content_type()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var middleware = BuildMiddleware(new DomainException("Test domain error."));
        await middleware.InvokeAsync(context);

        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task DomainException_response_body_contains_detail()
    {
        var middleware = BuildMiddleware(new DomainException("Invalid status transition."));
        var (_, body) = await InvokeAsync(middleware);

        Assert.NotNull(body);
        Assert.Equal("Invalid status transition.", body!.Value.GetProperty("detail").GetString());
        Assert.Equal("Domain Error", body!.Value.GetProperty("title").GetString());
    }

    // ── KeyNotFoundException → 404 ────────────────────────────────────────────

    [Fact]
    public async Task KeyNotFoundException_returns_404()
    {
        var middleware = BuildMiddleware(new KeyNotFoundException("Vehicle not found."));
        var (status, _) = await InvokeAsync(middleware);
        Assert.Equal(404, status);
    }

    [Fact]
    public async Task KeyNotFoundException_response_body_has_not_found_title()
    {
        var middleware = BuildMiddleware(new KeyNotFoundException("Vehicle not found."));
        var (_, body) = await InvokeAsync(middleware);

        Assert.NotNull(body);
        Assert.Equal("Not Found", body!.Value.GetProperty("title").GetString());
    }

    // ── Unhandled exception → 500 ─────────────────────────────────────────────

    [Fact]
    public async Task Unhandled_exception_returns_500()
    {
        var middleware = BuildMiddleware(new InvalidOperationException("Something broke."));
        var (status, _) = await InvokeAsync(middleware);
        Assert.Equal(500, status);
    }

    [Fact]
    public async Task Unhandled_exception_detail_is_generic_message()
    {
        var middleware = BuildMiddleware(new InvalidOperationException("Internal detail."));
        var (_, body) = await InvokeAsync(middleware);

        Assert.NotNull(body);
        // The real exception message must not leak to the client
        var detail = body!.Value.GetProperty("detail").GetString();
        Assert.Equal("An unexpected error occurred.", detail);
    }

    // ── Correlation ID is included in extensions ──────────────────────────────

    [Fact]
    public async Task CorrelationId_is_included_in_problem_details_extensions()
    {
        var middleware = BuildMiddleware(new DomainException("Validation failed."));
        var (_, body) = await InvokeAsync(middleware, correlationId: "test-correlation-abc");

        Assert.NotNull(body);
        Assert.True(body!.Value.TryGetProperty("correlationId", out var cid));
        Assert.Equal("test-correlation-abc", cid.GetString());
    }

    [Fact]
    public async Task Missing_correlation_id_does_not_break_response()
    {
        // No correlationId in Items — middleware should still return valid JSON
        var middleware = BuildMiddleware(new DomainException("Error without correlation ID."));
        var (status, body) = await InvokeAsync(middleware, correlationId: null);

        Assert.Equal(400, status);
        Assert.NotNull(body);
        Assert.Equal("Domain Error", body!.Value.GetProperty("title").GetString());
    }
}
