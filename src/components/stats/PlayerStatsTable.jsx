import React from "react";
import { ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolvePublicMediaUrl } from "@/lib/mediaStorage";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("es-MX");
const decimalFormatter = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const columns = [
  { key: "gamesPlayed", label: "Partidas", align: "text-center" },
  { key: "wins", label: "Victorias", align: "text-center" },
  { key: "losses", label: "Perdidas", align: "text-center" },
  { key: "handsPlayed", label: "Manos", align: "text-center" },
  { key: "totalPoints", label: "Puntos Totales", align: "text-center" },
  { key: "pointsPerGame", label: "Pts/Partida", align: "text-center" },
  { key: "winRate", label: "% Victorias", align: "text-center" },
];

const PlayerStatsTable = ({ playerStats = [], sortConfig, onSortChange }) => {
  const handleSort = (key) => {
    if (typeof onSortChange === "function") {
      onSortChange(key);
    }
  };

  if (!playerStats.length) {
    return <p className="text-sm text-center text-muted-foreground">Aún no hay datos para mostrar.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[880px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="min-w-[220px]">Jugador</TableHead>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(column.align, "whitespace-nowrap")}
                aria-sort={sortConfig?.field === column.key ? sortConfig.direction : "none"}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  onClick={() => handleSort(column.key)}
                >
                  {column.label}
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {playerStats.map((player, index) => {
            const losses = Math.max((player.gamesPlayed || 0) - (player.wins || 0), 0);
            return (
            <TableRow
              key={`${player.id}-${index}`}
              className={cn(
                "transition-colors",
                index === 0 && "bg-gradient-to-r from-primary/10 via-transparent",
                index === 1 && "bg-gradient-to-r from-amber-200/10",
                index === 2 && "bg-gradient-to-r from-emerald-200/10"
              )}
            >
              <TableCell className="font-semibold">{index + 1}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={resolvePublicMediaUrl(player.photo)} alt={player.nickname} />
                    <AvatarFallback>{player.nickname?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold leading-tight">{player.nickname}</div>
                    <div className="text-xs text-muted-foreground">{player.name}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">{numberFormatter.format(player.gamesPlayed)}</TableCell>
              <TableCell className="text-center font-bold text-green-600">{numberFormatter.format(player.wins)}</TableCell>
              <TableCell className="text-center font-semibold text-amber-700">{numberFormatter.format(losses)}</TableCell>
              <TableCell className="text-center">{numberFormatter.format(player.handsPlayed)}</TableCell>
              <TableCell className="text-center">{numberFormatter.format(player.totalPoints)}</TableCell>
              <TableCell className="text-center">{decimalFormatter.format(player.pointsPerGame || 0)}</TableCell>
              <TableCell className="text-center">{decimalFormatter.format(player.winRate || 0)}%</TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlayerStatsTable;