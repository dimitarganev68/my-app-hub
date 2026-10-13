import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { USERNAME_RE, usernameToEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход и регистрация — Фирма ЕООД" },
      { name: "description", content: "Влезте или създайте профил с юзернейм и парола." },
      { property: "og:title", content: "Вход и регистрация — Фирма ЕООД" },
      { property: "og:description", content: "Влезте или създайте профил с юзернейм и парола." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const u = username.trim();
    if (!USERNAME_RE.test(u)) return setError("Юзернейм: само латински букви, цифри, точка и тире");
    if (password.length < 6) return setError("Паролата трябва да е поне 6 символа");
    if (mode === "register" && password !== password2) return setError("Паролите не съвпадат");
    setBusy(true);
    const email = usernameToEmail(u);
    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setBusy(false);
      if (error) return setError(/registered|exists/i.test(error.message) ? "Този юзернейм вече е зает" : error.message);
      if (!data.session) return setError("Регистрацията е създадена, но изисква потвърждение по имейл — изключете го в настройките на базата.");
      toast.success("Успешна регистрация");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError("Грешен юзернейм или парола");
      toast.success("Добре дошли");
    }
    navigate({ to: "/potrebiteli" });
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">{mode === "login" ? "Вход" : "Регистрация"}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <Label htmlFor="username">Юзернейм</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Парола</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </div>
        {mode === "register" && (
          <div className="space-y-1">
            <Label htmlFor="password2">Повторете паролата</Label>
            <Input id="password2" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "login" ? "Вход" : "Регистрация"}
        </Button>
      </form>
      <button type="button" className="mt-4 text-sm text-muted-foreground underline"
        onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
        {mode === "login" ? "Нямате профил? Регистрирайте се" : "Имате профил? Влезте"}
      </button>
    </div>
  );
}
