# Health Check Endpoint

## Purpose
Provide a simple endpoint to verify API availability and health status.

## Endpoint Specification

### GET /health

**Description**: Returns the current health status of the API.

**Request**: No parameters required

**Response**:
- **Status Code**: 200 OK
- **Content-Type**: application/json

**Response Body**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T05:00:00.000Z"
}
```

**Fields**:
- `status` (string): Health status indicator. Value is "ok" when healthy.
- `timestamp` (string): ISO 8601 formatted timestamp of when the health check was performed.

## Use Cases
1. Load balancer health checks
2. Monitoring system pings
3. Deployment verification
4. API availability testing

## Implementation Status
✅ Implemented
✅ Tested (4/4 tests passing)
