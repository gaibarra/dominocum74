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
  { key: "totalPoints", label: "Puntos Totales", align: "text-center" },
  { key: "pointsPerGame", label: "Pts/Partida", align: "text-center" },
  { key: "winRate", label: "% Victorias", align: "text-center" },
];

const PairStatsTable = ({ pairStats = [], getPlayerInfo, sortConfig, onSortChange }) => {
  const handleSort = (key) => {
    if (typeof onSortChange === "function") {
      onSortChange(key);
    }
  };

  if (!pairStats.length) {
    return <p className="text-sm text-center text-muted-foreground">Todavía no hay parejas con partidas registradas.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="whitespace-nowrap">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                onClick={() => handleSort("pairLabel")}
              >
                Pareja
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
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
          {pairStats.map((pair, index) => {
            const player1 = getPlayerInfo(pair.playerIds?.[0]) || {};
            const player2 = getPlayerInfo(pair.playerIds?.[1]) || {};
            return (
              <TableRow key={`${pair.playerIds?.join('-') || index}`} className="transition-colors hover:bg-secondary/5">
                <TableCell className="font-semibold">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={resolvePublicMediaUrl(player1.photo)} alt={player1.nickname} />
                      <AvatarFallback>{player1.nickname?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player1.nickname || '¿?'}</span>
                    <span className="text-muted-foreground">&</span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={resolvePublicMediaUrl(player2.photo)} alt={player2.nickname} />
                      <AvatarFallback>{player2.nickname?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player2.nickname || '¿?'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">{numberFormatter.format(pair.gamesPlayed)}</TableCell>
                <TableCell className="text-center font-bold text-green-600">{numberFormatter.format(pair.wins)}</TableCell>
                <TableCell className="text-center">{numberFormatter.format(pair.totalPoints)}</TableCell>
                <TableCell className="text-center">{decimalFormatter.format(pair.pointsPerGame || 0)}</TableCell>
                <TableCell className="text-center">{decimalFormatter.format(pair.winRate || 0)}%</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PairStatsTable;