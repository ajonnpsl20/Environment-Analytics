"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, LineChart, FileCheck2 } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const DEMO_ACCOUNTS = [
  { label: "System Admin", email: "admin@envirohub.demo" },
  { label: "Site Admin – England", email: "siteadmin@envirohub.demo" },
  { label: "Site Admin – Scotland & Wales", email: "siteadmin2@envirohub.demo" },
  { label: "Data Entry", email: "data@envirohub.demo" },
] as const;

// Injected at build time from the env so the literal stays out of source/git
// history. Intentionally surfaced on this PoC login screen for demo convenience.
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "";

export default function LoginPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setPending(true);
    const res = await signIn("credentials", { ...values, redirect: false });
    setPending(false);

    if (!res || res.error) {
      toast.error("Invalid email or password");
      return;
    }
    toast.success("Signed in");
    router.push("/dashboard");
    router.refresh();
  }

  function fillDemo(email: string) {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", DEMO_PASSWORD, { shouldValidate: true });
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, color-mix(in oklch, var(--color-primary) 35%, transparent), transparent), radial-gradient(50% 40% at 90% 90%, color-mix(in oklch, var(--color-chart-2) 30%, transparent), transparent)",
          }}
        />
        <div className="relative">
          <Logo className="[&_span]:text-sidebar-foreground" />
        </div>
        <div className="relative space-y-6">
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight">
            Multi-site environmental performance,
            <br />
            collected and validated in one place.
          </h1>
          <ul className="space-y-3 text-sm text-sidebar-foreground/80">
            <li className="flex items-center gap-3">
              <FileCheck2 className="size-4 text-sidebar-primary" />
              Air, waste, water &amp; electricity data entry with approvals
            </li>
            <li className="flex items-center gap-3">
              <LineChart className="size-4 text-sidebar-primary" />
              Dashboards and filterable, exportable records
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-sidebar-primary" />
              Full audit trail for every change
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-sidebar-foreground/60">
          Proof of concept &middot; demo environment
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="lg:hidden">
              <Logo />
            </div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access EnviroHub.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
            </form>
          </Form>

          <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Demo accounts (password: {DEMO_PASSWORD})
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <Button
                  key={acc.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemo(acc.email)}
                >
                  {acc.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
