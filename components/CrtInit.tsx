"use client";
import { useEffect } from "react";

export default function CrtInit() {
  useEffect(() => {
    try {
      if ((localStorage.getItem("aaenz:crt") || "on") !== "off") {
        document.documentElement.classList.add("crt-on");
      }
    } catch { /* ignore */ }
  }, []);
  return null;
}
