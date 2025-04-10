import Link from "next/link";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import WindowIcon from "@mui/icons-material/Window";
import ConstructionIcon from "@mui/icons-material/Construction";
import BuildIcon from "@mui/icons-material/Build";
import GlassIcon from "@mui/icons-material/Window"; // Cambia si tienes un ícono específico para vidrios
import PeopleIcon from "@mui/icons-material/People";
import ArchiveIcon from "@mui/icons-material/Archive";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";

export default function Home() {
  const sections = [
    { text: "Modelos", href: "/sistema/modelos", icon: <WindowIcon sx={{ fontSize: 60 }} /> },
    { text: "Materiales", href: "/sistema/materiales", icon: <ConstructionIcon sx={{ fontSize: 60 }} /> },
    { text: "Accesorios", href: "/sistema/herrajes", icon: <BuildIcon sx={{ fontSize: 60 }} /> },
    { text: "Vidrios", href: "/sistema/vidrios", icon: <GlassIcon sx={{ fontSize: 60 }} /> },
    { text: "Colaboradores", href: "/sistema/colaboradores", icon: <PeopleIcon sx={{ fontSize: 60 }} /> },
    { text: "Ordenes", href: "/sistema/ordenes", icon: <ArchiveIcon sx={{ fontSize: 60 }} /> },
    { text: "Presupuestos", href: "/sistema/presupuestos", icon: <RequestQuoteIcon sx={{ fontSize: 60 }} /> },
  ];

  return (
    <Box
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
      sx={{
        minHeight: "100vh",
        padding: 4,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
        gap: 4,
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      {sections.map((section) => (
        <Button
          key={section.text}
          variant="outlined"
          color="primary"
          component={Link}
          href={section.href}
          sx={{
            width: "100%",
            maxWidth: 300,
            height: 150,
            fontSize: "1.2rem",
            textTransform: "none",
            display: "flex",
            flexDirection: "column", // Ícono arriba, texto abajo
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            padding: 2,
          }}
        >
          {section.icon}
          {section.text}
        </Button>
      ))}
    </Box>
  );
}