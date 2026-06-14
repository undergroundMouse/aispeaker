# Hybrid Omni Rollout Checklist

Use this checklist before enabling `VITE_HYBRID_OMNI_DIALOGUE=true` in staging or production.

## Prerequisites

- [ ] DashScope account has Qwen-Omni Realtime WebSocket access
- [ ] `server/.env` contains valid `QWEN_API_KEY`
- [ ] `QWEN_OMNI_REALTIME_MODEL` and `QWEN_OMNI_REALTIME_BASE_URL` configured
- [ ] `app/.env.local` points to backend with `VITE_BACKEND_BASE_URL`
- [ ] Device token matches between app and server

## Staging Soak (minimum 30 minutes)

- [ ] Enable `VITE_HYBRID_OMNI_DIALOGUE=true`
- [ ] Confirm Omni session reaches `connected` in Settings
- [ ] Speak 10+ turns with barge-in attempts
- [ ] Ask 3+ visual questions and verify evidence overlay updates
- [ ] Induce Omni failure (invalid key in staging sandbox) and confirm fallback to legacy session
- [ ] Induce legacy failure and confirm push-to-talk still works
- [ ] Monitor `/api/v1/admin/session-health` for `omni-realtime` circuit state
- [ ] Verify Operator dashboard shows Omni duration and VL verify counters

## Quality Gates

- [ ] `npm run test` passes hybrid fluency and fallback tests
- [ ] p95 first-audio below 800ms on staging samples
- [ ] barge-in success above 90% on fixture harness
- [ ] common-object visual accuracy remains above 85% with hybrid orchestrator

## Rollout

1. Enable in staging only (`VITE_HYBRID_OMNI_DIALOGUE=true`)
2. Keep `VITE_REALTIME_SESSION_MODE=false` unless testing legacy fallback explicitly
3. Leave `VITE_OMNI_VL_CORRECTION_MODE=ui-only` until spoken correction UX is validated
4. After soak pass, enable for pilot users
5. Only consider default-on after 7-day stable soak

## Rollback

1. Set `VITE_HYBRID_OMNI_DIALOGUE=false`
2. Restart client
3. Optional: keep `VITE_REALTIME_SESSION_MODE=true` for legacy session path
4. Push-to-talk remains available without flags
