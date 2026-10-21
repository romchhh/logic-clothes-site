"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/registerSW";

export default function RegisterSW() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
