// components/game/GameTablesDisplay.jsx
import React, { useMemo, useState, Suspense, lazy, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
const GameTableCard = lazy(() => import("./GameTableCard"));

// Hoisted component to keep identity stable across renders and avoid remounting (which causes input blur)
const TableCardMountNotifier = (props) => {
  useEffect(() => {
    props.onMounted?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Forward all props except onMounted to the actual card
  const { onMounted, ...rest } = props;
  void onMounted; // avoid unused binding lint
  // @ts-ignore props forwarded
  return React.createElement(GameTableCard, { ...rest });
};

/**
 * @typedef {Object} Hand
 * @property {number} hand_number
 * @property {number=} pair_1_score
 * @property {number=} pair_2_score
 */

/**
 * @typedef {Object} Table
 * @property {string|number} id
 * @property {number|string} table_number
 * @property {boolean} partidaFinished
 * @property {Hand[]=} hands
 */

const cardVariants = {
  hidden: (/** @type {number} */ i) => ({ opacity: 0, y: 50, transition: { delay: i * 0.1 } }),
  visible: (/** @type {number} */ i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
  exit: (/** @type {number} */ i) => ({
    opacity: 0,
    y: -50,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

/**
 * @param {{
 *  tables: Table[],
 *  playersData: any,
 *  currentHandScores: Record<string | number, any>,
 *  onScoreChange: (tableId: string|number, pairKey: string, value: number) => void,
 *  onSaveHand: (tableId: string|number) => void,
 *  onEditHand: (tableId: string|number, handId: string|number) => void,
 *  onFinishTable: (tableId: string|number) => void,
 *  onCancelTable?: (tableId: string|number) => void,
 *  gameStatus: any,
 *  showFinishedTables: boolean,
 *  selectedTableId?: string|number|null,
 * }} props
 */
export default function GameTablesDisplay({
  tables,
  playersData,
  currentHandScores,
  onScoreChange,   // recibe (tableId, pairKey, value)
  onSaveHand,
  onEditHand,
  onFinishTable,
  onCancelTable,
  gameStatus,
  showFinishedTables,
  selectedTableId,
}) {
  const filteredTables = useMemo(
    () =>
      tables.filter((/** @type {Table} */ table) =>
        showFinishedTables ? table.partidaFinished : !table.partidaFinished
      ),
    [tables, showFinishedTables]
  );

  const [activeTab, setActiveTab] = useState(() => filteredTables[0]?.id ?? null);
  const [isTabLoading, setIsTabLoading] = useState(false);
  /** @type {[{table: Table}|null, React.Dispatch<React.SetStateAction<{table: Table}|null>>]} */
  // @ts-ignore
  const [confirmData, setConfirmData] = useState(null); // { table }
  const [cancelData, setCancelData] = useState(null);

  useEffect(() => {
    // Si hay una mesa seleccionada desde arriba y está en el subconjunto filtrado, enfocarla
    if (selectedTableId && filteredTables.find((/** @type {Table} */ t) => t.id === selectedTableId)) {
      setActiveTab(selectedTableId);
      return;
    }
    // Si la pestaña activa dejó de existir por el filtro, seleccionar la primera disponible
    if (!filteredTables.find((/** @type {Table} */ t) => t.id === activeTab)) {
      setActiveTab(filteredTables[0]?.id ?? null);
    }
  }, [filteredTables, activeTab, selectedTableId]);

  /**
   * @param {string|number} id
   */
  const onSelectTab = (id) => {
    if (id === activeTab) return;
    setActiveTab(id);
    setIsTabLoading(true);
  };

  // (Mount notifier hoisted above)

  if (!tables.length) {
    return React.createElement(
      "div",
      { className: "text-center py-10 border-2 border-dashed border-border rounded-lg bg-muted/30" },
      React.createElement(
        "p",
        { className: "text-muted-foreground text-lg" },
        "No hay mesas configuradas para esta velada."
      )
    );
  }

  if (!filteredTables.length) {
    return React.createElement(
      "div",
      { className: "text-center py-10 border-2 border-dashed border-border rounded-lg bg-muted/30" },
      React.createElement(
        "p",
        { className: "text-muted-foreground text-lg" },
        showFinishedTables
          ? "No hay partidas finalizadas para mostrar."
          : "No hay partidas en curso para mostrar."
      ),
      React.createElement(
        "p",
        { className: "text-muted-foreground text-sm mt-2" },
        showFinishedTables
          ? "Activa 'Ver Partidas En Curso' para ver mesas activas."
          : "Activa 'Ver Partidas Finalizadas' si alguna mesa completó partida."
      )
    );
  }

  /**
   * @param {string|number} tableId
   */
  const requestFinish = (tableId) => {
    const t = tables.find((/** @type {Table} */ x) => x.id === tableId);
    if (!t) return;
    setConfirmData({ table: t });
  };

  const confirmFinish = () => {
    if (!confirmData?.table) return;
    onFinishTable(confirmData.table.id);
    setConfirmData(null);
  };

  const requestCancel = (tableId) => {
    const t = tables.find((/** @type {Table} */ x) => x.id === tableId);
    if (!t) return;
    setCancelData({ table: t, password: "", error: null });
  };

  const confirmCancel = () => {
    if (!cancelData?.table) return;
    const isValid = (cancelData.password || "").trim() === "bacanora2024";
    if (!isValid) {
      setCancelData((prev) => (prev ? { ...prev, error: "Contraseña incorrecta." } : prev));
      return;
    }
    onCancelTable?.(cancelData.table.id);
    setCancelData(null);
  };

  return React.createElement(
    "div",
    null,
    // Tabs header
    React.createElement(
      "div",
      { className: "flex flex-wrap gap-2 mb-4" },
      filteredTables.map((/** @type {Table} */ t) =>
        React.createElement(
          "button",
          {
            key: t.id,
            onClick: () => onSelectTab(t.id),
            className:
              `px-3 py-1 rounded-md border text-sm ${
                activeTab === t.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-foreground hover:bg-muted"
              }`,
          },
          `Mesa ${t.table_number}`,
          activeTab === t.id &&
            isTabLoading &&
            React.createElement(Loader2, {
              className: "inline-block ml-2 h-3.5 w-3.5 animate-spin opacity-70 align-[-2px]",
            })
        )
      )
    ),
    React.createElement(
      motion.div,
      { initial: "hidden", animate: "visible" },
      filteredTables.map((/** @type {Table} */ table, /** @type {number} */ idx) =>
        React.createElement(
          "div",
          { key: table.id, hidden: activeTab !== table.id },
          React.createElement(
            motion.div,
            { custom: idx, variants: cardVariants, layout: true },
            React.createElement(
              Suspense,
              {
                fallback: React.createElement(
                  "div",
                  { className: "py-8 text-center text-muted-foreground" },
                  "Cargando mesa…"
                ),
              },
              React.createElement(TableCardMountNotifier, {
                table,
                playersData,
                currentHandScores: currentHandScores[table.id] || {},
                onScoreChange: (/** @type {string} */ pairKey, /** @type {number} */ value) =>
                  onScoreChange(table.id, pairKey, value),
                onAddHand: () => onSaveHand(table.id),
                onEditHand: (/** @type {any} */ _, /** @type {string|number} */ hId) =>
                  onEditHand(table.id, hId),
                onFinishTable: () => requestFinish(table.id),
                onCancelTable: () => requestCancel(table.id),
                gameStatus,
                onMounted: () => setIsTabLoading(false),
              })
            )
          )
        )
      )
    ),

    // Modal de confirmación de cierre
    confirmData &&
      React.createElement(
        "div",
        { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" },
        React.createElement(
          "div",
          { className: "w-full max-w-lg rounded-lg bg-background shadow-xl border p-4" },
          React.createElement(
            "h3",
            { className: "text-lg font-semibold mb-2" },
            `Confirmar cierre de Partida (Mesa ${confirmData.table.table_number})`
          ),
          React.createElement(
            "p",
            { className: "text-sm text-muted-foreground mb-3" },
            "Revisa la última mano y puntajes. Si hubo un error en la mano final, corrígelo antes de confirmar. Luego no se harán ajustes automáticos."
          ),
          React.createElement(
            "div",
            { className: "rounded-md bg-muted p-3 text-sm mb-3" },
            React.createElement(
              "div",
              { className: "flex justify-between" },
              React.createElement("span", null, "Pareja 1 (total):"),
              React.createElement(
                "strong",
                null,
                (confirmData.table.hands || []).reduce(
                  (/** @type {number} */ s, /** @type {Hand} */ h) => s + (h.pair_1_score || 0),
                  0
                )
              )
            ),
            React.createElement(
              "div",
              { className: "flex justify-between" },
              React.createElement("span", null, "Pareja 2 (total):"),
              React.createElement(
                "strong",
                null,
                (confirmData.table.hands || []).reduce(
                  (/** @type {number} */ s, /** @type {Hand} */ h) => s + (h.pair_2_score || 0),
                  0
                )
              )
            ),
            confirmData.table.hands?.length > 0 &&
              React.createElement(
                "div",
                { className: "mt-2" },
                React.createElement("div", { className: "font-medium" }, "Última Mano"),
                (() => {
                  const h = confirmData.table.hands[confirmData.table.hands.length - 1];
                  return React.createElement(
                    "div",
                    { className: "flex justify-between text-xs" },
                    React.createElement("span", null, `Mano ${h.hand_number}`),
                    React.createElement("span", null, `P1: ${h.pair_1_score} | P2: ${h.pair_2_score}`)
                  );
                })()
              )
          ),
          React.createElement(
            "div",
            { className: "flex justify-end gap-2" },
            React.createElement(
              "button",
              { className: "px-3 py-1.5 rounded-md border", onClick: () => setConfirmData(null) },
              "Cancelar"
            ),
            React.createElement(
              "button",
              {
                className: "px-3 py-1.5 rounded-md bg-primary text-primary-foreground",
                onClick: confirmFinish,
              },
              "Confirmar cierre"
            )
          )
        )
      )

    ,

    cancelData &&
      React.createElement(
        "div",
        { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" },
        React.createElement(
          "div",
          { className: "w-full max-w-lg rounded-lg bg-background shadow-xl border p-4 space-y-3" },
          React.createElement(
            "h3",
            { className: "text-lg font-semibold" },
            `Cancelar Mesa ${cancelData.table.table_number}`
          ),
          React.createElement(
            "p",
            { className: "text-sm text-muted-foreground" },
            "Esta acción eliminará todas las manos registradas y liberará a los jugadores. No aparecerá en las estadísticas. ¿Deseas continuar?"
          ),
          cancelData.table.hands?.length > 0 &&
            React.createElement(
              "div",
              { className: "rounded-md bg-muted/50 p-3 text-sm" },
              `${cancelData.table.hands.length} mano(s) serán eliminadas.`
            ),
          React.createElement(
            "div",
            { className: "space-y-2" },
            React.createElement(
              "label",
              { className: "text-sm font-medium" },
              'Escribe "bacanora2024" para confirmar'
            ),
            React.createElement("input", {
              type: "password",
              className:
                "w-full rounded-md border border-border bg-background/80 px-3 py-2 text-sm focus:border-primary focus:outline-none",
              placeholder: "Contraseña de confirmación",
              value: cancelData.password,
              onChange: (event) => setCancelData((prev) => (prev ? { ...prev, password: event.target.value, error: null } : prev)),
            }),
            cancelData.error &&
              React.createElement(
                "p",
                { className: "text-sm text-destructive" },
                cancelData.error
              )
          ),
          React.createElement(
            "div",
            { className: "flex justify-end gap-2" },
            React.createElement(
              "button",
              { className: "px-3 py-1.5 rounded-md border", onClick: () => setCancelData(null) },
              "Volver"
            ),
            React.createElement(
              "button",
              {
                className: "px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed",
                onClick: confirmCancel,
                disabled: (cancelData.password || "").trim() !== "bacanora2024",
              },
              "Eliminar Mesa"
            )
          )
        )
      )
  );
}