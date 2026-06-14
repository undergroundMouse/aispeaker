import type { ConversationTelemetryRecord, OperationsBudgetConfig } from '../types'
import type { ConversationTelemetryStore } from '../gateway/conversationTelemetry'
import { getBudgetDateKey } from '../gateway/conversationTelemetry'

export class OperationsAuthorizationError extends Error {
  constructor(message = 'Operations admin authorization required.') {
    super(message)
    this.name = 'OperationsAuthorizationError'
  }
}

export interface OperationsAdminApi {
  listConversations: (adminToken: string) => ConversationTelemetryRecord[]
  getConversation: (adminToken: string, conversationId: string) => ConversationTelemetryRecord | undefined
  getBudgetConfig: (adminToken: string) => OperationsBudgetConfig
  setDailyBudgetCap: (adminToken: string, dailyBudgetCap: number | null) => OperationsBudgetConfig
  getDailySpend: (adminToken: string) => number
}

export class InMemoryOperationsAdmin implements OperationsAdminApi {
  private readonly telemetryStore: ConversationTelemetryStore
  private readonly adminToken: string
  private budgetConfig: OperationsBudgetConfig

  constructor(
    telemetryStore: ConversationTelemetryStore,
    adminToken = 'ops-admin-token',
    initialBudgetCap: number | null = null,
  ) {
    this.telemetryStore = telemetryStore
    this.adminToken = adminToken
    this.budgetConfig = {
      dailyBudgetCap: initialBudgetCap,
      updatedAt: Date.now(),
    }
  }

  listConversations(adminToken: string): ConversationTelemetryRecord[] {
    this.assertAuthorized(adminToken)
    return this.telemetryStore.list()
  }

  getConversation(adminToken: string, conversationId: string): ConversationTelemetryRecord | undefined {
    this.assertAuthorized(adminToken)
    return this.telemetryStore.get(conversationId)
  }

  getBudgetConfig(adminToken: string): OperationsBudgetConfig {
    this.assertAuthorized(adminToken)
    return this.budgetConfig
  }

  setDailyBudgetCap(adminToken: string, dailyBudgetCap: number | null): OperationsBudgetConfig {
    this.assertAuthorized(adminToken)
    this.budgetConfig = {
      dailyBudgetCap,
      updatedAt: Date.now(),
    }
    return this.budgetConfig
  }

  getDailySpend(adminToken: string): number {
    this.assertAuthorized(adminToken)
    return this.telemetryStore.getDailySpend(getBudgetDateKey())
  }

  private assertAuthorized(adminToken: string): void {
    if (adminToken !== this.adminToken) {
      throw new OperationsAuthorizationError()
    }
  }
}

export const OPERATIONS_ADMIN_SETUP = `# Operations Admin Setup

1. Use the in-app Operations Admin panel with the configured admin token.
2. Review per-conversation estimated tokens, actual tokens, and cost estimates.
3. Set a daily budget cap to block cloud requests that would exceed the remaining budget.
4. Daily spend resets automatically at the start of each UTC calendar day.
`
