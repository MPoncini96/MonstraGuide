import process from "node:process";
import { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

function getArg(flag: string) {
  const direct = process.argv.find((entry) => entry.startsWith(`${flag}=`));
  if (direct) return direct.slice(flag.length + 1);
  const index = process.argv.findIndex((entry) => entry === flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("bootstrap-dev-admin is disabled in production.");
  }
  if (process.env.MONSTRA_ALLOW_DEV_BOOTSTRAP !== "true") {
    throw new Error("Set MONSTRA_ALLOW_DEV_BOOTSTRAP=true to use this development bootstrap command.");
  }

  const email = getArg("--email");
  const workspaceSlug = getArg("--workspace") ?? "northwind-ops";
  if (!email) {
    throw new Error("Usage: npm run dev:bootstrap-admin -- --email you@example.com [--workspace northwind-ops]");
  }

  const user = await prisma.user.findFirst({ where: { normalizedEmail: email.trim().toLowerCase() } });
  if (!user) {
    throw new Error("No local user record was found for that email. Sign in once first so Clerk sync can create it.");
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
  if (!workspace) {
    throw new Error(`Workspace '${workspaceSlug}' was not found. Seed the database first or provide a valid workspace slug.`);
  }

  await prisma.workspaceMembership.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: { role: WorkspaceRole.ADMIN },
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: WorkspaceRole.ADMIN,
    },
  });

  console.log(`Attached ${email} to workspace ${workspace.slug} as ADMIN.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });