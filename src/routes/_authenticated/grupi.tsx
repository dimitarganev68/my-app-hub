import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { listGroups, saveGroup, deleteGroup, type Group } from "@/lib/groups.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const groupsQuery = queryOptions({ queryKey: ["groups"], queryFn: () => listGroups() });

export const Route = createFileRoute("/_authenticated/grupi")({
  beforeLoad: async () => {
    const { data } = await supabase.rpc("current_user_is_admin");
    if (data !== true) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Групи — Фирма ЕООД" },
      { name: "description", content: "Списък и управление на групите." },
      { property: "og:title", content: "Групи — Фирма ЕООД" },
      { property: "og:description", content: "Списък и управление на групите." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(groupsQuery),
  component: GroupsPage,
});

function GroupsPage() {
  const { data } = useSuspenseQuery(groupsQuery);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Group | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [toDelete, setToDelete] = useState<Group | null>(null);

  function openForm(g: Group | null) {
    setEditing(g); setName(g?.name ?? ""); setComment(g?.comment ?? ""); setErr(""); setOpen(true);
  }
  async function submit() {
    if (!name.trim()) return setErr("Името е задължително");
    try {
      await saveGroup({ data: { id: editing?.id, name, comment } });
      await qc.invalidateQueries({ queryKey: ["groups"] });
      setOpen(false);
      toast.success(editing ? "Групата е обновена" : "Групата е добавена");
    } catch { toast.error("Грешка при запис"); }
  }
  async function remove() {
    if (!toDelete) return;
    try {
      await deleteGroup({ data: { id: toDelete.id } });
      await qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Групата е изтрита");
    } catch { toast.error("Грешка при изтриване"); }
    setToDelete(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Групи</h1>
        <Button onClick={() => openForm(null)}><Plus className="mr-1 h-4 w-4" />Добавяне</Button>
      </div>
      <div className="mt-6 rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Име</TableHead>
              <TableHead>Коментар</TableHead>
              <TableHead className="w-28 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Няма групи</TableCell></TableRow>
            )}
            {data.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{g.id}</TableCell>
                <TableCell>{g.name}</TableCell>
                <TableCell className="text-muted-foreground">{g.comment}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" aria-label="Редактиране" onClick={() => openForm(g)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Изтриване" onClick={() => setToDelete(g)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редактиране на група" : "Нова група"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="gname">Име *</Label>
              <Input id="gname" value={name} onChange={(e) => setName(e.target.value)} />
              {err && <p className="text-sm text-destructive">{err}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="gcomment">Коментар</Label>
              <Textarea id="gcomment" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отказ</Button>
            <Button onClick={submit}>Запис</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на група</AlertDialogTitle>
            <AlertDialogDescription>Сигурни ли сте, че искате да изтриете „{toDelete?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Изтриване</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
