import { Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { authEnabled } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export function SiteHeader({ className }: { className?: string }) {
  const { isPending } = useCurrentUserState();

  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border px-5 py-4 md:px-8",
        className,
      )}
    >
      <Link to="/" className="group flex items-baseline gap-2.5 no-underline">
        <span className="font-display text-xl italic tracking-tight text-fg md:text-2xl">
          Lineage
        </span>
        <span className="hidden font-sans text-xs tracking-wide text-subtle sm:inline">
          writing origin
        </span>
      </Link>

      <nav className="flex items-center gap-1 sm:gap-2">
        <Link
          to="/method"
          className="inline-flex h-11 items-center rounded-md px-3 text-sm text-muted no-underline transition-colors duration-150 hover:text-fg"
        >
          Method
        </Link>
        {isPending ? (
          <div className="h-8 w-20 animate-pulse rounded-md bg-surface-2" />
        ) : (
          <>
            <SignedOut>
              {authEnabled ? (
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center rounded-md px-3 text-sm text-muted no-underline transition-colors duration-150 hover:text-fg"
                >
                  Sign in
                </Link>
              ) : null}
            </SignedOut>
            <SignedIn>
              <div className="hidden text-muted sm:block [&_button]:text-muted [&_button]:hover:text-fg [&_img]:size-7 [&_span]:text-sm">
                <UserButton />
              </div>
              <div className="sm:hidden [&_button]:text-muted [&_img]:size-7 [&_span.font-medium]:hidden">
                <UserButton />
              </div>
            </SignedIn>
          </>
        )}
      </nav>
    </header>
  );
}
