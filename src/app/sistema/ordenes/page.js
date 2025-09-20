"use client";
import React from "react";
import { useOrdenesController } from "./OrdenesController";
import OrdenesView from "./OrdenesView";

export default function OrdenesPage() {
  const controllerProps = useOrdenesController();

  return <OrdenesView {...controllerProps} />;
}