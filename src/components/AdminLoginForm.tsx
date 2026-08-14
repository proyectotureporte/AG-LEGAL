"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "@/app/panel/panel.module.css";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: data.get("usuario"),
          contrasena: data.get("contrasena"),
        }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "No fue posible iniciar sesión.");
      router.replace("/panel");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="usuario">Usuario</label>
      <input id="usuario" name="usuario" autoComplete="username" required />
      <label htmlFor="contrasena">Contraseña</label>
      <input
        id="contrasena"
        name="contrasena"
        type="password"
        autoComplete="current-password"
        required
      />
      <p className={styles.error} role="alert">{error}</p>
      <button className={styles.button} disabled={loading} type="submit">
        {loading ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
