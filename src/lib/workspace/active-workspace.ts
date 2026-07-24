import { cookies } from "next/headers";

export const ACTIVE_WORKSPACE_COOKIE = "monstra_active_workspace";

export async function getActiveWorkspaceCookie() {
  return (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value ?? null;
}

export async function setActiveWorkspaceCookie(workspaceId: string) {
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
