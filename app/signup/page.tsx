import { redirect } from "next/navigation";

import { AuthHero } from "@/components/auth/auth-hero";
import { AuthPanel } from "@/components/auth/auth-panel";
import { SignUpForm } from "@/components/auth/signup-form";
import { auth } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{ city?: string }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { city } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-panel p-4 md:p-8">
      <AuthPanel hero={<AuthHero city={city} />} form={<SignUpForm />} />
    </main>
  );
}
