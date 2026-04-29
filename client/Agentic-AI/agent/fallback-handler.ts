import { AgentInput, FallbackResponse, FailureReason } from "./types";
import { LLMError } from "./errors";

export function handleFailure(error: unknown, input: AgentInput): FallbackResponse {
  let reason: FailureReason = "unknown_action"; // default generic fallback
  let message = "An unknown error occurred during agent execution.";

  if (error && typeof error === "object" && "kind" in error) {
    if (error.kind === "ParseError") {
      reason = (error as any).reason || "parse_error";
      message = "Failed to parse structured LLM response.";
    } else if (error instanceof LLMError) {
      reason = error.reason;
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return {
    kind: "FallbackResponse",
    path: "alert_only",
    reason,
    message,
    original_input: input
  };
}
