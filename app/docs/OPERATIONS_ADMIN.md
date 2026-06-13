# Operations Admin Setup

Use the in-app Operations Admin panel to review cloud usage and configure daily budget caps.

## Review conversation costs

1. Open the app and process at least one cloud-bound dialogue turn.
2. In the Operations Admin section, inspect per-conversation estimated tokens, actual tokens when available, and cost estimates.

## Configure daily budget caps

1. Click **Set daily budget cap to $0.01** to enforce a low daily limit for testing.
2. Click **Clear daily budget cap** to remove the limit.
3. When the remaining budget is insufficient for a new cloud request, the gateway blocks the request before it is sent.

## Authorization

Operations admin APIs require the configured admin token (`ops-admin-token` in the prototype).
