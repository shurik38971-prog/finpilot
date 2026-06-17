type ErrorLike = {
  name?: unknown;
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

export function safeLogError(error: unknown): Record<string, string | number> {
  if (!error || typeof error !== "object") {
    return { type: typeof error };
  }

  const errorLike = error as ErrorLike;
  const safe: Record<string, string | number> = {
    type: error instanceof Error ? error.name : error.constructor.name,
  };

  if (typeof errorLike.name === "string") safe.name = errorLike.name;
  if (typeof errorLike.code === "string" || typeof errorLike.code === "number") {
    safe.code = errorLike.code;
  }
  if (
    typeof errorLike.status === "string" ||
    typeof errorLike.status === "number"
  ) {
    safe.status = errorLike.status;
  }
  if (
    typeof errorLike.statusCode === "string" ||
    typeof errorLike.statusCode === "number"
  ) {
    safe.statusCode = errorLike.statusCode;
  }

  return safe;
}
