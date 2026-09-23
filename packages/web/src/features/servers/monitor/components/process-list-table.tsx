import { useMemo, useState } from "react";
import { CloseCircle, SearchNormal1 } from "iconsax-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import type { ProcessInfo } from "@termloop/shared";
import { useProcesses, useKillProcess } from "../hooks/use-processes";

type SortKey = "cpuPercent" | "memPercent" | "memoryMB" | "pid";

interface ProcessListTableProps {
  connectionId: string;
}

export function ProcessListTable({ connectionId }: ProcessListTableProps) {
  const { data, isLoading } = useProcesses(connectionId);
  const killMutation = useKillProcess(connectionId);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("cpuPercent");

  const processes = (data?.data as ProcessInfo[] | undefined) ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? processes.filter(
          (p) => p.command.toLowerCase().includes(q) || String(p.pid).includes(q) || p.user.toLowerCase().includes(q)
        )
      : processes;
    return [...list].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [processes, query, sortKey]);

  const handleKill = (proc: ProcessInfo) => {
    killMutation.mutate(proc.pid, {
      onSuccess: (result) => {
        if (result.data && result.data.code !== 0) {
          toast({
            variant: "destructive",
            title: `Couldn't quit "${proc.command}"`,
            description: result.data.stderr || `kill exited with code ${result.data.code}`,
          });
        }
      },
    });
  };

  const sortHeader = (key: SortKey, label: string) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground"
      onClick={() => setSortKey(key)}
    >
      {label}
      {sortKey === key && <span className="ml-1">▾</span>}
    </TableHead>
  );

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <SearchNormal1
          size={14}
          color="currentColor"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search processes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 pl-8 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process Name</TableHead>
                {sortHeader("cpuPercent", "% CPU")}
                {sortHeader("memPercent", "% Memory")}
                {sortHeader("memoryMB", "Memory")}
                {sortHeader("pid", "PID")}
                <TableHead>User</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No processes found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.pid} className="group">
                  <TableCell className="font-medium truncate max-w-[220px]">{p.command}</TableCell>
                  <TableCell>{p.cpuPercent.toFixed(1)}%</TableCell>
                  <TableCell>{p.memPercent.toFixed(1)}%</TableCell>
                  <TableCell>{p.memoryMB} MB</TableCell>
                  <TableCell className="text-muted-foreground">{p.pid}</TableCell>
                  <TableCell className="text-muted-foreground">{p.user}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      title="Force Quit"
                      disabled={killMutation.isPending}
                      onClick={() => handleKill(p)}
                    >
                      <CloseCircle size={16} color="currentColor" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
