import React from 'react';
import { Badge } from "@/components/ui/badge.jsx";
import { Play, History, CheckSquare, XSquare, CalendarClock } from 'lucide-react';

const GameStatusBadge = ({ status }) => {
  let variant;
  let icon;
  switch (status) {
    case 'En curso':
      variant = 'default';
      icon = <Play className="mr-1 h-3 w-3" />;
      break;
    case 'Finalizada':
      variant = 'secondary';
      icon = <CheckSquare className="mr-1 h-3 w-3" />;
      break;
    case 'Cancelada':
      variant = 'destructive';
      icon = <XSquare className="mr-1 h-3 w-3" />;
      break;
    case 'Borrador':
      variant = 'secondary';
      icon = <CalendarClock className="mr-1 h-3 w-3" />;
      break;
    default:
      variant = 'outline';
      icon = <History className="mr-1 h-3 w-3" />;
  }
  return (
    <Badge variant={variant} className="flex items-center text-xs px-2 py-0.5">
      {icon}
      {status}
    </Badge>
  );
};

export default GameStatusBadge;