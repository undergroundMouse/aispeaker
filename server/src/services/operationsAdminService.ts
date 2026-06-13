import type { ConversationTelemetryRecord, OperationsBudgetConfig } from '@ai/shared'
import type { SqliteStore } from '../db/store.js'
import { getBudgetDateKey } from '../db/store.js'

export class OperationsAuthorizationError extends Error {
  constructor(message = 'Operations admin authorization required.') {
    super(message)
    this.name = 'OperationsAuthorizationError'
  }
}

export class OperationsAdminService {
  constructor(
    private readonly store: SqliteStore,
    private readonly adminApiToken: string,
  ) {}

  listConversations(adminToken: string): ConversationTelemetryRecord[] {
    this.assertAuthorized(adminToken)
    return this.store.list()
  }

  getConversation(adminToken: string, conversationId: string): ConversationTelemetryRecord | undefined {
    this.assertAuthorized(adminToken)
    return this.store.get(conversationId)
  }

  getBudgetConfig(adminToken: string): OperationsBudgetConfig {
    this.assertAuthorized(adminToken)
    return this.store.getBudgetConfig()
  }

  setDailyBudgetCap(adminToken: string, dailyBudgetCap: number | null): OperationsBudgetConfig {
    this.assertAuthorized(adminToken)
    return this.store.setBudgetConfig(dailyBudgetCap)
  }

  getDailySpend(adminToken: string): number {
    this.assertAuthorized(adminToken)
    return this.store.getDailySpend(getBudgetDateKey())
  }

  private assertAuthorized(adminToken: string): void {
    if (adminToken !== this.adminApiToken) {
      throw new OperationsAuthorizationError()
    }
  }
}
