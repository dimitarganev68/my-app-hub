import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/nastroyki")({
  head: () => ({
    meta: [
      { title: "Настройки — Фирма ЕООД" },
      { name: "description", content: "Настройки на приложението." },
      { property: "og:title", content: "Настройки — Фирма ЕООД" },
      { property: "og:description", content: "Настройки на приложението." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NastroykiPage,
});

function NastroykiPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">Настройки</h1>
      <p className="mt-2 text-muted-foreground">
        Тази страница е в изграждане.
      </p>
    </div>
  );
}
