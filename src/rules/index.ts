import type { Rule } from "../types.js";
import { promptInjectionRules } from "./prompt-injection.js";
import { exfiltrationRules } from "./exfiltration.js";
import { toolPoisoningRules } from "./tool-poisoning.js";
import { obfuscationRules } from "./obfuscation.js";
import { sensitiveActionRules } from "./sensitive-actions.js";
import { secretRules } from "./secrets.js";

/** Bump when rules change — recorded in scan results and compliance evidence. */
export const RULESET_VERSION = "0.1.0";

export const allRules: Rule[] = [
  ...promptInjectionRules,
  ...exfiltrationRules,
  ...toolPoisoningRules,
  ...obfuscationRules,
  ...sensitiveActionRules,
  ...secretRules,
];

export {
  promptInjectionRules,
  exfiltrationRules,
  toolPoisoningRules,
  obfuscationRules,
  sensitiveActionRules,
  secretRules,
};
