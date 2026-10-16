import { createFileRoute, redirect } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateDisplay } from "@/components/DatePicker";
import { USERNAME_RE } from "@/lib/auth";
import { listGroups } from "@/lib/groups.functions";
import {
  listAuthUsers, createAuthUser, updateAuthUser, deleteAuthUser, setAuthUserPassword, type AuthUser,
} from "@/lib/auth-users.functions";

const usersQuery = queryOptions({ queryKey: ["auth_users"], queryFn: () => listAuthUsers() });
const groupsQuery = queryOptions({ queryKey: ["groups"], queryFn: () => listGroups() });

export const Route = createFileRoute("/_authenticated/nastroyki-potrebiteli")({
  beforeLoad: async () => {
    const { data } = await supabase.rpc("current_user_is_admin");
    if (data !== true) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Потребители за вход — Фирма ЕООД" },
      { name: "description", content: "Управление на профилите за вход." },
      { property: "og:title", content: "Потребители за вход — Фирма ЕООД" },
      { property: "og:description", content: "Управление на профилите за вход." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(usersQuery),
    context.queryClient.ensureQueryData(groupsQuery),
  ]),
  component: AuthUsersPage,
});

type Row = AuthUser & { groupName: string };
type Key = "username" | "groupName" | "createdAt" | "lastSignIn";
const columns: { key: Key; label: string; date?: boolean }[] = [
  { key: "username", label: "Юзернейм" },
  { key: "groupName", label: "Група" },
  { key: "createdAt", label: "Създаден", date: true },
  { key: "lastSignIn", label: "Последен вход", date: true },
];

function AuthUsersPage() {
  const qc = useQueryClient();
  const { data: users } = useSuspenseQuery(usersQuery);
  const { data: groups } = useSuspenseQuery(groupsQuery);
  const [sort, setSort] = useState<{ key: Key; dir: "asc" | "desc" }>({ key: "username", dir: "asc" });
  const [filters, setFilters] = useState<Partial<Record<Key, string>>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [uname, setUname] = useState("");
  const [pwd, setPwd] = useState("");
  const [gid, setGid] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [pwdUser, setPwdUser] = useState<Row | null>(null);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [pErr, setPErr] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["auth_users"] });

  const rows = useMemo(() => {
    const all: Row[] = users.map((u) => ({ ...u, groupName: groups.find((g) => g.id === u.groupId)?.name ?? "" }));
    const disp = (r: Row, k: Key) => (k === "createdAt" || k === "lastSignIn" ? formatDateDisplay(r[k]) : r[k]);
    return all
      .filter((r) => columns.every(({ key }) => {
        const f = filters[key]?.trim().toLowerCase();
        return !f || disp(r, key).toLowerCase().includes(f);
      }))
      .sort((a, b) => {
        const c = String(a[sort.key]).localeCompare(String(b[sort.key]), "bg");
        return sort.dir === "asc" ? c : -c;
      });
  }, [users, groups, filters, sort]);

  const toggleSort = (key: Key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  function openForm(r: Row | null) {
    setEditing(r); setUname(r?.username ?? ""); setPwd("");
    setGid(String(r?.groupId ?? groups.find((g) => g.name === "normal")?.id ?? groups[0]?.id ?? ""));
    setErrs({}); setOpen(true);
  }

  async function save() {
    const e: Record<string, string> = {};
    const u = uname.trim();
    if (!u) e.username = "Задължително поле";
    else if (!USERNAME_RE.test(u)) e.username = "Само латински букви, цифри, точка и тире";
    else if (users.some((x) => x.username.toLowerCase() === u.toLowerCase() && x.id !== editing?.id))
      e.username = "Юзернеймът вече съществува";
    if (!editing && pwd.length < 6) e.password = "Поне 6 символа";
    if (!gid) e.group = "Изберете група";
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      if (editing) await updateAuthUser({ data: { id: editing.id, username: u, groupId: Number(gid) } });
      else await createAuthUser({ data: { username: u, password: pwd, groupId: Number(gid) } });
      await refresh();
      setOpen(false);
      toast.success(editing ? "Потребителят е обновен" : "Потребителят е добавен");
    } catch (err) {
      if (err instanceof Error && err.message.includes("DUPLICATE_USERNAME")) setErrs({ username: "Юзернеймът вече съществува" });
      else toast.error("Грешка при запис. Опитайте отново.");
    } finally { setBusy(false); }
  }

  async function changePassword() {
    if (p1.length < 6) return setPErr("Поне 6 символа");
    if (p1 !== p2) return setPErr("Паролите не съвпадат");
    if (!pwdUser) return;
    setBusy(true);
    try {
      await setAuthUserPassword({ data: { id: pwdUser.id, password: p1 } });
      setPwdUser(null);
      toast.success("Паролата е сменена");
    } catch { toast.error("Грешка при смяна на паролата"); }
    finally { setBusy(false); }
  }

  async function remove(r: Row) {
    try {
      await deleteAuthUser({ data: { id: r.id } });
      await refresh();
      toast.success("Потребителят е изтрит");
    } catch (err) {
      toast.error(err instanceof Error && err.message.includes("SELF_DELETE")
        ? "Не можете да изтриете собствения си профил" : "Грешка при изтриване");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">Потребители за вход</h1>
        <Button onClick={() => openForm(null)}><Plus className="h-4 w-4" /> Добавяне</Button>
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
              <TableHead>Парола</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              {columns.map(({ key, date }) => (
                <TableHead key={key} className="py-2">
                  <Input className="h-8" placeholder={date ? "дд.мм.гггг" : "Филтър..."}
                    value={filters[key] ?? ""} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })} />
                </TableHead>
              ))}
              <TableHead /><TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Няма намерени потребители.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.username}</TableCell>
                <TableCell>{r.groupName}</TableCell>
                <TableCell>{formatDateDisplay(r.createdAt)}</TableCell>
                <TableCell>{formatDateDisplay(r.lastSignIn)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => { setPwdUser(r); setP1(""); setP2(""); setPErr(""); }}>
                    <KeyRound className="h-4 w-4" /> Смяна
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" aria-label="Редактиране" onClick={() => openForm(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Изтриване" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? `Редактиране на ${editing.username}` : "Нов потребител за вход"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="un">Юзернейм<span className="text-destructive"> *</span></Label>
              <Input id="un" maxLength={100} value={uname} onChange={(e) => setUname(e.target.value)} />
              {errs.username && <p className="text-sm text-destructive">{errs.username}</p>}
            </div>
            {!editing && (
              <div className="grid gap-1.5">
                <Label htmlFor="pw">Парола<span className="text-destructive"> *</span></Label>
                <Input id="pw" type="password" maxLength={72} value={pwd} onChange={(e) => setPwd(e.target.value)} />
                {errs.password && <p className="text-sm text-destructive">{errs.password}</p>}
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>Група<span className="text-destructive"> *</span></Label>
              <Select value={gid} onValueChange={setGid}>
                <SelectTrigger><SelectValue placeholder="Изберете група" /></SelectTrigger>
                <SelectContent>
                  {groups.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errs.group && <p className="text-sm text-destructive">{errs.group}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отказ</Button>
            <Button onClick={save} disabled={busy}>Запази</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwdUser} onOpenChange={(o) => !o && setPwdUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Смяна на паролата на {pwdUser?.username}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="p1">Нова парола</Label>
              <Input id="p1" type="password" maxLength={72} value={p1} onChange={(e) => setP1(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p2">Повторете паролата</Label>
              <Input id="p2" type="password" maxLength={72} value={p2} onChange={(e) => setP2(e.target.value)} />
            </div>
            {pErr && <p className="text-sm text-destructive">{pErr}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdUser(null)}>Отказ</Button>
            <Button onClick={changePassword} disabled={busy}>Смени</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на потребител</AlertDialogTitle>
            <AlertDialogDescription>Сигурни ли сте, че искате да изтриете {toDelete?.username}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (toDelete) void remove(toDelete); setToDelete(null); }}>Изтрий</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
