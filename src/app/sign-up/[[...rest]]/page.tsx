import { SignUp } from "@clerk/nextjs";
import { PageShell } from "@/components/sections/page-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { AuthPlaceholder } from "@/components/auth/auth-placeholder";
import { isClerkConfigured } from "@/lib/env";

export default function SignUpPage() {
  return (
    <PageShell>
      <section className="py-20 lg:py-28">
        <Container className="space-y-12">
          <SectionHeading badge="Create account" title="Create a workspace-ready account" description="New users who do not yet belong to a workspace will be sent to the onboarding flow to create one." level="h1" />
          {isClerkConfigured() ? <div className="flex justify-center"><SignUp path="/sign-up" routing="path" signInUrl="/login" fallbackRedirectUrl="/app" /></div> : <AuthPlaceholder title="Clerk configuration is required" description="The sign-up route is ready for Clerk once you add local development credentials." />}
        </Container>
      </section>
    </PageShell>
  );
}
