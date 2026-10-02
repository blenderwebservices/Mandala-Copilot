import { Goal } from '../types/mandala';

/**
 * Escapes HTML characters to prevent XSS injection in generated print documents.
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates an executive, beautifully styled HTML document from the Goal's Markdown structure.
 * Designed specifically for high-resolution A4 / Letter paper and PDF printing.
 */
export function generatePrintableHtml(goal: Goal): string {
  let totalActions = 0;
  let completedActions = 0;
  let habitActions = 0;
  let oneTimeActions = 0;

  goal.pillars.forEach((p) => {
    p.actions.forEach((a) => {
      totalActions++;
      if (a.isCompleted) completedActions++;
      if (a.type === 'recurring') habitActions++;
      else oneTimeActions++;
    });
  });

  const completionPct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const printDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const printTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const pillarsHtml = goal.pillars
    .map((pillar, idx) => {
      const pCompleted = pillar.actions.filter((a) => a.isCompleted).length;
      const actionsList = pillar.actions
        .map((action, aIdx) => {
          const isDone = action.isCompleted;
          const isHabit = action.type === 'recurring';
          const typeLabel = isHabit ? 'Hábito' : 'Tarea';
          const typeClass = isHabit ? 'type-habit' : 'type-task';

          return `
            <li class="action-item ${isDone ? 'completed' : ''}">
              <div class="checkbox-container">
                <span class="checkbox ${isDone ? 'checked' : ''}">
                  ${isDone ? '✓' : ''}
                </span>
              </div>
              <div class="action-details">
                <span class="action-title">${escapeHtml(action.title)}</span>
                <span class="action-badge ${typeClass}">${typeLabel}</span>
                ${action.notes ? `<p class="action-notes">${escapeHtml(action.notes)}</p>` : ''}
              </div>
            </li>
          `;
        })
        .join('');

      return `
        <div class="pillar-card">
          <div class="pillar-header">
            <div class="pillar-number">Pilar 0${idx + 1}</div>
            <h3 class="pillar-title">${escapeHtml(pillar.title)}</h3>
            <span class="pillar-progress ${pCompleted === 8 ? 'all-done' : ''}">${pCompleted}/8</span>
          </div>
          <ul class="actions-list">
            ${actionsList}
          </ul>
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mandala Chart 9x9 - ${escapeHtml(goal.title)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      font-size: 10pt;
    }

    /* Container */
    .document-page {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    /* Header Section */
    .doc-header {
      border-bottom: 2.5px solid #4f46e5;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }

    .doc-pretitle {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #4f46e5;
      margin-bottom: 4px;
    }

    .doc-title {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .doc-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5pt;
      color: #64748b;
    }

    /* Context Block */
    .context-box {
      background: #f8fafc;
      border-left: 3.5px solid #6366f1;
      padding: 8px 12px;
      margin-bottom: 14px;
      border-radius: 0 6px 6px 0;
    }

    .context-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4f46e5;
      display: block;
      margin-bottom: 2px;
    }

    .context-text {
      margin: 0;
      font-size: 9pt;
      color: #334155;
      font-style: italic;
    }

    /* Summary Metrics Bar */
    .metrics-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 14px;
      margin-bottom: 16px;
    }

    .metric-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 8.5pt;
    }

    .metric-value {
      font-weight: 700;
      color: #0f172a;
    }

    .progress-bar-container {
      width: 140px;
      height: 7px;
      background: #cbd5e1;
      border-radius: 9999px;
      overflow: hidden;
      display: inline-block;
      vertical-align: middle;
      margin-left: 8px;
    }

    .progress-bar-fill {
      height: 100%;
      background: #4f46e5;
      width: ${completionPct}%;
      border-radius: 9999px;
    }

    /* 8 Pillars Grid (2 columns x 4 rows) */
    .pillars-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .pillar-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pillar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .pillar-number {
      font-size: 7.5pt;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: #eef2ff;
      padding: 1px 5px;
      border-radius: 4px;
      border: 1px solid #c7d2fe;
    }

    .pillar-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      flex: 1;
      margin-left: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pillar-progress {
      font-size: 8pt;
      font-weight: 700;
      color: #64748b;
      background: #f8fafc;
      padding: 1px 6px;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
    }

    .pillar-progress.all-done {
      background: #ecfdf5;
      color: #059669;
      border-color: #a7f3d0;
    }

    /* Actions List */
    .actions-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 3.5px 0;
      border-bottom: 1px dotted #f1f5f9;
      font-size: 8pt;
      line-height: 1.25;
    }

    .action-item:last-child {
      border-bottom: none;
    }

    .action-item.completed .action-title {
      color: #64748b;
      text-decoration: line-through;
    }

    .checkbox-container {
      margin-top: 1px;
      flex-shrink: 0;
    }

    .checkbox {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 12px;
      height: 12px;
      border: 1.2px solid #64748b;
      border-radius: 3px;
      font-size: 9px;
      font-weight: bold;
      color: #ffffff;
      background: #ffffff;
      line-height: 1;
    }

    .checkbox.checked {
      background: #4f46e5;
      border-color: #4f46e5;
    }

    .action-details {
      flex: 1;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 4px;
    }

    .action-title {
      font-weight: 500;
      color: #1e293b;
      word-break: break-word;
    }

    .action-badge {
      font-size: 6.5pt;
      font-weight: 600;
      padding: 0.5px 4px;
      border-radius: 3px;
      flex-shrink: 0;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .type-habit {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }

    .type-task {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .action-notes {
      font-size: 7pt;
      color: #64748b;
      margin: 1px 0 0 0;
      font-style: italic;
    }

    /* Footer */
    .doc-footer {
      margin-top: 18px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #94a3b8;
    }

    @media print {
      body {
        background: transparent;
      }
      .pillar-card {
        border-color: #94a3b8;
      }
    }
  </style>
</head>
<body>
  <div class="document-page">
    <!-- Header -->
    <header class="doc-header">
      <div class="doc-pretitle">Mandala Copilot AI · Metodología Harada 9×9</div>
      <h1 class="doc-title">${escapeHtml(goal.title)}</h1>
      <div class="doc-meta">
        <span>Documento Estratégico Oficial</span>
        <span>Generado el ${printDate} a las ${printTime}</span>
      </div>
    </header>

    <!-- Context (if present) -->
    ${
      goal.context
        ? `
    <div class="context-box">
      <span class="context-label">Contexto Estratégico</span>
      <p class="context-text">${escapeHtml(goal.context)}</p>
    </div>
    `
        : ''
    }

    <!-- Metrics Summary Bar -->
    <div class="metrics-bar">
      <div class="metric-item">
        <span>Progreso Global:</span>
        <span class="metric-value">${completedActions} / ${totalActions} (${completionPct}%)</span>
        <div class="progress-bar-container">
          <div class="progress-bar-fill"></div>
        </div>
      </div>
      <div class="metric-item">
        <span>Pilares:</span>
        <span class="metric-value">8 Estratégicos</span>
      </div>
      <div class="metric-item">
        <span>Hábitos:</span>
        <span class="metric-value">${habitActions} recurrentes</span>
      </div>
      <div class="metric-item">
        <span>Tareas:</span>
        <span class="metric-value">${oneTimeActions} puntuales</span>
      </div>
    </div>

    <!-- 8 Pillars Grid -->
    <main class="pillars-grid">
      ${pillarsHtml}
    </main>

    <!-- Footer -->
    <footer class="doc-footer">
      <span>Mandala Copilot AI · Matriz 9×9 de Desglose de Metas y Hábitos</span>
      <span>Página 1 de 1</span>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Triggers the browser print dialog for the Goal document, guaranteeing that ONLY
 * the interpreted document is printed and NO modal dialog, backdrop, or UI is included.
 */
export function printMandalaDocument(goal: Goal): void {
  // Remove any pre-existing print iframe
  const existingFrame = document.getElementById('mandala-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  // Create isolated, hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'mandala-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    console.error('No se pudo acceder al contexto de impresión.');
    return;
  }

  const html = generatePrintableHtml(goal);

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for DOM to finish rendering inside the iframe before triggering print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error al invocar impresión:', err);
    } finally {
      // Clean up iframe after user completes or cancels print dialog
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }
  }, 250);
}
