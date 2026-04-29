import { SafetyClass } from "../agent/types";

export function getSafetyClass(action: string): SafetyClass {
  switch (action) {
    case "fix_s3_public_access":
      return "safe";
    case "restrict_iam_policy":
      return "needs_approval";
    case "close_security_group_port":
      return "needs_approval";
    case "alert_only":
      return "safe";
    case "unknown":
      return "blocked";
    default:
      return "blocked";
  }
}
