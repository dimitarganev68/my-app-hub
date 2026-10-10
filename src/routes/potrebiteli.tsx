import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/potrebiteli")({
  head: () => ({
    meta: [
      { title: "Потребители — Фирма ЕООД" },
      { name: "description", content: "Управление на потребители." },
      { property: "og:title", content: "Потребители — Фирма ЕООД" },
      { property: "og:description", content: "Управление на потребители." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PotrebiteliPage,
});

function PotrebiteliPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">Потребители</h1>
      <p className="mt-2 text-muted-foreground">
        Тази страница е в изграждане.
      </p>
    </div>
  );
}
