// filepath: /home/xubenx/Desktop/aluminios/src/app/sistema/layout.tsx
"use client";

import type { ReactNode } from "react";
import { AppBar, Toolbar, Typography, Button, Container, Box } from "@mui/material";
import Link from "next/link";
import WindowIcon from "@mui/icons-material/Window";
import ConstructionIcon from "@mui/icons-material/Construction";
import BuildIcon from "@mui/icons-material/Build";
import GlassIcon from "@mui/icons-material/WindowOutlined";
import PeopleIcon from "@mui/icons-material/People";
import ArchiveIcon from "@mui/icons-material/Archive";
import RequestQuote from "@mui/icons-material/RequestQuote";


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            <Link href="/sistema" style={{ textDecoration: "none", color: "inherit" }}>
              Aluminios San Francisco
            </Link>
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button color="inherit" component={Link} href="/sistema/modelos" startIcon={<WindowIcon />}>
              Modelos
            </Button>
            <Button color="inherit" component={Link} href="/sistema/materiales" startIcon={<ConstructionIcon />}>
              Materiales
            </Button>
            <Button color="inherit" component={Link} href="/sistema/herrajes" startIcon={<BuildIcon />}>
              Accesorios
            </Button>
            <Button color="inherit" component={Link} href="/sistema/vidrios" startIcon={<GlassIcon />}>
              Vidrios
            </Button>
            <Button color="inherit" component={Link} href="/sistema/colaboradores" startIcon={<PeopleIcon />}>
              Colaboradores
            </Button>
            <Button color="inherit" component={Link} href="/sistema/ordenes" startIcon={<ArchiveIcon />}>
              Ordenes
            </Button>
            <Button color="inherit" component={Link} href="/sistema/presupuestos" startIcon={<RequestQuote />}>
              Presupuestos
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
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
    </>
  );
}