import "server-only";

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

import { REPORT_TYPE_LABELS } from "@/config/reports";

import type { ReportSnapshot } from "@/lib/reports/types";

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

const MARGIN = 38;

const HEADER_HEIGHT = 76;

const COLOR_PRIMARY = rgb(18 / 255, 54 / 255, 90 / 255);

const COLOR_TEXT = rgb(15 / 255, 23 / 255, 42 / 255);

const COLOR_MUTED = rgb(100 / 255, 116 / 255, 139 / 255);

const COLOR_BORDER = rgb(226 / 255, 232 / 255, 240 / 255);

const COLOR_BACKGROUND = rgb(248 / 255, 250 / 255, 252 / 255);

const COLOR_SUCCESS = rgb(5 / 255, 150 / 255, 105 / 255);

type PdfContext = {
  pdf: PDFDocument;

  page: PDFPage;

  regularFont: PDFFont;

  boldFont: PDFFont;

  y: number;

  pageNumber: number;

  snapshot: ReportSnapshot;
};

type TableColumn = {
  header: string;

  key: string;

  ratio: number;

  align?: "left" | "right";
};

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function numberValue(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function textValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

/*
|--------------------------------------------------------------------------
| TEXTO COMPATIBLE CON HELVETICA
|--------------------------------------------------------------------------
|
| StandardFonts.Helvetica soporta
| acentos españoles, pero evitamos
| símbolos Unicode problemáticos.
|
*/

function cleanText(value: unknown) {
  return textValue(value)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/→/g, "->")
    .replace(/←/g, "<-");
}

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",

  currency: "PEN",

  minimumFractionDigits: 2,

  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

function currency(value: unknown) {
  return currencyFormatter.format(numberValue(value));
}

function number(value: unknown) {
  return numberFormatter.format(numberValue(value));
}

function percentage(value: unknown) {
  return `${number(value)}%`;
}

/*
|--------------------------------------------------------------------------
| WRAP TEXT
|--------------------------------------------------------------------------
*/

function wrapText(
  text: string,

  font: PDFFont,

  fontSize: number,

  maxWidth: number,
) {
  const clean = cleanText(text);

  if (!clean) {
    return [""];
  }

  const paragraphs = clean.split("\n");

  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);

    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;

      const width = font.widthOfTextAtSize(candidate, fontSize);

      if (width <= maxWidth) {
        current = candidate;

        continue;
      }

      if (current) {
        lines.push(current);
      }

      /*
       * Palabra extremadamente larga.
       */
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        let chunk = "";

        for (const character of word) {
          const next = chunk + character;

          if (font.widthOfTextAtSize(next, fontSize) > maxWidth && chunk) {
            lines.push(chunk);

            chunk = character;
          } else {
            chunk = next;
          }
        }

        current = chunk;
      } else {
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length ? lines : [""];
}

/*
|--------------------------------------------------------------------------
| PÁGINA
|--------------------------------------------------------------------------
*/

function drawPageHeader(context: PdfContext) {
  const { page, boldFont, regularFont, snapshot } = context;

  page.drawRectangle({
    x: 0,

    y: PAGE_HEIGHT - HEADER_HEIGHT,

    width: PAGE_WIDTH,

    height: HEADER_HEIGHT,

    color: COLOR_PRIMARY,
  });

  page.drawText(cleanText(REPORT_TYPE_LABELS[snapshot.type]), {
    x: MARGIN,

    y: PAGE_HEIGHT - 34,

    size: 20,

    font: boldFont,

    color: rgb(1, 1, 1),
  });

  page.drawText(cleanText(snapshot.company.name), {
    x: MARGIN,

    y: PAGE_HEIGHT - 54,

    size: 10,

    font: regularFont,

    color: rgb(0.85, 0.9, 0.95),
  });

  const period = `${snapshot.period.from} - ${snapshot.period.to}`;

  const periodWidth = regularFont.widthOfTextAtSize(period, 10);

  page.drawText(period, {
    x: PAGE_WIDTH - MARGIN - periodWidth,

    y: PAGE_HEIGHT - 44,

    size: 10,

    font: regularFont,

    color: rgb(1, 1, 1),
  });
}

function drawPageFooter(context: PdfContext) {
  const { page, regularFont, pageNumber } = context;

  page.drawLine({
    start: {
      x: MARGIN,

      y: 25,
    },

    end: {
      x: PAGE_WIDTH - MARGIN,

      y: 25,
    },

    thickness: 0.5,

    color: COLOR_BORDER,
  });

  page.drawText(`Página ${pageNumber}`, {
    x: MARGIN,

    y: 12,

    size: 8,

    font: regularFont,

    color: COLOR_MUTED,
  });
}

function createPage(context: PdfContext) {
  if (context.page) {
    drawPageFooter(context);
  }

  context.page = context.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  context.pageNumber += 1;

  context.y = PAGE_HEIGHT - HEADER_HEIGHT - 26;

  drawPageHeader(context);
}

function ensureSpace(
  context: PdfContext,

  requiredHeight: number,
) {
  if (context.y - requiredHeight < 40) {
    createPage(context);
  }
}

/*
|--------------------------------------------------------------------------
| TÍTULOS
|--------------------------------------------------------------------------
*/

function drawSectionTitle(
  context: PdfContext,

  title: string,
) {
  ensureSpace(context, 36);

  context.page.drawText(cleanText(title), {
    x: MARGIN,

    y: context.y,

    size: 14,

    font: context.boldFont,

    color: COLOR_PRIMARY,
  });

  context.y -= 8;

  context.page.drawLine({
    start: {
      x: MARGIN,

      y: context.y,
    },

    end: {
      x: PAGE_WIDTH - MARGIN,

      y: context.y,
    },

    thickness: 1,

    color: COLOR_BORDER,
  });

  context.y -= 18;
}

/*
|--------------------------------------------------------------------------
| FILA INDICADOR
|--------------------------------------------------------------------------
*/

function drawMetricRows(
  context: PdfContext,

  rows: Array<{
    label: string;

    value: string | number;
  }>,
) {
  const rowHeight = 24;

  for (const row of rows) {
    ensureSpace(context, rowHeight);

    context.page.drawRectangle({
      x: MARGIN,

      y: context.y - 16,

      width: PAGE_WIDTH - MARGIN * 2,

      height: 21,

      color: COLOR_BACKGROUND,
    });

    context.page.drawText(cleanText(row.label), {
      x: MARGIN + 8,

      y: context.y - 10,

      size: 9,

      font: context.regularFont,

      color: COLOR_MUTED,
    });

    const value = cleanText(row.value);

    const width = context.boldFont.widthOfTextAtSize(value, 9);

    context.page.drawText(value, {
      x: PAGE_WIDTH - MARGIN - 8 - width,

      y: context.y - 10,

      size: 9,

      font: context.boldFont,

      color: COLOR_TEXT,
    });

    context.y -= rowHeight;
  }

  context.y -= 8;
}

/*
|--------------------------------------------------------------------------
| TABLAS
|--------------------------------------------------------------------------
*/

function drawTableHeader(
  context: PdfContext,

  columns: TableColumn[],

  widths: number[],
) {
  const tableWidth = PAGE_WIDTH - MARGIN * 2;

  context.page.drawRectangle({
    x: MARGIN,

    y: context.y - 22,

    width: tableWidth,

    height: 24,

    color: COLOR_PRIMARY,
  });

  let x = MARGIN;

  columns.forEach((column, index) => {
    const lines = wrapText(
      column.header,

      context.boldFont,

      8,

      widths[index] - 8,
    );

    context.page.drawText(lines[0] ?? "", {
      x: x + 4,

      y: context.y - 14,

      size: 8,

      font: context.boldFont,

      color: rgb(1, 1, 1),
    });

    x += widths[index];
  });

  context.y -= 28;
}

function drawTable(
  context: PdfContext,

  columns: TableColumn[],

  rows: Record<string, unknown>[],
) {
  if (!rows.length) {
    drawMetricRows(context, [
      {
        label: "Información",

        value: "Sin datos",
      },
    ]);

    return;
  }

  const tableWidth = PAGE_WIDTH - MARGIN * 2;

  const ratioTotal = columns.reduce(
    (total, column) => total + column.ratio,

    0,
  );

  const widths = columns.map(
    (column) => tableWidth * (column.ratio / ratioTotal),
  );

  ensureSpace(context, 55);

  drawTableHeader(context, columns, widths);

  for (const row of rows) {
    /*
     * Calcular líneas de cada celda.
     */
    const cells = columns.map((column, index) =>
      wrapText(
        cleanText(row[column.key]),

        context.regularFont,

        7.5,

        widths[index] - 8,
      ),
    );

    const maxLines = Math.max(...cells.map((lines) => lines.length));

    const rowHeight = Math.max(
      24,

      maxLines * 10 + 10,
    );

    if (context.y - rowHeight < 40) {
      createPage(context);

      drawTableHeader(context, columns, widths);
    }

    context.page.drawRectangle({
      x: MARGIN,

      y: context.y - rowHeight + 4,

      width: tableWidth,

      height: rowHeight,

      borderColor: COLOR_BORDER,

      borderWidth: 0.5,

      color: rgb(1, 1, 1),
    });

    let x = MARGIN;

    cells.forEach((lines, columnIndex) => {
      const column = columns[columnIndex];

      lines.forEach((line, lineIndex) => {
        const textWidth = context.regularFont.widthOfTextAtSize(line, 7.5);

        const textX =
          column.align === "right"
            ? x + widths[columnIndex] - textWidth - 4
            : x + 4;

        context.page.drawText(line, {
          x: textX,

          y: context.y - 10 - lineIndex * 10,

          size: 7.5,

          font: context.regularFont,

          color: COLOR_TEXT,
        });
      });

      x += widths[columnIndex];
    });

    context.y -= rowHeight;
  }

  context.y -= 12;
}

/*
|--------------------------------------------------------------------------
| INFORMACIÓN DEL REPORTE
|--------------------------------------------------------------------------
*/

function drawReportInformation(context: PdfContext) {
  const snapshot = context.snapshot;

  drawSectionTitle(context, "Información general");

  drawMetricRows(context, [
    {
      label: "Empresa",

      value: snapshot.company.name,
    },

    {
      label: "RUC",

      value: snapshot.company.ruc ?? "-",
    },

    {
      label: "Sector",

      value: snapshot.company.sector ?? "-",
    },

    {
      label: "Periodo",

      value: `${snapshot.period.from} - ${snapshot.period.to}`,
    },

    {
      label: "Días analizados",

      value: snapshot.period.days,
    },

    {
      label: "Generado por",

      value: snapshot.generatedBy.name,
    },

    {
      label: "Fecha de generación",

      value: new Date(snapshot.generatedAt).toLocaleString("es-PE"),
    },
  ]);
}

/*
|--------------------------------------------------------------------------
| EJECUTIVO
|--------------------------------------------------------------------------
*/

function drawExecutiveReport(context: PdfContext) {
  const data = asRecord(context.snapshot.data);

  const inventory = asRecord(data.inventory);

  drawSectionTitle(context, "Resumen del inventario");

  drawMetricRows(context, [
    {
      label: "SKU analizados",

      value: number(inventory.totalSku),
    },

    {
      label: "SKU con stock",

      value: number(inventory.skuWithStock),
    },

    {
      label: "Unidades en inventario",

      value: number(inventory.totalUnits),
    },

    {
      label: "Valor total del inventario",

      value: currency(inventory.totalStockValue),
    },
  ]);

  /*
   * IRI
   */
  const iri = asRecord(data.iri);

  const iriSummary = asRecord(iri.summary);

  drawSectionTitle(context, "Análisis IRI");

  drawMetricRows(context, [
    {
      label: "IRI promedio",

      value: `${number(iriSummary.iriAverage)}/100`,
    },

    {
      label: "SKU alta recuperabilidad",

      value: number(iriSummary.highRecoverabilitySkuCount),
    },

    {
      label: "% alta recuperabilidad",

      value: percentage(iriSummary.highRecoverabilityPercentage),
    },
  ]);

  /*
   * RECOMENDACIONES
   */
  const recommendations = asRecord(data.recommendations);

  const recommendationSummary = asRecord(recommendations.summary);

  drawSectionTitle(context, "Recomendaciones");

  drawMetricRows(context, [
    {
      label: "Total recomendaciones",

      value: number(recommendationSummary.totalRecommendations),
    },

    {
      label: "Capital involucrado",

      value: currency(recommendationSummary.capitalInvolved),
    },

    {
      label: "Rotación potencial",

      value: percentage(recommendationSummary.potentialRotationPercentage),
    },
  ]);

  /*
   * SEGUIMIENTO
   */
  const tracking = asRecord(data.tracking);

  const trackingSummary = asRecord(tracking.summary);

  drawSectionTitle(context, "Seguimiento");

  drawMetricRows(context, [
    {
      label: "Acciones pendientes",

      value: number(trackingSummary.pending),
    },

    {
      label: "Acciones ejecutadas",

      value: number(trackingSummary.executed),
    },

    {
      label: "Acciones vencidas",

      value: number(trackingSummary.overdue),
    },
  ]);

  /*
   * RECUPERACIÓN
   */
  const recovery = asRecord(data.recovery);

  const kpis = asRecord(recovery.kpis);

  drawSectionTitle(context, "Recuperación");

  const immobilized = asRecord(kpis.immobilizedCapital);

  const potential = asRecord(kpis.potentiallyRecoverableCapital);

  const recovered = asRecord(kpis.recoveredCapital);

  const rate = asRecord(kpis.recoveryRate);

  drawMetricRows(context, [
    {
      label: "Capital inmovilizado",

      value: currency(immobilized.current),
    },

    {
      label: "Capital potencialmente recuperable",

      value: currency(potential.current),
    },

    {
      label: "Capital recuperado",

      value: currency(recovered.current),
    },

    {
      label: "Tasa de recuperación",

      value: percentage(rate.current),
    },
  ]);

  /*
   * SKU CRÍTICOS
   */
  const critical = asArray(data.criticalHighlights);

  drawSectionTitle(context, "Principales SKU críticos");

  const rows = critical.map((raw) => {
    const item = asRecord(raw);

    return {
      sku: item.sku,

      product: item.description,

      iri: number(item.iri),

      action: item.actionLabel,

      stock: number(item.stockQuantity),

      value: currency(item.stockValue),
    };
  });

  drawTable(
    context,

    [
      {
        header: "SKU",
        key: "sku",
        ratio: 1,
      },

      {
        header: "Producto",
        key: "product",
        ratio: 3,
      },

      {
        header: "IRI",
        key: "iri",
        ratio: 0.8,
        align: "right",
      },

      {
        header: "Acción",
        key: "action",
        ratio: 1.3,
      },

      {
        header: "Stock",
        key: "stock",
        ratio: 1,
        align: "right",
      },

      {
        header: "Valor",
        key: "value",
        ratio: 1.5,
        align: "right",
      },
    ],

    rows,
  );
}

/*
|--------------------------------------------------------------------------
| INVENTARIO CRÍTICO
|--------------------------------------------------------------------------
*/

function drawCriticalInventoryReport(context: PdfContext) {
  const data = asRecord(context.snapshot.data);

  const summary = asRecord(data.criticalSummary);

  drawSectionTitle(context, "Resumen de inventario crítico");

  drawMetricRows(context, [
    {
      label: "SKU críticos",

      value: number(summary.totalCriticalSku),
    },

    {
      label: "Capital crítico",

      value: currency(summary.criticalStockValue),
    },

    {
      label: "Redistribuir",

      value: number(summary.redistribute),
    },

    {
      label: "Ofertar",

      value: number(summary.offer),
    },

    {
      label: "Liquidar",

      value: number(summary.liquidate),
    },
  ]);

  const items = asArray(data.items);

  drawSectionTitle(context, "Detalle de SKU críticos");

  const rows = items.map((raw) => {
    const item = asRecord(raw);

    return {
      sku: item.sku,

      product: item.description,

      iri: number(item.iri),

      action: item.actionLabel,

      stock: number(item.stockQuantity),

      value: currency(item.stockValue),

      coverage: item.coverageDays
        ? `${number(item.coverageDays)} días`
        : "Sin demanda",

      rotation: percentage(item.potentialRotationPercentage),
    };
  });

  drawTable(
    context,

    [
      {
        header: "SKU",
        key: "sku",
        ratio: 0.8,
      },

      {
        header: "Producto",
        key: "product",
        ratio: 2.6,
      },

      {
        header: "IRI",
        key: "iri",
        ratio: 0.7,
        align: "right",
      },

      {
        header: "Acción",
        key: "action",
        ratio: 1.2,
      },

      {
        header: "Stock",
        key: "stock",
        ratio: 0.8,
        align: "right",
      },

      {
        header: "Valor",
        key: "value",
        ratio: 1.3,
        align: "right",
      },

      {
        header: "Cobertura",
        key: "coverage",
        ratio: 1.2,
        align: "right",
      },

      {
        header: "Rotación",
        key: "rotation",
        ratio: 1,
        align: "right",
      },
    ],

    rows,
  );
}

/*
|--------------------------------------------------------------------------
| RECOMENDACIONES
|--------------------------------------------------------------------------
*/

function drawRecommendationsReport(context: PdfContext) {
  const data = asRecord(context.snapshot.data);

  const summary = asRecord(data.summary);

  drawSectionTitle(context, "Resumen de recomendaciones");

  drawMetricRows(context, [
    {
      label: "Total recomendaciones",

      value: number(summary.totalRecommendations),
    },

    {
      label: "Capital involucrado",

      value: currency(summary.capitalInvolved),
    },

    {
      label: "Valor de rotación potencial",

      value: currency(summary.potentialRotationValue),
    },

    {
      label: "Rotación potencial",

      value: percentage(summary.potentialRotationPercentage),
    },
  ]);

  const recommendations = asArray(data.recommendations);

  drawSectionTitle(context, "Recomendaciones por SKU");

  const rows = recommendations.map((raw) => {
    const item = asRecord(raw);

    return {
      sku: item.sku,

      product: item.description,

      iri: number(item.iri),

      action: item.actionLabel,

      stock: number(item.stockQuantity),

      value: currency(item.stockValue),

      rotation: percentage(item.potentialRotationPercentage),

      reason: item.reason,
    };
  });

  drawTable(
    context,

    [
      {
        header: "SKU",
        key: "sku",
        ratio: 0.8,
      },

      {
        header: "Producto",
        key: "product",
        ratio: 2,
      },

      {
        header: "IRI",
        key: "iri",
        ratio: 0.6,
        align: "right",
      },

      {
        header: "Acción",
        key: "action",
        ratio: 1,
      },

      {
        header: "Stock",
        key: "stock",
        ratio: 0.7,
        align: "right",
      },

      {
        header: "Valor",
        key: "value",
        ratio: 1.2,
        align: "right",
      },

      {
        header: "Rotación",
        key: "rotation",
        ratio: 0.8,
        align: "right",
      },

      {
        header: "Motivo",
        key: "reason",
        ratio: 2.8,
      },
    ],

    rows,
  );
}

/*
|--------------------------------------------------------------------------
| RECUPERACIÓN
|--------------------------------------------------------------------------
*/

function drawRecoveryReport(context: PdfContext) {
  const data = asRecord(context.snapshot.data);

  const kpis = asRecord(data.kpis);

  const immobilized = asRecord(kpis.immobilizedCapital);

  const potential = asRecord(kpis.potentiallyRecoverableCapital);

  const recovered = asRecord(kpis.recoveredCapital);

  const recoveryRate = asRecord(kpis.recoveryRate);

  drawSectionTitle(context, "Indicadores de recuperación");

  drawMetricRows(context, [
    {
      label: "Capital inmovilizado",

      value: currency(immobilized.current),
    },

    {
      label: "Capital potencialmente recuperable",

      value: currency(potential.current),
    },

    {
      label: "Capital recuperado",

      value: currency(recovered.current),
    },

    {
      label: "Tasa de recuperación",

      value: percentage(recoveryRate.current),
    },
  ]);

  /*
   * TOTAL PERIODO
   */
  const periodTotal = asRecord(data.periodTotal);

  drawSectionTitle(context, "Total recuperado del periodo");

  drawMetricRows(context, [
    {
      label: "Capital recuperado",

      value: currency(periodTotal.recoveredCapital),
    },

    {
      label: "Unidades recuperadas",

      value: number(periodTotal.recoveredUnits),
    },

    {
      label: "Casos con recuperación",

      value: number(periodTotal.casesWithRecovery),
    },

    {
      label: "Eventos registrados",

      value: number(periodTotal.events),
    },
  ]);

  /*
   * COMPARATIVO
   */
  const comparisons = asArray(data.comparisonByAction);

  drawSectionTitle(context, "Comparativo por estrategia");

  drawTable(
    context,

    [
      {
        header: "Acción",
        key: "action",
        ratio: 2,
      },

      {
        header: "Periodo actual",
        key: "current",
        ratio: 1.5,
        align: "right",
      },

      {
        header: "Mes anterior",
        key: "previous",
        ratio: 1.5,
        align: "right",
      },
    ],

    comparisons.map((raw) => {
      const item = asRecord(raw);

      return {
        action: item.label,

        current: currency(item.current),

        previous: currency(item.previous),
      };
    }),
  );

  /*
   * ACCIONES
   */
  const actions = asArray(data.actions);

  drawSectionTitle(context, "Acciones recuperadas ejecutadas");

  drawTable(
    context,

    [
      {
        header: "SKU",
        key: "sku",
        ratio: 0.8,
      },

      {
        header: "Producto",
        key: "product",
        ratio: 2.2,
      },

      {
        header: "Acción",
        key: "action",
        ratio: 1,
      },

      {
        header: "Potencial",
        key: "potential",
        ratio: 1.2,
        align: "right",
      },

      {
        header: "Recuperado",
        key: "recovered",
        ratio: 1.2,
        align: "right",
      },

      {
        header: "Tasa",
        key: "rate",
        ratio: 0.8,
        align: "right",
      },

      {
        header: "Estado",
        key: "status",
        ratio: 1,
      },
    ],

    actions.map((raw) => {
      const item = asRecord(raw);

      return {
        sku: item.sku,

        product: item.description,

        action: cleanText(item.recommendationAction),

        potential: currency(item.potentialRecoverableValue),

        recovered: currency(item.recoveredValue),

        rate: percentage(item.recoveryRate),

        status: item.status,
      };
    }),
  );
}

/*
|--------------------------------------------------------------------------
| PDF
|--------------------------------------------------------------------------
*/

export async function buildReportPdf(
  snapshot: ReportSnapshot,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);

  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const firstPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const context: PdfContext = {
    pdf,

    page: firstPage,

    regularFont,

    boldFont,

    y: PAGE_HEIGHT - HEADER_HEIGHT - 26,

    pageNumber: 1,

    snapshot,
  };

  drawPageHeader(context);

  /*
   * Información general
   */
  drawReportInformation(context);

  switch (snapshot.type) {
    case "executive":
      drawExecutiveReport(context);

      break;

    case "critical_inventory":
      drawCriticalInventoryReport(context);

      break;

    case "recommendations":
      drawRecommendationsReport(context);

      break;

    case "recovery":
      drawRecoveryReport(context);

      break;
  }

  /*
   * Footer última página.
   */
  drawPageFooter(context);

  /*
   * Metadata PDF.
   */
  pdf.setTitle(cleanText(REPORT_TYPE_LABELS[snapshot.type]));

  pdf.setSubject(`Reporte ${snapshot.period.from} - ${snapshot.period.to}`);

  pdf.setAuthor(snapshot.generatedBy.name);

  pdf.setCreator("RecuperaStock AI");

  pdf.setProducer("RecuperaStock AI");

  pdf.setCreationDate(new Date(snapshot.generatedAt));

  return pdf.save();
}
