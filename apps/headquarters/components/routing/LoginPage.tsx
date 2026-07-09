"use client";

import { Card, DashboardLayout, PageHeader } from "@douglas/ui";
import Link from "next/link";
import { PageBackground } from "@/components/decorative/PageBackground";
import { Footer } from "@/components/layout/Footer";
import { AuthPanel } from "@/features/platform-auth";

export function LoginPage() {
  return (
    <DashboardLayout
      background={<PageBackground />}
      header={
        <PageHeader
          eyebrow="Douglas AI OS"
          title="Login"
          subtitle="Autenticação Supabase — RBAC mock permanece ativo nesta fase"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Login", href: "/login" },
          ]}
        />
      }
      footer={<Footer />}
    >
      <div className="mx-auto max-w-md space-y-[var(--ds-space-4)]">
        <Card className="p-[var(--ds-space-6)]">
          <AuthPanel />
        </Card>
        <p className="text-center text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          <Link href="/headquarters" className="underline underline-offset-2">
            Voltar ao Headquarters
          </Link>
        </p>
      </div>
    </DashboardLayout>
  );
}
