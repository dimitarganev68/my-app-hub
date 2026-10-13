import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { emailToUsername } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Начална" },
  { to: "/otpusk", label: "Отпуски" },
  { to: "/potrebiteli", label: "Потребители" },
  { to: "/nastroyki", label: "Настройки" },
] as const;

export function Header() {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const items = session ? navItems : navItems.filter((i) => i.to === "/");
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          {/* Logo placeholder */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              Лого
            </div>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{
                  className:
                    "rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground",
                }}
                inactiveProps={{
                  className:
                    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {session ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{emailToUsername(session.user.email)}</span>
            <Button size="sm" variant="outline" onClick={signOut}>Изход</Button>
          </div>
        ) : (
          <Button size="sm" asChild><Link to="/auth">Вход</Link></Button>
        )}
      </div>
      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 sm:hidden">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            activeProps={{
              className:
                "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground",
            }}
            inactiveProps={{
              className:
                "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
