"use client";

import { useEffect } from "react";

const CIUDADES = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga",
  "Cúcuta", "Pereira", "Ibagué", "Manizales", "Villavicencio", "Santa Marta",
  "Otra ciudad",
];
const ANIOS = [2002, 2003, 2004, 2005];

interface ValidatedField {
  id: string;
  validate: (value: string) => string | null;
}

export function LandingInteractions() {
  useEffect(() => {
    const select = <T extends Element>(selector: string, context: ParentNode = document) =>
      context.querySelector<T>(selector);
    const selectAll = <T extends Element>(selector: string, context: ParentNode = document) =>
      Array.from(context.querySelectorAll<T>(selector));

    const populate = (element: HTMLSelectElement | null, values: readonly (string | number)[]) => {
      if (!element || element.options.length > 1) return;
      for (const value of values) element.add(new Option(String(value), String(value)));
    };
    populate(select<HTMLSelectElement>("#f-ciudad"), CIUDADES);
    populate(select<HTMLSelectElement>("#f-anio"), ANIOS);

    const cleanups: Array<() => void> = [];
    for (const item of selectAll<HTMLElement>(".faq__item")) {
      const button = select<HTMLButtonElement>(".faq__q", item);
      const panel = select<HTMLElement>(".faq__a", item);
      if (!button || !panel) continue;
      button.setAttribute("aria-expanded", "false");
      const onClick = () => {
        const wasOpen = item.classList.contains("is-open");
        for (const other of selectAll<HTMLElement>(".faq__item.is-open")) {
          if (other === item) continue;
          other.classList.remove("is-open");
          select<HTMLButtonElement>(".faq__q", other)?.setAttribute("aria-expanded", "false");
          const otherPanel = select<HTMLElement>(".faq__a", other);
          if (otherPanel) otherPanel.style.maxHeight = "0px";
        }
        item.classList.toggle("is-open", !wasOpen);
        button.setAttribute("aria-expanded", String(!wasOpen));
        panel.style.maxHeight = wasOpen ? "0px" : `${panel.scrollHeight}px`;
      };
      button.addEventListener("click", onClick);
      cleanups.push(() => button.removeEventListener("click", onClick));
    }

    const nav = select<HTMLElement>(".nav");
    const updateNavHeight = () => {
      document.documentElement.style.setProperty(
        "--ag-nav-height",
        `${Math.ceil(nav?.getBoundingClientRect().height || 0)}px`,
      );
    };
    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    cleanups.push(() => window.removeEventListener("resize", updateNavHeight));

    for (const anchor of selectAll<HTMLAnchorElement>('a[href^="#"]')) {
      const onAnchor = (event: MouseEvent) => {
        const hash = anchor.getAttribute("href");
        if (!hash) return;
        const target = hash === "#" ? document.body : select<HTMLElement>(hash);
        if (!target) return;
        event.preventDefault();
        updateNavHeight();
        const navHeight = nav?.getBoundingClientRect().height || 0;
        const alignmentSpace = select<HTMLElement>("#ag-anchor-alignment-space");
        if (alignmentSpace) alignmentSpace.style.height = "0px";
        const documentTop = target.getBoundingClientRect().top + window.scrollY;
        if (alignmentSpace && hash !== "#") {
          const missingScrollSpace = Math.max(
            0,
            documentTop - navHeight + window.innerHeight - document.documentElement.scrollHeight,
          );
          alignmentSpace.style.height = `${Math.ceil(missingScrollSpace)}px`;
        }
        const top = hash === "#" ? 0 : documentTop - navHeight;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        if (hash !== "#") history.replaceState(null, "", hash);
      };
      anchor.addEventListener("click", onAnchor);
      cleanups.push(() => anchor.removeEventListener("click", onAnchor));
    }

    const fields: ValidatedField[] = [
      {
        id: "f-nombre",
        validate: (value) => {
          const clean = value.trim();
          if (clean.length < 3) return "Escribe tu nombre completo.";
          return clean.includes(" ") ? null : "Incluye al menos nombre y apellido.";
        },
      },
      {
        id: "f-celular",
        validate: (value) => /^3\d{9}$/.test(value.replace(/\D/g, ""))
          ? null
          : "Ingresa un celular colombiano válido (10 dígitos, inicia en 3).",
      },
      { id: "f-ciudad", validate: (value) => value ? null : "Selecciona tu ciudad." },
      { id: "f-anio", validate: (value) => value ? null : "Selecciona el año del crédito." },
    ];

    const markError = (input: HTMLInputElement | HTMLSelectElement, message: string | null) => {
      const field = input.closest<HTMLElement>(".field");
      const error = field?.querySelector<HTMLElement>(".field__error");
      field?.classList.toggle("has-error", Boolean(message));
      input.classList.toggle("is-invalid", Boolean(message));
      input.setAttribute("aria-invalid", String(Boolean(message)));
      if (error) error.textContent = message || "";
    };

    const form = select<HTMLFormElement>("#form-revision");
    const card = select<HTMLElement>("#uform-card");
    const consent = select<HTMLInputElement>("#f-consent");
    const consentBox = consent?.closest<HTMLElement>(".consent");
    const startedAt = Date.now();

    if (form && card && consent) {
      const honeypot = document.createElement("input");
      honeypot.name = "website";
      honeypot.type = "text";
      honeypot.tabIndex = -1;
      honeypot.autocomplete = "off";
      honeypot.className = "ag-honeypot";
      honeypot.setAttribute("aria-hidden", "true");
      form.prepend(honeypot);

      const serverError = document.createElement("p");
      serverError.className = "uform__server-error";
      serverError.setAttribute("role", "alert");
      form.querySelector("button[type=submit]")?.before(serverError);

      for (const field of fields) {
        const input = select<HTMLInputElement | HTMLSelectElement>(`#${field.id}`);
        if (!input) continue;
        const onInput = () => markError(input, field.validate(input.value));
        input.addEventListener("input", onInput);
        cleanups.push(() => input.removeEventListener("input", onInput));
      }
      const onConsent = () => consentBox?.classList.toggle("has-error", !consent.checked);
      consent.addEventListener("change", onConsent);
      cleanups.push(() => consent.removeEventListener("change", onConsent));

      const onSubmit = async (event: SubmitEvent) => {
        event.preventDefault();
        let firstError: HTMLElement | null = null;
        for (const field of fields) {
          const input = select<HTMLInputElement | HTMLSelectElement>(`#${field.id}`);
          if (!input) continue;
          const message = field.validate(input.value);
          markError(input, message);
          if (message && !firstError) firstError = input;
        }
        consentBox?.classList.toggle("has-error", !consent.checked);
        if (!consent.checked && !firstError) firstError = consent;
        if (firstError) return firstError.focus();

        const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        serverError.classList.remove("is-visible");
        if (submit) submit.disabled = true;
        try {
          const response = await fetch("/api/solicitudes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: select<HTMLInputElement>("#f-nombre")?.value,
              celular: select<HTMLInputElement>("#f-celular")?.value,
              ciudad: select<HTMLSelectElement>("#f-ciudad")?.value,
              anio: Number(select<HTMLSelectElement>("#f-anio")?.value),
              consentimiento: consent.checked,
              website: honeypot.value,
              formularioIniciadoEn: startedAt,
            }),
          });
          const result = await response.json().catch(() => ({})) as { error?: string };
          if (!response.ok) throw new Error(result.error || "No fue posible enviar la solicitud.");
          card.classList.add("is-sent");
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (error) {
          serverError.textContent = error instanceof Error
            ? error.message
            : "No fue posible enviar la solicitud. Inténtalo nuevamente.";
          serverError.classList.add("is-visible");
        } finally {
          if (submit) submit.disabled = false;
        }
      };
      form.addEventListener("submit", onSubmit);
      cleanups.push(() => form.removeEventListener("submit", onSubmit));
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return <div id="ag-anchor-alignment-space" aria-hidden="true" />;
}
