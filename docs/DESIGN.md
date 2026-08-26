# Sistema visual de AG Legal

Actualizado: 2026-08-26

## Identidad

La landing usa el material oficial entregado para AG Legal: logo circular, familia, iconos de servicio, proceso, protección, vivienda y redes. Los originales se normalizan a nombres semánticos y se sirven en WebP desde `public/images/aglegal/`.

La interfaz debe transmitir protección patrimonial, claridad y cercanía. El azul marino aporta rigor jurídico; el azul vivo indica orientación y acción; el dorado identifica oportunidades, garantías y llamadas principales.

## Tokens

| Uso | Valor principal |
| --- | --- |
| Fondo institucional | `#00162f` / `#00234a` |
| Acción e información | `#087dcc` |
| Acento y CTA | `#ffad2f` |
| Superficie informativa | `#f0f8fd` |
| Superficie cálida | `#fffaf0` |
| Texto principal | `#08213e` |
| Éxito | `#188553` |
| Error | `#b72f38` |

Los tokens completos viven en `src/app/landing.css`. Texto normal mantiene contraste AA sobre sus superficies.

## Tipografía

- Títulos y momentos editoriales: Georgia, con cursiva reservada para la palabra protagonista del hero.
- Interfaz y cuerpo: Aptos, Segoe UI y alternativas de sistema.
- Escalas fluidas con `clamp()` en titulares y límites compactos en móvil.

## Elemento firma

El motivo de marca es el arco protector: anillos curvos en azul y dorado rodean a la familia o cierran superficies institucionales. Se usa una vez por vista dominante y de forma tenue en tarjetas secundarias.

## Componentes

- Navegación cálida, translúcida y fija.
- Hero institucional con familia completa, doble CTA y sello de orientación.
- Barra de confianza con los iconos oficiales.
- Banda de protección de vivienda.
- Proceso en tres tarjetas numeradas.
- Bloque de elegibilidad y formulario de revisión.
- Acordeón de preguntas frecuentes.
- Footer institucional con contacto y redes.

## Movimiento y accesibilidad

- Hover, presión y foco visible en controles interactivos.
- Elevación sutil en tarjetas; duración entre 200 y 300 ms.
- `prefers-reduced-motion` desactiva transiciones.
- Las ilustraciones decorativas usan texto alternativo vacío; logo y controles conservan nombre accesible.
- El layout responde en escritorio, tableta y móvil sin eliminar contenido ni funcionalidad.
