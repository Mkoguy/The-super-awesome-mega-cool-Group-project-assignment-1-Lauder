const billingCodes = new Set([
  "credit_balance_exhausted",
  "organization_usage_limit_exceeded",
  "organization_spend_limit_exceeded",
  "project_spend_limit_exceeded",
  "insufficient_quota"
]);

export function explainOpenAIError(status, payload) {
  const error = payload?.error || {};
  const code = typeof error.code === "string" ? error.code : "";
  const type = typeof error.type === "string" ? error.type : "";

  if (status === 429) {
    if (code === "credit_balance_exhausted") return "Your OpenAI API credit balance is exhausted. Check API Billing in OpenAI Platform.";
    if (code === "organization_usage_limit_exceeded") return "Your OpenAI API organization has reached its approved usage limit. Check Limits in OpenAI Platform.";
    if (code === "organization_spend_limit_exceeded" || code === "project_spend_limit_exceeded") return "Your OpenAI API spending limit has been reached. Check the organization and project limits in OpenAI Platform.";
    if (billingCodes.has(code) || type === "insufficient_quota") return "OpenAI reports an API quota or billing limit. Check your API balance and limits in OpenAI Platform.";
    if (code === "rate_limit_exceeded" || type === "rate_limit_exceeded") return "OpenAI's request rate limit was reached. Wait a little before trying again, then check your API Limits if it continues.";
    return "OpenAI returned 429. This can mean a temporary rate limit or an API billing or usage limit. Check API Billing and Limits in OpenAI Platform.";
  }
  if (status === 401) return "OpenAI rejected the API key. Check the key saved in Settings.";
  if (status === 403) return "This API key cannot access the requested model. Check its project permissions and model access in OpenAI Platform.";
  if (status === 400 && code === "model_not_found") return "The selected OpenAI model is unavailable to this API key. Check OPENAI_MODEL and model access.";
  return `OpenAI returned ${status}. Check the API key, model, and account access.`;
}
