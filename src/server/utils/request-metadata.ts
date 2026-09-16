import { randomUUID } from "node:crypto";

import { headers } from "next/headers";

export async function getRequestMetadata() {
  const headersList = await headers();

  const forwardedFor = headersList.get("x-forwarded-for");

  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? null;

  const userAgent = headersList.get("user-agent");

  const requestId =
    headersList.get("x-request-id") ??
    headersList.get("x-vercel-id") ??
    randomUUID();

  return {
    ipAddress,
    userAgent,
    requestId,
  };
}
