using System.Net;
using System.Text.Json;
namespace DevTaskHub.Api.Middleware;

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
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;
        var (statusCode, message) = exception switch
        {
            KeyNotFoundException knf => (HttpStatusCode.NotFound, knf.Message),
            UnauthorizedAccessException uae => (HttpStatusCode.Forbidden, uae.Message),
            ArgumentException ae => (HttpStatusCode.BadRequest, ae.Message),
            BadHttpRequestException bre => (HttpStatusCode.BadRequest, bre.Message),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred. Please try again later.")
        };
        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception occurred. TraceId: {TraceId}", traceId);
        }
        else
        {
            _logger.LogWarning("Handled exception {ExceptionType}: {Message}. TraceId: {TraceId}",
                exception.GetType().Name, exception.Message, traceId);
        }
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;
        var response = new
        {
            error = message,
            traceId = traceId
        };
        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}