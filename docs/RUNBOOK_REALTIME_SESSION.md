# Realtime Session Runbook

## Alerts

- **Budget exceeded**: Daily spend hits cap → cloud requests blocked; check Operator dashboard budget settings.
- **Latency p99 > 5s**: Inspect ASR/VLM provider latency metrics; consider enabling degraded tier.
- **ASR error rate > 10%**: Circuit breaker may open; verify `QWEN_API_KEY` and Paraformer connectivity.
- **Session churn high**: Check WebSocket proxy timeouts; ensure heartbeat interval (15s) is honored.

## Circuit Breaker

- Opens after 5 consecutive ASR failures
- Auto-recovers after 30 seconds
- View state: `GET /api/v1/admin/session-health`

## Feature Flags

| Flag | Effect |
|------|--------|
| `VITE_REALTIME_SESSION_MODE=true` | Enable WebSocket session primary path |
| `VITE_FULL_DUPLEX_ENABLED=true` | Enable parallel ASR+TTS with barge-in |
| `VITE_VISION_LEVEL3_ENABLED=true` | Enable continuous vision world model |
| `VITE_HYBRID_OMNI_DIALOGUE=true` | Use Qwen-Omni Realtime proxy (`/api/v1/realtime/omni`) for native audio dialogue |

## Hybrid Omni Realtime

1. Configure `QWEN_API_KEY` and Omni Realtime vars in `server/.env` (see `server/.env.example`).
2. Confirm DashScope account has **Qwen-Omni Realtime** WebSocket access (contact Alibaba Cloud if connection fails with auth errors).
3. Enable `VITE_HYBRID_OMNI_DIALOGUE=true` in `app/.env.local`.
4. Restart server and client. Assist uses server-proxied Omni session for speech-in/speech-out.
5. Legacy `/api/v1/realtime/session` (Paraformer + stub TTS) is skipped when hybrid flag is on.

### Omni ops notes

- Circuit breaker name: `omni-realtime` (5 failures → 30s open)
- Metrics provider id: `omni-realtime`
- Rollback: disable `VITE_HYBRID_OMNI_DIALOGUE` → falls back to PTT or legacy session flags

## Rollback

1. Disable hybrid and/or legacy feature flags
2. Restart client — falls back to push-to-talk turn-based mode
3. Server remains backward compatible with legacy ASR stream endpoint

## Soak Test

Run 30-minute continuous session with flags enabled; monitor:
- Memory growth in browser DevTools
- `activeSessions` count on admin session-health endpoint
- No uncaught WebSocket errors in client console
