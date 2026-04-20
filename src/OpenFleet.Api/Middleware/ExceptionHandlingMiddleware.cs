using Microsoft.AspNetCore.Mvc;
using OpenFleet.Domain.Exceptions;
using System.Net;
using System.Text.Json;

namespace OpenFleet.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainException ex)
        {
            _logger.LogWarning(ex, "Domain exception: {Message}", ex.Message);
            await WriteProblemDetails(context, HttpStatusCode.BadRequest, "Domain Error", ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found: {Message}", ex.Message);
            await WriteProblemDetails(context, HttpStatusCode.NotFound, "Not Found", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await WriteProblemDetails(context, HttpStatusCode.InternalServerError,
                "Internal Server Error", "An unexpected error occurred.");
        }
    }

    private static Task WriteProblemDetails(
        HttpContext context, HttpStatusCode statusCode, string title, string detail)
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };

        return context.Response.WriteAsync(
            JsonSerializer.Serialize(problem, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
    }
}
