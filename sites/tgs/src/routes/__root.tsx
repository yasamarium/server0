import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { DeveloperOfflineNotification } from "../components/DeveloperOfflineNotification";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });

    // Automatically reload page if a stale deployment JS chunk failed to load
    const isChunkError =
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Failed to load module script") ||
      error?.message?.includes("Importing a module script failed") ||
      error?.name === "ChunkLoadError";

    if (isChunkError && typeof window !== "undefined") {
      // Instantly reload to fetch latest deployment bundle assets
      window.location.reload();
      return;
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-sans select-none">
      <div className="max-w-md text-center space-y-4 p-8 rounded-[28px] border border-border/40 bg-secondary/10 ios-glass shadow-2xl">
        <div className="size-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400 font-black text-xl">
          !
        </div>
        <h1 className="text-xl font-black tracking-tight text-foreground">
          Temporary Connection Refresh
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {error?.message ? `Error details: ${error.message}` : "The edge network route updated. Click below to reload or return to the main dashboard."}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
              else {
                router.invalidate();
                reset();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/20"
          >
            Reload Page
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 text-foreground font-bold text-xs transition-all"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CLOUD • Link & Notes" },
      { name: "description", content: "Secure file link sharing and anonymous note publisher in a premium dark glassmorphism interface." },
      { name: "author", content: "CLOUD" },
      { property: "og:title", content: "CLOUD • Link & Notes" },
      { property: "og:description", content: "Secure file link sharing and anonymous note publisher in a premium dark glassmorphism interface." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@CLOUD" },
      { name: "twitter:title", content: "CLOUD • Link & Notes" },
      { name: "twitter:description", content: "Secure file link sharing and anonymous note publisher in a premium dark glassmorphism interface." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bec9b761-6ea2-41f8-90fa-3c341da2d776/id-preview-a191bd27--2dbc0f29-ae8a-48ff-8283-4c7fde919a6d.lovable.app-1782300157388.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bec9b761-6ea2-41f8-90fa-3c341da2d776/id-preview-a191bd27--2dbc0f29-ae8a-48ff-8283-4c7fde919a6d.lovable.app-1782300157388.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                const isDark = saved ? saved === 'dark' : true;
                if (!isDark) {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}

              // Auto-reload window if a stale deployment chunk fails to fetch
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  if (e && e.message && (e.message.includes('Failed to fetch dynamically imported module') || e.message.includes('Importing a module script failed'))) {
                    window.location.reload();
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  if (e && e.reason && e.reason.message && (e.reason.message.includes('Failed to fetch dynamically imported module') || e.reason.message.includes('Importing a module script failed'))) {
                    window.location.reload();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Site-Wide Gatekeeper - Open for everyone
function SecurityGatekeeper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SecurityGatekeeper>
        <DeveloperOfflineNotification />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </SecurityGatekeeper>
    </QueryClientProvider>
  );
}
