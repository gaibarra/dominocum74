import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, Trash2, Smartphone, Mail, ShieldQuestion, ShieldCheck, ShieldAlert } from "lucide-react";

const PlayerCard = ({ player, index, onEdit, onDelete }) => {
  const getPlayerTypeIcon = (type) => {
    if (type === "Tecnico") return <ShieldCheck className="h-5 w-5 text-green-500" />;
    if (type === "Rudo") return <ShieldAlert className="h-5 w-5 text-red-500" />;
    return <ShieldQuestion className="h-5 w-5 text-gray-500" />;
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="glassmorphism-card h-full flex flex-col overflow-hidden hover:shadow-primary/20 transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center space-x-4 p-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={player.photo} alt={player.nickname} />
            <AvatarFallback className="text-2xl bg-primary/20 text-primary">
              {player.nickname?.[0]?.toUpperCase() || player.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{player.nickname}</CardTitle>
            <CardDescription className="text-sm">{player.name}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4 space-y-2">
          {player.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mr-2 text-accent" />
              <span>{player.email}</span>
            </div>
          )}
          {player.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4 mr-2 text-accent" />
              <span>{player.phone}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            {getPlayerTypeIcon(player.playerType || player.player_type)}
            <span className="ml-2">{player.playerType || player.player_type || "No definido"}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 bg-muted/30">
          <div className="flex w-full justify-end space-x-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(player)} className="neumorphism-button">
              <Edit3 className="h-4 w-4 text-blue-500" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => onDelete(player)} className="neumorphism-button">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PlayerCard;