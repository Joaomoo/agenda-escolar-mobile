const WEEKDAYS = [
  { key: 'SEGUNDA', label: 'Segunda-feira', index: 0, pattern: /segunda(?:\s*-?\s*feira)?/i },
  { key: 'TERCA', label: 'Terça-feira', index: 1, pattern: /ter[cç]a(?:\s*-?\s*feira)?/i },
  { key: 'QUARTA', label: 'Quarta-feira', index: 2, pattern: /quarta(?:\s*-?\s*feira)?/i },
  { key: 'QUINTA', label: 'Quinta-feira', index: 3, pattern: /quinta(?:\s*-?\s*feira)?/i },
  { key: 'SEXTA', label: 'Sexta-feira', index: 4, pattern: /sexta(?:\s*-?\s*feira)?/i },
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getBoundingBox(node) {
  const box = node?.boundingBox || node?.frame || node?.rect || {};
  const x = Number(box.x ?? box.left ?? box.origin?.x);
  const y = Number(box.y ?? box.top ?? box.origin?.y);
  const width = Number(box.width ?? (box.right != null ? box.right - x : 0));
  const height = Number(box.height ?? (box.bottom != null ? box.bottom - y : 0));
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return { x, y, width, height, cx: x + width / 2, cy: y + height / 2 };
}

function flattenOcrLines(recognition) {
  const blocks = Array.isArray(recognition?.blocks) ? recognition.blocks : [];
  const output = [];

  blocks.forEach((block) => {
    if (Array.isArray(block?.lines) && block.lines.length) {
      block.lines.forEach((line) => {
        const text = String(line?.text || '').trim();
        const box = getBoundingBox(line);
        if (text && box) output.push({ text, ...box });
      });
      return;
    }

    const text = String(block?.text || '').trim();
    const box = getBoundingBox(block);
    if (text && box) output.push({ text, ...box });
  });

  return output;
}

function findWeekdayHeaders(lines) {
  const found = [];
  for (const day of WEEKDAYS) {
    const candidates = lines
      .filter((line) => day.pattern.test(normalizeText(line.text)))
      .sort((a, b) => a.cy - b.cy);
    if (candidates.length) found.push({ ...day, ...candidates[0] });
  }
  return found.sort((a, b) => a.cx - b.cx);
}

function findPeriodRows(lines, mondayCenterX) {
  const rows = new Map();
  const pattern = /\b(\d{1,2})\s*(?:[aºª°o])?\s*aula\b/i;

  lines.forEach((line) => {
    if (line.cx >= mondayCenterX) return;
    const match = normalizeText(line.text).match(pattern);
    if (!match) return;
    const period = Number(match[1]);
    if (period < 1 || period > 15) return;
    const current = rows.get(period);
    if (!current || line.cy < current.cy) rows.set(period, { period, cy: line.cy });
  });

  return [...rows.values()].sort((a, b) => a.period - b.period);
}

function getDayBounds(headers) {
  const sorted = [...headers].sort((a, b) => a.cx - b.cx);
  return sorted.map((header, index) => {
    const previous = sorted[index - 1];
    const next = sorted[index + 1];
    const left = previous ? (previous.cx + header.cx) / 2 : header.cx - (next.cx - header.cx) / 2;
    const right = next ? (header.cx + next.cx) / 2 : header.cx + (header.cx - previous.cx) / 2;
    return { ...header, left, right };
  });
}

function rowDistanceLimit(rows, index) {
  const previousGap = index > 0 ? rows[index].cy - rows[index - 1].cy : Infinity;
  const nextGap = index < rows.length - 1 ? rows[index + 1].cy - rows[index].cy : Infinity;
  const nearestGap = Math.min(previousGap, nextGap);
  return Number.isFinite(nearestGap) ? Math.max(18, nearestGap * 0.47) : 40;
}

function extractTimes(text) {
  const matches = [...String(text || '').matchAll(/\b(\d{1,2})\s*(?:h|:)\s*(\d{2})\s*(?:min)?/gi)];
  return matches.slice(0, 2).map((match) => `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`);
}

function splitSubjectAndTeacher(text) {
  const rawLines = String(text || '')
    .split(/[\n\r]+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const combined = rawLines.join(' ').trim();
  const teacherMatch = combined.match(/prof(?:essor)?\s*(?:[.ºª°ao])?\s*[^\n]*/i);
  const teacher = teacherMatch ? teacherMatch[0].replace(/\s+/g, ' ').trim() : '';
  const subjectText = teacherMatch
    ? combined.replace(teacherMatch[0], ' ').replace(/\s+/g, ' ').trim()
    : combined;

  return {
    subject: subjectText.replace(/[|•·]+$/g, '').trim(),
    teacher,
  };
}

function resolveCellText(items) {
  return items
    .sort((a, b) => a.cy - b.cy || a.cx - b.cx)
    .map((item) => item.text)
    .join('\n')
    .replace(/\b(?:lanche|intervalo)\b/gi, '')
    .trim();
}

function findInterval(lines, leftBoundary, headerY) {
  const label = lines.find((line) => {
    const normalized = normalizeText(line.text);
    return line.cx < leftBoundary && line.cy > headerY && /\b(intervalo|lanche)\b/.test(normalized);
  });
  if (!label) return null;

  const nearby = lines
    .filter((line) => line.cx < leftBoundary && Math.abs(line.cy - label.cy) < 60)
    .map((line) => line.text)
    .join(' ');
  const times = extractTimes(nearby);
  return {
    label: 'Lanche',
    horarioInicial: times[0] || '',
    horarioFinal: times[1] || '',
  };
}

export function parseCimTimetable(recognition) {
  const lines = flattenOcrLines(recognition);
  if (!lines.length) {
    throw new Error('O OCR não retornou linhas com posição. Verifique se a página do PDF está legível.');
  }

  const headers = findWeekdayHeaders(lines);
  const minimumDays = WEEKDAYS.length;
  if (headers.length !== minimumDays) {
    throw new Error(`Não consegui identificar os cinco dias da semana. Identifiquei ${headers.length}. Tente um PDF mais nítido e alinhado.`);
  }

  const sortedHeaders = [...headers].sort((a, b) => a.cx - b.cx);
  const leftBoundary = (sortedHeaders[0].cx + sortedHeaders[1].cx) / 2;
  const headerY = Math.max(...headers.map((header) => header.cy));
  const periodRows = findPeriodRows(lines, sortedHeaders[0].cx);

  if (periodRows.length < 1) {
    throw new Error('Os números dos períodos não foram reconhecidos. Não é seguro montar a programação automaticamente.');
  }

  const dayBounds = getDayBounds(headers);
  const periods = periodRows.map((row, index) => {
    const limit = rowDistanceLimit(periodRows, index);
    const leftColumnLines = lines.filter(
      (line) => line.cx < leftBoundary && line.cy > headerY && Math.abs(line.cy - row.cy) <= limit,
    );
    const timeText = leftColumnLines.map((line) => line.text).join(' ');
    const times = extractTimes(timeText);
    return {
      period: row.period,
      horarioInicial: times[0] || '',
      horarioFinal: times[1] || '',
      _cy: row.cy,
      _limit: limit,
    };
  });

  const days = dayBounds.map((day) => ({
    key: day.key,
    label: day.label,
    index: day.index,
    classes: periods.map((period, rowIndex) => {
      const candidates = lines.filter((line) =>
        line.cx >= day.left &&
        line.cx < day.right &&
        line.cy > headerY &&
        Math.abs(line.cy - period._cy) <= period._limit &&
        !/\b(lanche|intervalo)\b/i.test(normalizeText(line.text)),
      );
      const cellText = resolveCellText(candidates);
      const isVacant = /#{2,}/.test(cellText.replace(/\s/g, ''));
      const parsed = splitSubjectAndTeacher(cellText.replace(/#{2,}/g, '').trim());

      if (isVacant) {
        return {
          period: period.period,
          horarioInicial: period.horarioInicial,
          horarioFinal: period.horarioFinal,
          materia: 'Aula vaga',
          professor: '',
          tipo: 'AULA_VAGA',
          textoReconhecido: cellText,
        };
      }

      const subject = parsed.subject.replace(/\s+/g, ' ').trim();
      return {
        period: period.period,
        horarioInicial: period.horarioInicial,
        horarioFinal: period.horarioFinal,
        materia: subject,
        professor: parsed.teacher,
        tipo: subject ? 'AULA' : 'REVISAO',
        textoReconhecido: cellText,
      };
    }),
  }));

  const interval = findInterval(lines, leftBoundary, headerY);
  const titleLine = lines.find((line) => /\b\d\s*(?:º|°)?\s*em\s*[a-z]\b/i.test(line.text));

  return {
    turmaNome: titleLine?.text?.trim() || '',
    periods: periods.map(({ _cy, _limit, ...period }) => period),
    days,
    interval,
    ocrText: String(recognition?.text || ''),
  };
}

export function parseBrazilianMondayDate(value) {
  const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) throw new Error('Informe a segunda-feira no formato DD/MM/AAAA.');

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error('A data informada não existe.');
  }
  if (date.getDay() !== 1) {
    throw new Error('A data inicial precisa ser uma segunda-feira.');
  }

  return date;
}

export function formatLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addLocalDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function isValidClock(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || '').trim());
}
