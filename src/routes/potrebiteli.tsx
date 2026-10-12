import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  component: PotrebiteliPage,
});

type User = {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  username: string;
  address: string;
  birthDate: string;
};

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

const initialUsers: User[] = [
  { id: 1, firstName: "Иван", middleName: "Петров", lastName: "Иванов", username: "ivan.ivanov", address: "София, ул. Витоша 10", birthDate: "1985-04-12" },
  { id: 2, firstName: "Мария", middleName: "Георгиева", lastName: "Петрова", username: "maria.p", address: "Пловдив, ул. Главна 5", birthDate: "1990-09-23" },
  { id: 3, firstName: "Георги", middleName: "", lastName: "Димитров", username: "gdimitrov", address: "Варна, бул. Приморски 22", birthDate: "1978-01-30" },
  { id: 4, firstName: "Елена", middleName: "Николова", lastName: "Стоянова", username: "elena.s", address: "", birthDate: "1995-12-05" },
  { id: 5, firstName: "Петър", middleName: "Иванов", lastName: "Колев", username: "pkolev", address: "Бургас, ул. Александровска 3", birthDate: "1988-07-18" },
];

const empty: Omit<User, "id"> = {
  firstName: "", middleName: "", lastName: "", username: "", address: "", birthDate: "",
};

function formatDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

function PotrebiteliPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [nextId, setNextId] = useState(initialUsers.length + 1);
  const [sort, setSort] = useState<{ key: Key; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });
  const [filters, setFilters] = useState<Partial<Record<Key, string>>>({});
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, "id">>(empty);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<User | null>(null);

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

  const save = () => {
    const e: Record<string, string> = {};
    const t = (s: string) => s.trim();
    if (!t(form.firstName)) e.firstName = "Задължително поле";
    if (!t(form.lastName)) e.lastName = "Задължително поле";
    if (!t(form.username)) e.username = "Задължително поле";
    else if (users.some((u) => u.username.toLowerCase() === t(form.username).toLowerCase() && u.id !== editing?.id))
      e.username = "Юзернеймът вече съществува";
    setErrors(e);
    if (Object.keys(e).length) return;
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as Omit<User, "id">;
    if (editing) {
      setUsers((list) => list.map((u) => (u.id === editing.id ? { ...u, ...clean } : u)));
    } else {
      setUsers((list) => [...list, { id: nextId, ...clean }]);
      setNextId((n) => n + 1);
    }
    setOpen(false);
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
                    placeholder="Филтър..."
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
            {field("birthDate", "Дата на раждане", false, "date")}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отказ</Button>
            <Button onClick={save}>Запази</Button>
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
                if (toDelete) setUsers((l) => l.filter((u) => u.id !== toDelete.id));
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
