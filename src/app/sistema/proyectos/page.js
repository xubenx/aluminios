"use client";
import React from "react";
import { useProyectosController } from "./ProyectosController";
import ProyectosView from "./ProyectosView";

export default function ProyectosPage() {
  const controllerProps = useProyectosController();

  return <ProyectosView {...controllerProps} />;
}
