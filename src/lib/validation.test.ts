import { describe, expect, it } from "vitest";

import { solicitudSchema } from "./validation";

const validRequest = {
  nombre: "Ana Pérez",
  celular: "300 123 4567",
  ciudad: "Bogotá",
  anio: 2003,
  consentimiento: true,
  website: "",
  formularioIniciadoEn: Date.now() - 3_000,
};

describe("solicitudSchema", () => {
  it("normaliza un celular colombiano válido", () => {
    expect(solicitudSchema.parse(validRequest).celular).toBe("3001234567");
  });

  it.each([2001, 2006, 2026])("rechaza el año %s", (anio) => {
    expect(solicitudSchema.safeParse({ ...validRequest, anio }).success).toBe(false);
  });

  it("rechaza consentimiento ausente y valores manipulados", () => {
    expect(
      solicitudSchema.safeParse({
        ...validRequest,
        consentimiento: false,
        ciudad: "<script>alert(1)</script>",
      }).success,
    ).toBe(false);
  });
});
