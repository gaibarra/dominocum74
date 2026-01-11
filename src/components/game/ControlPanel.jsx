import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users2, LayoutList, Activity, Circle, CheckCircle2, AlertTriangle, Timer } from 'lucide-react';

const statusTone = {
  done: {
    icon: CheckCircle2,
    label: 'Completado',
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  progress: {
    icon: Activity,
    label: 'En progreso',
    badge: 'bg-sky-100 text-sky-700 border border-sky-200',
  },
  pending: {
    icon: Circle,
    label: 'Pendiente',
    badge: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
};

const MetricCard = ({ icon: Icon, label, value, footer }) => (
  <Card className="rounded-2xl border border-slate-100 shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </span>
        {label}
      </div>
      <div className="mt-4 text-3xl font-semibold text-slate-900">{value}</div>
      {footer && <div className="mt-2 text-sm text-slate-500">{footer}</div>}
    </CardContent>
  </Card>
);

const StepCard = ({ step }) => {
  const tone = statusTone[step.status] || statusTone.pending;
  const StatusIcon = tone.icon;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium">
          {step.index}
        </span>
        {step.title}
        <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${tone.badge}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          {tone.label}
        </span>
      </div>
      <p className="text-base font-semibold text-slate-900">{step.subtitle}</p>
      <p className="text-sm text-slate-500">{step.description}</p>
      {step.action && (
        <Button variant="ghost" size="sm" className="justify-start px-0 text-sky-600 hover:text-sky-700" onClick={step.action.onClick}>
          {step.action.label}
        </Button>
      )}
    </div>
  );
};

export function ControlPanel({ metrics, steps, actions }) {
  return (
    <section className="mt-8 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Tablero de control</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Estado operativo de la velada</h2>
          <p className="text-sm text-slate-500">Supervisa asistencia, mesas activas y avanza por los pasos sugeridos para cerrar la noche sin pendientes.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" className="rounded-2xl" onClick={actions?.scrollAttendance}>Pasar lista</Button>
          <Button className="rounded-2xl" onClick={actions?.createTable}>Crear nueva mesa</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={Users2}
          label="Jugadores presentes"
          value={`${metrics.presentCount}`}
          footer={`${metrics.benchCount} sin mesa · ${metrics.totalPlayers || metrics.presentCount} registrados`}
        />
        <MetricCard
          icon={LayoutList}
          label="Mesas activas"
          value={`${metrics.activeTables}/${metrics.targetTables}`}
          footer={`${metrics.finishedTables} finalizadas · meta ${metrics.targetTables}`}
        />
        <MetricCard
          icon={Activity}
          label="Manos registradas"
          value={metrics.handsLogged}
          footer={metrics.lastHandAt ? `Última mano hace ${metrics.lastHandAt}` : 'Registra la primera mano'}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {steps.map((step) => (
          <StepCard key={step.index} step={step} />
        ))}
      </div>

      {metrics.alert && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5" />
          {metrics.alert}
        </div>
      )}

      {metrics.nextClosing && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Timer className="h-4 w-4" />
          {metrics.nextClosing}
        </div>
      )}
    </section>
  );
}

export default ControlPanel;
