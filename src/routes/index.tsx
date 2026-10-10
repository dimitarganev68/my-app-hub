import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Начална — Фирма ЕООД" },
      { name: "description", content: "Начална страница на приложението." },
      { property: "og:title", content: "Начална — Фирма ЕООД" },
      { property: "og:description", content: "Начална страница на приложението." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">Добре дошли!</h1>
      <p className="mt-2 text-muted-foreground">
        Това е началната страница на приложението. Използвайте менюто горе, за
        да превключвате между страниците.
      </p>
    </div>
  );
}
