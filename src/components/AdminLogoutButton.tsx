"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "@/app/panel/panel.module.css";

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      router.replace("/panel/login");
      router.refresh();
    }
  }

  return (
    <button className={styles.button} disabled={loading} onClick={logout} type="button">
      {loading ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
