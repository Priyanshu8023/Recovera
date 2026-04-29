import { LLMProvider } from "./provider-config";

export class LLMError extends Error {
  kind = "LLMError" as const;
  reason: "timeout" | "api_error" | "both_providers_failed";
  provider: LLMProvider | "none";
  statusCode?: number;

  constructor(
    reason: "timeout" | "api_error" | "both_providers_failed",
    provider: LLMProvider | "none",
    message: string,
    statusCode?: number
  ) {
    super(message);
    this.reason = reason;
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

export class AgentError extends Error {
  kind = "AgentError" as const;
}

export class VerificationError extends AgentError {
  kind = "VerificationError" as const;
}
