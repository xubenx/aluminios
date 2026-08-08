"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";

/** Redirige la ruta antigua a la página unificada de colecciones. */
export default function ColeccionesMaterialesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sistema/colecciones");
  }, [router]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "40vh",
        gap: 2,
      }}
    >
      <CircularProgress size={32} />
      <Typography variant="body2" color="textSecondary">
        Redirigiendo a Colecciones…
      </Typography>
    </Box>
  );
}
