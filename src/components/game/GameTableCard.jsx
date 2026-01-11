// components/game/GameTableCard.jsx
import React from "react";
// Efectos eliminados según nueva UX; se usará un modal de confirmación.
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// @ts-ignore
import { Input } from "@/components/ui/input";
// @ts-ignore
import { Label } from "@/components/ui/label";
// @ts-ignore
import { Button } from "@/components/ui/button";
import { Plus, Trophy, Edit3, Clock, Trash2 } from "lucide-react";
import { computePairTotals } from "@/lib/gameCalculations";

/**
 * @typedef {Object} Hand
 * @property {string|number=} id
 * @property {number} hand_number
 * @property {number=} pair_1_score
 * @property {number=} pair_2_score
 * @property {number=} duration_seconds
 */

/**
 * @typedef {Object} Table
 * @property {string|number} id
 * @property {number|string} table_number
 * @property {boolean} partidaFinished
 * @property {number=} points_to_win_partida
 * @property {{ id?: string|number, players: (string|number)[] }[]} pairs
 * @property {Hand[]=} hands
 * @property {number=} games_won_pair1
 * @property {number=} games_won_pair2
 */

/**
 * @param {{ playerId: string|number, playersData: Record<string|number, any> }} props
 */
const PlayerDisplay = ({ playerId, playersData }) => {
  /** @type {any} */ const AvatarC = Avatar;
  /** @type {any} */ const AvatarImageC = AvatarImage;
  /** @type {any} */ const AvatarFallbackC = AvatarFallback;
  const player = playersData[playerId];
  if (!player) {
    return React.createElement(
      "div",
      { className: "my-1 text-muted-foreground" },
      "Jugador Desc."
    );
  }
  return React.createElement(
    "div",
    { className: "flex items-center space-x-2 my-1" },
    React.createElement(
  AvatarC,
      { className: "h-8 w-8" },
  React.createElement(AvatarImageC, { src: player.photo, alt: player.nickname }),
  React.createElement(AvatarFallbackC, null, player.nickname?.[0])
    ),
    React.createElement("span", { className: "font-medium" }, player.nickname)
  );
};

/**
 * @param {number} seconds
 */
const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return "-";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return `${m}m ${seconds % 60}s`;
};

/**
 * @param {{
 *  table: Table,
 *  gameStatus: string,
 *  playersData: Record<string|number, any>,
 *  currentHandScores: { pair1?: string|number, pair2?: string|number },
 *  onScoreChange: (pairKey: "pair1"|"pair2", value: string|number) => void,
 *  onAddHand: (tableId: string|number) => void,
 *  onEditHand: (tableId: string|number, handId: string|number) => void,
 *  onFinishTable: (tableId: string|number) => void,
 *  onCancelTable?: (tableId: string|number) => void,
 * }} props
 */
export default function GameTableCard({
  table,
  gameStatus,
  playersData,
  currentHandScores,
  onScoreChange,    // firma: (pairKey, value) => void
  onAddHand,
  onEditHand,
  onFinishTable,
  onCancelTable,
}) {
  /** @type {any} */ const CardC = Card;
  /** @type {any} */ const CardHeaderC = CardHeader;
  /** @type {any} */ const CardTitleC = CardTitle;
  /** @type {any} */ const CardContentC = CardContent;
  /** @type {any} */ const InputC = Input;
  /** @type {any} */ const LabelC = Label;
  /** @type {any} */ const ButtonC = Button;
  const { pair1: pair1Total, pair2: pair2Total, target, hands: safeHands } = computePairTotals(table);
  const pairTotals = [pair1Total, pair2Total];
  const isFinished = pair1Total >= target || pair2Total >= target;

  const scores = currentHandScores || { pair1: "", pair2: "" };

  // Auto-sugerir cierre: cuando detectamos que se alcanzó el objetivo y aún no está marcada como finalizada,
  // disparamos onFinishTable una sola vez para abrir la confirmación. Si los puntos vuelven a bajar,
  // rearmamos el trigger para evitar modales fantasma.
  const promptedRef = React.useRef(false);
  React.useEffect(() => {
    if (!isFinished) {
      promptedRef.current = false;
      return;
    }
    if (!promptedRef.current && !table.partidaFinished && typeof onFinishTable === "function") {
      promptedRef.current = true;
      onFinishTable(table.id);
    }
  }, [isFinished, table.partidaFinished, onFinishTable, table?.id]);

  return React.createElement(
    CardC,
    { className: "glassmorphism-card shadow-lg overflow-hidden" },
    React.createElement(
      CardHeaderC,
      { className: "bg-slate-50 dark:bg-slate-800/30" },
      React.createElement(
        CardTitleC,
        { className: "flex justify-between items-center text-xl" },
        React.createElement(
          "span",
          { className: "gradient-text font-bold" },
          `Mesa ${table.table_number}`
        ),
        (table.games_won_pair1 > 0 || table.games_won_pair2 > 0) &&
          React.createElement(
            "div",
            { className: "flex items-center text-sm font-normal" },
            React.createElement(Trophy, { className: "h-4 w-4 mr-1 text-yellow-500" }),
            React.createElement(
              "span",
              null,
              `P1: ${table.games_won_pair1 || 0} / P2: ${table.games_won_pair2 || 0}`
            )
          )
      )
    ),
    React.createElement(
  CardContentC,
      { className: "p-4" },
      // Pairs grid
      React.createElement(
        "div",
        { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4" },
        table.pairs.map((/** @type {any} */ pair, /** @type {number} */ idx) => {
          const total = pairTotals[idx] || 0;
          const won = total >= target;
          return React.createElement(
            "div",
            {
              key: pair.id || idx,
              className:
                `p-3 rounded-lg border-2 transition-all duration-300 ` +
                (won ? "border-yellow-400 bg-yellow-400/10 shadow-md" : "border-primary/30 bg-background/20"),
            },
            React.createElement(
              "div",
              { className: "flex justify-between items-center mb-2" },
              React.createElement("h4", { className: "font-semibold text-lg text-primary" }, `Pareja ${idx + 1}`),
              React.createElement(
                "span",
                { className: `font-bold text-2xl ${won ? "text-yellow-500" : "text-foreground"}` },
                total
              )
            ),
            React.createElement(PlayerDisplay, { playerId: pair.players[0], playersData }),
            React.createElement(PlayerDisplay, { playerId: pair.players[1], playersData })
          );
        })
      ),

      // Registrar Mano Actual (si no terminó)
      !isFinished &&
        gameStatus !== "Finalizada" &&
        React.createElement(
          "div",
          { className: "mt-4 p-4 border-t border-primary/10" },
          React.createElement(
            "h4",
            { className: "font-semibold mb-3 text-lg text-center text-secondary" },
            "Registrar Mano Actual"
          ),
          React.createElement(
            "div",
            { className: "grid grid-cols-2 gap-3 items-end" },
            // Puntos Pareja 1
            React.createElement(
              "div",
              null,
              React.createElement(
                LabelC,
                { htmlFor: `t${table.id}-p1`, className: "text-sm" },
                "Puntos Pareja 1"
              ),
              React.createElement(InputC, {
                id: `t${table.id}-p1`,
                type: "text",
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 3,
                min: "0",
                step: "1",
                value: scores.pair1 ?? "",
                onChange: (/** @type {any} */ e) => onScoreChange("pair1", e.target.value),
                className: "text-center text-xl h-12 neumorphism-input-inset",
                placeholder: "0",
              })
            ),
            // Puntos Pareja 2
            React.createElement(
              "div",
              null,
              React.createElement(
                LabelC,
                { htmlFor: `t${table.id}-p2`, className: "text-sm" },
                "Puntos Pareja 2"
              ),
              React.createElement(InputC, {
                id: `t${table.id}-p2`,
                type: "text",
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 3,
                min: "0",
                step: "1",
                value: scores.pair2 ?? "",
                onChange: (/** @type {any} */ e) => onScoreChange("pair2", e.target.value),
                className: "text-center text-xl h-12 neumorphism-input-inset",
                placeholder: "0",
              })
            )
          ),
          React.createElement(
            "div",
            { className: "flex flex-col gap-2 mt-4" },
            React.createElement(
              ButtonC,
              {
                onClick: () => onAddHand(table.id),
                className: "w-full neumorphism-button bg-gradient-to-r from-secondary to-purple-600 text-white",
              },
              React.createElement(Plus, { className: "mr-2 h-5 w-5" }),
              " Agregar Mano"
            ),
            onCancelTable &&
              React.createElement(
                ButtonC,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => onCancelTable(table.id),
                  className: "w-full border-destructive/40 text-destructive hover:bg-destructive/10",
                },
                React.createElement(Trash2, { className: "mr-2 h-4 w-4" }),
                "Cancelar Mesa"
              )
          )
        ),

      // Cerrar Partida (si terminó)
      isFinished &&
        gameStatus !== "Finalizada" &&
        React.createElement(
          "div",
          { className: "mt-4 p-4 text-center border-t border-primary/10" },
          React.createElement(
            "p",
            { className: "text-lg font-semibold text-green-600 mb-3" },
            "¡Partida finalizada en esta mesa!"
          ),
          React.createElement(
            ButtonC,
            { onClick: () => onFinishTable?.(table.id), className: "neumorphism-button bg-primary text-primary-foreground" },
            "Cerrar Partida"
          )
        ),

      // Historial de Manos
      safeHands.length > 0 &&
        React.createElement(
          "div",
          { className: "mt-6" },
          React.createElement(
            "h4",
            { className: "font-semibold mb-2 text-md text-muted-foreground" },
            "Historial de Manos:"
          ),
          React.createElement(
            "div",
            { className: "max-h-48 overflow-y-auto space-y-1 pr-2 rounded-md bg-slate-100 dark:bg-slate-700/50 p-2" },
            safeHands
              .slice()
              .reverse()
              .map((/** @type {Hand} */ hand, /** @type {number} */ revIdx) =>
                React.createElement(
                  "div",
                  {
                    key: hand.id ?? revIdx,
                    className:
                      "flex justify-between items-center p-1.5 bg-background/50 rounded-md text-xs hover:bg-primary/5 transition-colors",
                  },
                  React.createElement("div", { className: "flex-1" }, `Mano ${hand.hand_number}:`),
                  React.createElement("div", { className: "flex-1 text-center" }, `P1: ${hand.pair_1_score} pts`),
                  React.createElement("div", { className: "flex-1 text-center" }, `P2: ${hand.pair_2_score} pts`),
                  React.createElement(
                    "div",
                    { className: "flex-1 text-center flex items-center justify-center" },
                    hand.duration_seconds !== null &&
                      hand.duration_seconds !== undefined &&
                      React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(Clock, { className: "h-3 w-3 mr-1 text-muted-foreground" }),
                        formatDuration(hand.duration_seconds)
                      )
                  ),
                  gameStatus !== "Finalizada" &&
                    React.createElement(
                      ButtonC,
                      {
                        variant: "ghost",
                        size: "sm",
                        className: "p-1 h-auto",
                        onClick: () => onEditHand(table.id, /** @type {string|number} */ (hand.id ?? revIdx)),
                      },
                      React.createElement(Edit3, { className: "h-3 w-3 text-blue-500" })
                    )
                )
              )
          )
        )
    )
  );
}