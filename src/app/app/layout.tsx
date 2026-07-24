import { AppShell } from "@/components/app/app-shell";
import { requireActiveWorkspace } from "@/lib/auth/session";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const context = await requireActiveWorkspace();
  return (
    <AppShell role={context.membership.role} workspace={context.workspace} memberships={context.memberships}>
      {children}
    </AppShell>
  );
}
