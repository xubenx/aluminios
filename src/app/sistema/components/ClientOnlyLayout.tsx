"use client";

import type { ReactNode } from "react";
import { Toolbar, Typography, Box, Drawer, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import Link from "next/link";
import WindowIcon from "@mui/icons-material/Window"; // Icono para Modelos
import ConstructionIcon from "@mui/icons-material/Construction"; // Icono para Materiales
import BuildIcon from "@mui/icons-material/Build"; // Icono para Accesorios
import GlassIcon from "@mui/icons-material/WindowOutlined"; // Icono para Vidrios
import PeopleIcon from "@mui/icons-material/People"; // Icono para Colaboradores

type Props = {
  children: ReactNode;
};

export default function ClientOnlyLayout({ children }: Props) {
  const menuItems = [
    { text: "Modelos", icon: <WindowIcon />, href: "/sistema/modelos" },
    { text: "Materiales", icon: <ConstructionIcon />, href: "/sistema/materiales" },
    { text: "Accesorios", icon: <BuildIcon />, href: "/sistema/herrajes" },
    { text: "Vidrios", icon: <GlassIcon />, href: "/sistema/vidrios" },
    { text: "Colaboradores", icon: <PeopleIcon />, href: "/sistema/colaboradores" },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Menú Lateral */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            Aluminios San Francisco
          </Typography>
        </Toolbar>
        <List>
          {menuItems.map((item, index) => (
            <ListItem
              key={index}
              component={Link}
              href={item.href}
              sx={{ textDecoration: "none", color: "inherit" }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Contenido Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "white",
          padding: 3,
        }}
      >
        <Toolbar /> {/* Espaciado para evitar que el contenido se superponga con el AppBar */}
        {children}
      </Box>
    </Box>
  );
}
