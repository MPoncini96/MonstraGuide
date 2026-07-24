import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/sections/page-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { AuthPlaceholder } from "@/components/auth/auth-placeholder";
import { isClerkConfigured } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";

export default async function LoginPage() {
  if (isClerkConfigured()) {
    const isSignedIn = await requireUser().then(() => true).catch(() => false);
    if (isSignedIn) {
      redirect("/app");
    }
  }

  return (
    <PageShell>
      <section className="py-20 lg:py-28">
        <Container className="space-y-12">
          <SectionHeading
            badge="Sign in"
            title="Sign in to your Monstra Guide workspace"
            description="Use the real Clerk flow for authenticated access to the product shell, published guides, and team knowledge."
            level="h1"
          />
          {isClerkConfigured() ? (
            <div className="flex justify-center">
              <SignIn path="/login" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/app" />
            </div>
          ) : (
            <AuthPlaceholder
              title="Clerk configuration is required"
              description="This project is wired for real Clerk authentication, but local Clerk keys have not been added yet."
            />
          )}
        </Container>
      </section>
    </PageShell>
  );
}
