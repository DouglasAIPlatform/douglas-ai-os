import type {
  ActionConfirmationRequest,
  ActionConfirmationRequestInput,
  ActionConfirmationResult,
} from "./SecurityTypes";

let confirmationCounter = 0;

export class ActionConfirmation {
  private pending: ActionConfirmationRequest | null = null;

  createRequest(
    operatorId: string,
    input: ActionConfirmationRequestInput,
  ): ActionConfirmationRequest {
    confirmationCounter += 1;
    const request: ActionConfirmationRequest = {
      id: `confirm-${confirmationCounter}`,
      operatorId,
      moduleId: input.moduleId,
      action: input.action,
      moduleName: input.moduleName,
      actionLabel: input.actionLabel,
      risk: input.risk,
      consequence: input.consequence,
      message: input.message,
      requestedAt: new Date().toISOString(),
    };
    this.pending = request;
    return request;
  }

  resolve(requestId: string, confirmed: boolean): ActionConfirmationResult {
    const result: ActionConfirmationResult = {
      requestId,
      confirmed,
      resolvedAt: new Date().toISOString(),
    };
    if (this.pending?.id === requestId) {
      this.pending = null;
    }
    return result;
  }

  getPending(): ActionConfirmationRequest | null {
    return this.pending;
  }
}

export function createActionConfirmation(): ActionConfirmation {
  return new ActionConfirmation();
}
