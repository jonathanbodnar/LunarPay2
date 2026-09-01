/**
 * Fortis pricing template resolution.
 *
 * A template lives under a specific Fortis agent, and the template — not the
 * API credentials — is what places a newly onboarded merchant under that agent.
 *
 * The evidence: the onboarding API user (`lunaronboardingapiuser@noreply.com`,
 * `11efc4426b171cd2bcdcd190`) is a Location Admin on *Apollo Eleven Inc
 * (Office) - 715243*, yet merchants it onboards land under *LunarPay (Agent) -
 * 715276*, one level below. If credentials selected placement they would land
 * on the Office. `template_code` is the only agent-scoped value in the
 * onboarding payload.
 *
 * Practical consequence: onboarding under a NEW agent needs a template, NOT new
 * Fortis API keys. `developer-id`, `user-id` and `user-api-key` stay on Apollo
 * for every agency.
 *
 * Precedence (highest first):
 *   1. sandbox override — never send a live pricing template to a test gateway
 *   2. `church_detail.fortis_template` — per-org, for one-off pricing
 *   3. `agencies.fortis_template`     — the agency's default
 *   4. platform default               — LunarPay (Agent) - 715276
 *
 * Both overrides are columns, not constants: adding an agency is a row update,
 * not a deploy. Do not reintroduce a hardcoded agency→template map here — it
 * would be a second source of truth that silently diverges from the database.
 */

/** Sandbox template. Wins over everything when not pointed at production. */
export const TEST_FORTIS_TEMPLATE = 'Testing1234';

/** Platform default — places merchants under LunarPay (Agent) - 715276. */
export const DEFAULT_FORTIS_TEMPLATE = 'lunarpayfr';

export function resolveFortisTemplate(opts: {
  isTest: boolean;
  orgTemplate?: string | null;
  agencyTemplate?: string | null;
}): string {
  if (opts.isTest) return TEST_FORTIS_TEMPLATE;
  return opts.orgTemplate || opts.agencyTemplate || DEFAULT_FORTIS_TEMPLATE;
}
