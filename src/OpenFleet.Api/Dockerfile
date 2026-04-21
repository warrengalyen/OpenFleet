# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

COPY OpenFleet.sln .
COPY src/OpenFleet.Domain/OpenFleet.Domain.csproj src/OpenFleet.Domain/
COPY src/OpenFleet.Application/OpenFleet.Application.csproj src/OpenFleet.Application/
COPY src/OpenFleet.Infrastructure/OpenFleet.Infrastructure.csproj src/OpenFleet.Infrastructure/
COPY src/OpenFleet.Api/OpenFleet.Api.csproj src/OpenFleet.Api/
COPY tests/OpenFleet.Tests/OpenFleet.Tests.csproj tests/OpenFleet.Tests/

RUN dotnet restore

COPY . .

RUN dotnet publish src/OpenFleet.Api/OpenFleet.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "OpenFleet.Api.dll"]
