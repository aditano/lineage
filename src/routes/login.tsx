import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="font-display text-3xl italic tracking-tight text-fg">Sign in</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Optional. Lineage works without an account — sign in if you want a session on this
          desk.
        </p>
        <div className="mt-6 space-y-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Continue with {p.label}
              </Button>
            ))
          ) : (
            <p className="text-sm text-subtle">Sign-in is disabled.</p>
          )}
        </div>
        <p className="mt-8 text-sm text-subtle">
          <Link to="/" className="text-fg underline-offset-4 hover:underline">
            Back to the desk
          </Link>
        </p>
      </div>
    </main>
  );
}
