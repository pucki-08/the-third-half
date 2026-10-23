const hostingErrors = [
  "FUNCTION_INVOCATION_FAILED", "FUNCTION_INVOCATION_TIMEOUT",
  "NO_RESPONSE_FROM_FUNCTION", "DEPLOYMENT_NOT_FOUND", "NOT_FOUND",
];

export async function readServiceResponse(response) {
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { /* Hosting error pages may be plain text or HTML. */ }
  const isObject = data !== null && typeof data === "object" && !Array.isArray(data);
  if (response.ok && isObject) return data;

  const headerCode = response.headers.get("x-vercel-error");
  const code = hostingErrors.find((value) => value === headerCode || new RegExp(`\\b${value}\\b`).test(text));
  const detail = `HTTP ${response.status}${code ? ` · ${code}` : ""}`;
  let message;
  if (!response.ok && isObject && typeof data.error === "string" && data.error.trim()) message = data.error;
  else if (code === "FUNCTION_INVOCATION_TIMEOUT" || response.status === 504) message = `Your Fan Buddy took too long to respond (${detail}). Please try again.`;
  else if (code === "FUNCTION_INVOCATION_FAILED" || code === "NO_RESPONSE_FROM_FUNCTION") message = `The chat server could not start (${detail}). The site owner needs to check the server logs.`;
  else if (response.status === 404) message = `The chat service could not be found (${detail}). The site owner needs to check the deployment.`;
  else if (response.status === 401 || response.status === 403) message = `Access to the chat service was blocked (${detail}). Please check that you can access this deployment.`;
  else if (response.status === 429) message = `The chat service is busy (${detail}). Please wait a moment and try again.`;
  else if (!response.ok) message = `The chat service is unavailable (${detail}). Please try again shortly.`;
  else message = `The chat service returned an unreadable response (${detail}). Please reload the page and try again.`;

  const error = new Error(message);
  error.status = response.status;
  error.code = code || (response.ok ? "INVALID_API_RESPONSE" : "HTTP_ERROR");
  throw error;
}
