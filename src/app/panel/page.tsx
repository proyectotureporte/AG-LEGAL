import { count, desc } from "drizzle-orm";
import Link from "next/link";
import { connection } from "next/server";

import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { db } from "@/db";
import { solicitudes } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

import styles from "./panel.module.css";

const PAGE_SIZE = 50;

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  await requireAdminSession();

  const params = await searchParams;
  const requestedPage = Number(params.pagina);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [[totalRow], rows] = await Promise.all([
    db.select({ value: count() }).from(solicitudes),
    db
      .select({
        id: solicitudes.id,
        nombre: solicitudes.nombre,
        celular: solicitudes.celular,
        ciudad: solicitudes.ciudad,
        anio: solicitudes.anioCredito,
        fecha: solicitudes.creadoEn,
      })
      .from(solicitudes)
      .orderBy(desc(solicitudes.creadoEn))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);
  const total = totalRow?.value ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Solicitudes recibidas</h1>
          <p className={styles.subtitle}>{total} formulario{total === 1 ? "" : "s"} registrado{total === 1 ? "" : "s"}</p>
        </div>
        <AdminLogoutButton />
      </header>

      <section className={styles.card}>
        {rows.length === 0 ? (
          <p className={styles.empty}>Todavía no se han recibido solicitudes.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Fecha</th><th>Nombre</th><th>Celular / WhatsApp</th><th>Ciudad</th><th>Año del crédito</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.fecha.toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short" })}</td>
                    <td>{row.nombre}</td>
                    <td><a className={styles.phone} href={`tel:+57${row.celular}`}>{row.celular}</a></td>
                    <td>{row.ciudad}</td>
                    <td>{row.anio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <nav className={styles.pagination} aria-label="Paginación">
            {page > 1 ? <Link href={`/panel?pagina=${page - 1}`}>Anterior</Link> : <span />}
            <span>Página {Math.min(page, pages)} de {pages}</span>
            {page < pages ? <Link href={`/panel?pagina=${page + 1}`}>Siguiente</Link> : <span />}
          </nav>
        )}
      </section>
    </main>
  );
}
