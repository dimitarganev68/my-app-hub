import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DatePicker, formatDateDisplay } from "@/components/DatePicker";
import {
  listUsers, createUser, updateUser, deleteUser, USERNAME_PATTERN, type AppUser,
} from "@/lib/users.functions";

const usersQuery = queryOptions({ queryKey: ["app_users"], queryFn: () => listUsers() });

export const Route = createFileRoute("/potrebiteli")({
  head: () => ({
    meta: [
      { title: "Потребители — Фирма ЕООД" },
      { name: "description", content: "Списък и управление на потребители." },
      { property: "og:title", content: "Потребители — Фирма ЕООД" },
      { property: "og:description", content: "Списък и управление на потребители." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(usersQuery),
  component: PotrebiteliPage,
});

type User = AppUser;
type Key = keyof User;

const columns: { key: Key; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "firstName", label: "Име" },
  { key: "middleName", label: "Презиме" },
  { key: "lastName", label: "Фамилия" },
  { key: "username", label: "Юзернейм" },
  { key: "address", label: "Адрес" },
  { key: "birthDate", label: "Дата на раждане" },
];

const empty: Omit<User, "id"> = {
  firstName: "", middleName: "", lastName: "", username: "", address: "", birthDate: "",
};

const formatDate = formatDateDisplay;

function PotrebiteliPage() {
  const qc = useQueryClient();
  const { data: users } = useSuspenseQuery(usersQuery);
  const [sort, setSort] = useState<{ key: Key; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });
  const [filters, setFilters] = useState<Partial<Record<Key, string>>>({});
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, "id">>(empty);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof empty, string>>>({});
  const [toDelete, setToDelete] = useState<User | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["app_users"] });

  const rows = useMemo(() => {
    const filtered = users.filter((u) =>
      columns.every(({ key }) => {
        const f = filters[key]?.trim().toLowerCase();
        if (!f) return true;
        const val = key === "birthDate" ? formatDate(u.birthDate) : String(u[key]);
        return val.toLowerCase().includes(f);
      }),
    );
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const c = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv), "bg");
      return sort.dir === "asc" ? c : -c;
    });
  }, [users, filters, sort]);

  const toggleSort = (key: Key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const openAdd = () => {
    setEditing(null); setForm(empty); setErrors({}); setOpen(true);
  };
  const openEdit = (u: User) => {
    const { id: _id, ...rest } = u;
    setEditing(u); setForm(rest); setErrors({}); setOpen(true);
  };

  const save = async () => {
    const e: Partial<Record<keyof typeof empty, string>> = {};
    const t = (s: string) => s.trim();
    if (!t(form.firstName)) e.firstName = "Задължително поле";
    if (!t(form.lastName)) e.lastName = "Задължително поле";
    if (!t(form.username)) e.username = "Задължително поле";
    else if (!USERNAME_PATTERN.test(t(form.username)))
      e.username = "Само латински букви, цифри, точка и тире";
    else if (users.some((u) => u.username.toLowerCase() === t(form.username).toLowerCase() && u.id !== editing?.id))
      e.username = "Юзернеймът вече съществува";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      if (editing) await updateUser({ data: { id: editing.id, ...form } });
      else await createUser({ data: form });
      await refresh();
      setOpen(false);
      toast.success(editing ? "Потребителят е обновен" : "Потребителят е добавен");
    } catch (err) {
      if (err instanceof Error && err.message.includes("DUPLICATE_USERNAME"))
        setErrors({ username: "Юзернеймът вече съществува" });
      else toast.error("Грешка при запис. Опитайте отново.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u: User) => {
    try {
      await deleteUser({ data: { id: u.id } });
      await refresh();
      toast.success("Потребителят е изтрит");
    } catch {
      toast.error("Грешка при изтриване. Опитайте отново.");
    }
  };

  const field = (key: keyof typeof empty, label: string, required = false, type = "text") => (
    <div className="grid gap-1.5">
      <Label htmlFor={key}>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input
        id={key}
        type={type}
        maxLength={100}
        value={form[key]}
        onChange={(ev) => setForm({ ...form, [key]: ev.target.value })}
      />
      {errors[key] && <p className="text-sm text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">Потребители</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Добавяне</Button>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(({ key, label }) => (
                <TableHead key={key}>
                  <button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort(key)}>
                    {label}
                    {sort.key !== key ? <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                      : sort.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                  </button>
                </TableHead>
              ))}
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              {columns.map(({ key }) => (
                <TableHead key={key} className="py-2">
                  <Input
                    className="h-8"
                    placeholder={key === "birthDate" ? "дд.мм.гггг" : "Филтър..."}
                    value={filters[key] ?? ""}
                    onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                  />
                </TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">
                  Няма намерени потребители.
                </TableCell>
              </TableRow>
            ) : rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.firstName}</TableCell>
                <TableCell>{u.middleName}</TableCell>
                <TableCell>{u.lastName}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.address}</TableCell>
                <TableCell>{formatDate(u.birthDate)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" aria-label="Редактиране" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Изтриване" onClick={() => setToDelete(u)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Редактиране на потребител #${editing.id}` : "Нов потребител"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {field("firstName", "Име", true)}
            {field("middleName", "Презиме")}
            {field("lastName", "Фамилия", true)}
            {field("username", "Юзернейм", true)}
            {field("address", "Адрес")}
            <div className="grid gap-1.5">
              <Label htmlFor="birthDate">Дата на раждане</Label>
              <DatePicker
                id="birthDate"
                value={form.birthDate}
                onChange={(v) => setForm((f) => ({ ...f, birthDate: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отказ</Button>
            <Button onClick={save} disabled={saving}>Запази</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на потребител</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете {toDelete?.firstName} {toDelete?.lastName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) void remove(toDelete);
                setToDelete(null);
              }}
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
