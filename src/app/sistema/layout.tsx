"use client";

import Head from "next/head";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, Container, Box, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, CircularProgress, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";
import WindowIcon from "@mui/icons-material/Window";
import ConstructionIcon from "@mui/icons-material/Carpenter";
import BuildIcon from "@mui/icons-material/Key";
import GlassIcon from "@mui/icons-material/WindowOutlined";
import PeopleIcon from "@mui/icons-material/People";
import PaletteIcon from "@mui/icons-material/Palette";
import RequestQuote from "@mui/icons-material/RequestQuote";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WorkIcon from "@mui/icons-material/Work";
import PersonIcon from "@mui/icons-material/Person";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useAuth } from "../../contexts/AuthContext";
import Image from "next/image";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const isLoginPage = pathname === "/sistema/login";

  useEffect(() => {
    if (loading) return;
    if (!isLoginPage && !user) router.replace("/sistema/login");
  }, [loading, user, isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;
  if (loading || !user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };
  const menuItems = [
        { text: "Recordatorios", href: "/sistema/recordatorios", icon: <NotificationsIcon /> },

    { text: "Presupuestos", href: "/sistema/presupuestos", icon: <RequestQuote /> },
    { text: "Proyectos", href: "/sistema/proyectos", icon: <AssignmentIcon /> },
    { text: "Órdenes", href: "/sistema/ordenes", icon: <WorkIcon /> },
    { text: "Clientes", href: "/sistema/clientes", icon: <PersonIcon /> },
    { text: "Diario", href: "/sistema/diario", icon: <AccountBalanceWalletIcon /> },
    { text: "Modelos", href: "/sistema/modelos", icon: <WindowIcon /> },
    { text: "Materiales", href: "/sistema/materiales", icon: <ConstructionIcon /> },
    { text: "Colores", href: "/sistema/colores", icon: <PaletteIcon /> },
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
      >        <Toolbar>          {/* Imagen y texto visibles en todas las pantallas */}
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 2 }}>
            <Link href="/sistema" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>
              <Image
                src="/aluminios.svg" // Cambia esto por la ruta de tu imagen
                alt="Aluminios San Francisco"
                width={90}
                height={90}
                style={{ maxWidth: "100%", height: "auto", marginBottom: 15, marginTop: 15 }} // Ajusta el tamaño de la imagen
              />
            </Link>
            {/* Texto descriptivo */}
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                Sistema de Gestión
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Aluminios San Francisco
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", display: { xs: "none", sm: "block" } }}>
              {user?.name || user?.usuario}
            </Typography>
            <Button color="inherit" size="small" startIcon={<LogoutIcon />} onClick={() => { logout(); router.replace("/sistema/login"); }}>
              Salir
            </Button>
          </Box>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ 
              display: "flex",
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>      {/* Drawer mejorado para todas las pantallas */}
      <Drawer 
        anchor="left" 
        open={drawerOpen} 
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ width: 280 }} role="presentation">
          {/* Imagen encima del menú */}
          <Box sx={{ 
            textAlign: "center", 
            padding: 2, 
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5'
          }}>
            <Image
              src="/logo_aluminos.png"
              alt="Aluminios San Francisco"
              width={240}
              height={160}
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </Box>
          
          {/* Sección principal */}
          <Box sx={{ padding: 1 }}>
            <Typography variant="overline" sx={{ 
              px: 2, 
              py: 1, 
              color: 'text.secondary',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}>
              GESTIÓN PRINCIPAL
            </Typography>
            <List sx={{ py: 0 }}>
              {menuItems.slice(0, 5).map((item) => (
                <ListItem 
                  key={item.text} 
                  component={Link}
                  href={item.href}
                  onClick={toggleDrawer(false)}
                  sx={{
                    textDecoration: "none", 
                    color: "inherit",
                    borderRadius: 1,
                    margin: '2px 8px',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      fontWeight: 500
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Sección de inventario */}
          <Box sx={{ padding: 1 }}>
            <Typography variant="overline" sx={{ 
              px: 2, 
              py: 1, 
              color: 'text.secondary',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}>
              INVENTARIO
            </Typography>
            <List sx={{ py: 0 }}>
              {menuItems.slice(5).map((item) => (
                <ListItem 
                  key={item.text} 
                  component={Link}
                  href={item.href}
                  onClick={toggleDrawer(false)}
                  sx={{
                    textDecoration: "none", 
                    color: "inherit",
                    borderRadius: 1,
                    margin: '2px 8px',
                    '&:hover': {
                      backgroundColor: 'secondary.light',
                      color: 'secondary.contrastText',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      fontWeight: 500
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Drawer>

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