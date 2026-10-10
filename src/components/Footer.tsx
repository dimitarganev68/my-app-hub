import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              Лого
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Фирма ЕООД — примерни контактни данни.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Контакти</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                гр. София, бул. „България" 100
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                +359 2 000 0000
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                office@example.bg
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Фирма ЕООД. Всички права запазени.
        </div>
      </div>
    </footer>
  );
}
