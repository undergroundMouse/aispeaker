# Backend API Contract

## Device API

### `POST /api/v1/cloud/visual-answer`

- Auth: `Authorization: Bearer <DEVICE_API_TOKEN>`
- Request: `CloudVisualAnswerRequest` from `@ai/shared`
- Success response: `CloudVisualAnswerSuccessResponse`
- Failure response: `CloudVisualAnswerFailureResponse`

## Admin API

All admin routes require `Authorization: Bearer <ADMIN_API_TOKEN>`.

- `GET /api/v1/admin/conversations` → `ConversationTelemetryRecord[]`
- `GET /api/v1/admin/conversations/:conversationId` → `ConversationTelemetryRecord`
- `GET /api/v1/admin/budget` → `OperationsBudgetConfig`
- `PUT /api/v1/admin/budget` → `OperationsBudgetConfig`
- `GET /api/v1/admin/daily-spend` → `{ amount: number }`

## Health

- `GET /health` → `{ status: "ok" }`
