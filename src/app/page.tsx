import { readFile } from "node:fs/promises";
import path from "node:path";

import { connection } from "next/server";

import { LandingInteractions } from "@/components/LandingInteractions";

async function getLandingMarkup() {
  const source = await readFile(
    path.join(process.cwd(), "src", "content", "landing.html"),
    "utf8",
  );
  const body = source.match(/<body>([\s\S]*?)<\/body>/i)?.[1];
  if (!body) throw new Error("No se encontró el contenido de la landing");

  return body
    .replaceAll("img/logo-ag-legal.png", "/images/logo-ag-legal.png")
    .replaceAll("img/hero-familia.jpg", "/images/hero-familia.jpg");
}

export default async function Home() {
  await connection();
  const markup = await getLandingMarkup();

  return (
    <>
      <main dangerouslySetInnerHTML={{ __html: markup }} />
      <LandingInteractions />
    </>
  );
}
