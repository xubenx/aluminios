"use client";

import Head from "next/head";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Button,
  Divider,
  Chip,
} from "@mui/material";
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
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import { useAuth } from "../../contexts/AuthContext";
import Image from "next/image";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth() as {
    user: { name?: string; usuario?: string } | null;
    loading: boolean;
    logout: () => void;
  };
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
    { text: "Colecciones", href: "/sistema/colecciones", icon: <CollectionsBookmarkIcon /> },
    { text: "Materiales", href: "/sistema/materiales", icon: <ConstructionIcon /> },
    { text: "Colores", href: "/sistema/colores", icon: <PaletteIcon /> },
    { text: "Herrajes", href: "/sistema/herrajes", icon: <BuildIcon /> },
    { text: "Vidrios", href: "/sistema/vidrios", icon: <GlassIcon /> },
    { text: "Servicios / Extras", href: "/sistema/extras", icon: <AddCircleOutlineIcon /> },
    { text: "Colaboradores", href: "/sistema/colaboradores", icon: <PeopleIcon /> },
  ];

  const renderMenuSection = (title: string, items: typeof menuItems) => (
    <Box sx={{ px: 1.2, py: 1 }}>
      <Typography
        variant="overline"
        sx={{ px: 1.4, color: "text.secondary", letterSpacing: 1.1, fontWeight: 700 }}
      >
        {title}
      </Typography>
      <List sx={{ py: 0.5 }}>
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <ListItem
              key={item.text}
              component={Link}
              href={item.href}
              onClick={toggleDrawer(false)}
              sx={{
                textDecoration: "none",
                color: "inherit",
                borderRadius: 2,
                mb: 0.4,
                border: "1px solid",
                borderColor: isActive ? "rgba(67, 88, 112, 0.28)" : "transparent",
                bgcolor: isActive ? "rgba(121, 145, 172, 0.12)" : "transparent",
                transition: "all .2s ease",
                "&:hover": {
                  borderColor: "rgba(67, 88, 112, 0.2)",
                  bgcolor: "rgba(121, 145, 172, 0.08)",
                  transform: "translateX(2px)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: isActive ? "primary.main" : "text.secondary" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: "0.92rem",
                  fontWeight: isActive ? 700 : 500,
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <AppBar position="sticky" sx={{ px: { xs: 1, md: 2 } }}>
        <Toolbar sx={{ minHeight: { xs: 68, md: 78 }, gap: 1 }}>
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1.6 }}>
            <Link href="/sistema" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>
              <Image
                src="/aluminios.svg"
                alt="Aluminios San Francisco"
                width={78}
                height={78}
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </Link>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: { xs: "1.05rem", md: "1.25rem" } }}>
                Sistema de Gestión
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: 0.5 }}>
                Aluminios San Francisco
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.7, md: 1 } }}>
            <Chip
              label={user?.name || user?.usuario || "Usuario"}
              size="small"
              variant="outlined"
              sx={{ display: { xs: "none", sm: "inline-flex" }, borderColor: "rgba(67,88,112,.3)", color: "text.primary" }}
            />
            <Typography variant="body2" sx={{ display: { xs: "none", md: "block" }, color: "text.secondary" }}>
              {user?.name || user?.usuario}
            </Typography>
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={() => {
                logout();
                router.replace("/sistema/login");
              }}
              sx={{ borderColor: "rgba(87,106,128,0.28)", minWidth: { xs: 36, md: "auto" }, px: { xs: 1, md: 1.5 } }}
            >
              Salir
            </Button>
          </Box>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{
              display: "flex",
              border: "1px solid rgba(87,106,128,.24)",
              "&:hover": {
                backgroundColor: "rgba(121, 145, 172, 0.12)",
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 280,
            boxSizing: "border-box",
          },
        }}
      >
        <Box sx={{ width: 280 }} role="presentation">
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Image
              src="/logo_aluminos.png"
              alt="Aluminios San Francisco"
              width={210}
              height={120}
              style={{ maxWidth: "100%", height: "auto" }}
            />
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
              Navegacion del sistema
            </Typography>
          </Box>
          <Divider sx={{ borderColor: "rgba(122,138,158,0.2)" }} />
          {renderMenuSection("Gestion principal", menuItems.slice(0, 5))}
          <Divider sx={{ borderColor: "rgba(122,138,158,0.2)" }} />
          {renderMenuSection("Inventario y equipo", menuItems.slice(5))}
        </Box>
      </Drawer>

      <Container
        maxWidth={false}
        sx={{
          minHeight: "calc(100vh - 78px)",
          px: { xs: 1.2, md: 2.5 },
          py: { xs: 1.4, md: 2.4 },
        }}
      >
        <Box
          sx={{
            minHeight: "100%",
            borderRadius: 3,
            p: { xs: 1.3, md: 2.2 },
            bgcolor: "rgba(255, 255, 255, 0.62)",
            border: "1px solid rgba(122, 138, 158, 0.2)",
            boxShadow: "0 16px 28px rgba(12, 20, 34, 0.12)",
            backdropFilter: "blur(18px)",
          }}
        >
          {children}
        </Box>
      </Container>
    </>
  );
}
