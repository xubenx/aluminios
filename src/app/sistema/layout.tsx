"use client";

import Head from "next/head"; // Importa Head para configurar metaetiquetas
import type { ReactNode } from "react";
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, ThemeProvider } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import WindowIcon from "@mui/icons-material/Window";
import ConstructionIcon from "@mui/icons-material/Carpenter";
import BuildIcon from "@mui/icons-material/Key";
import GlassIcon from "@mui/icons-material/WindowOutlined";
import PeopleIcon from "@mui/icons-material/People";
import ArchiveIcon from "@mui/icons-material/Archive";
import RequestQuote from "@mui/icons-material/RequestQuote";
import { useState } from "react";
import Image from "next/image";
import theme from './theme';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const menuItems = [
    { text: "Presupuestos", href: "/sistema/presupuestos", icon: <RequestQuote /> },

    { text: "Modelos", href: "/sistema/modelos", icon: <WindowIcon /> },
    { text: "Materiales", href: "/sistema/materiales", icon: <ConstructionIcon /> },
    { text: "Herrajes", href: "/sistema/herrajes", icon: <BuildIcon /> },
    { text: "Vidrios", href: "/sistema/vidrios", icon: <GlassIcon /> },
    { text: "Colaboradores", href: "/sistema/colaboradores", icon: <PeopleIcon /> },
    //{ text: "Ordenes", href: "/sistema/ordenes", icon: <ArchiveIcon /> },
  ];

  return (
    <>
      {/* Metaetiquetas para evitar indexación */}
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Imagen superior antes del AppBar */}
      <AppBar
        position="static"
        sx={{
          background: " #000000", // Degradado de blanco a azul limitado al ancho de la imagen
        }}
      >
        <Toolbar>
          {/* Imagen y texto visibles en todas las pantallas */}
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 2 }}>
            <Link href="/sistema" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>
              <Image
                src="/aluminios.svg" // Cambia esto por la ruta de tu imagen
                alt="Aluminios San Francisco"
                width={90}
                height={90}
                style={{ maxWidth: "100%", height: "auto", marginBottom: 15, marginTop: 15 }} // Ajusta el tamaño de la imagen
              />
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: { xs: "1.2rem", md: "1.25rem" }, // Ajusta el tamaño del texto según el tamaño de la pantalla
                  marginLeft: 1,
                }}
              >
                ALUMINIOS SAN FRANCISCO
              </Typography>
            </Link>
          </Box>

          {/* Icono de menú para pantallas pequeñas */}
          <IconButton
            color="inherit"
            edge="start"
            sx={{ display: { xs: "block", md: "none" } }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>

          {/* Botones para pantallas grandes */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3 }}>
            {menuItems.map((item) => (
              <Button
                key={item.text}
                color="inherit"
                component={Link}
                href={item.href}
                startIcon={item.icon}
                sx={{ fontSize: "1rem" }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer para pantallas pequeñas */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
          {/* Imagen encima del menú */}
          <Box sx={{ textAlign: "center", padding: 2 }}>
            <Image
              src="/logo_aluminos.png" // Cambia esto por la ruta de tu imagen
              alt="Aluminios San Francisco"
              width={300}
              height={200}
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </Box>
          {/* Lista de elementos del menú */}
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} component="a" href={item.href} style={{ textDecoration: "none", color: "inherit" }}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <ThemeProvider theme={theme}>
      <Container
        maxWidth={false}
        sx={{
          minHeight: "100vh",
          bgcolor: "white",
          borderRadius: 0,
          padding: 3,
        }}
      >
        {children}
      </Container>
      </ThemeProvider>
    </>
  );
}