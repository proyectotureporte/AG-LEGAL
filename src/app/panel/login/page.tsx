import { connection } from "next/server";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getAdminSession } from "@/lib/auth";

import styles from "../panel.module.css";

export default async function LoginPage() {
  await connection();
  if (await getAdminSession()) redirect("/panel");

  return (
    <main className={styles.loginShell}>
      <section className={styles.loginCard}>
        <h1>Panel AG Legal</h1>
        <p>Acceso exclusivo del administrador.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
