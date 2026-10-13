import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/otpusk")({
  head: () => ({
    meta: [
      { title: "Отпуски — Фирма ЕООД" },
      { name: "description", content: "Управление на отпуски." },
      { property: "og:title", content: "Отпуски — Фирма ЕООД" },
      { property: "og:description", content: "Управление на отпуски." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OtpuskPage,
});

function OtpuskPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">Отпуски</h1>
      <p className="mt-2 text-muted-foreground">
        Тази страница е в изграждане.
      </p>
    </div>
  );
}
