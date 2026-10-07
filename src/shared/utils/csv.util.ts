export type ParseCsvParams = { content: string; delimiter?: string };
export type CsvRow = Record<string, string>;
export type ParsedCsv = { headers: string[]; rows: CsvRow[] };

const SUPPORTED_DELIMITERS = [';', ',', '\t', '|'];

export function detectDelimiter(firstLine: string): string {
  let best = ';';
  let bestCount = -1;
  for (const delimiter of SUPPORTED_DELIMITERS) {
    const count = firstLine.split(delimiter).length - 1;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

/** Parser CSV isomórfico com suporte a aspas duplas e quebras de linha escapadas. */
export function parseCsv({ content, delimiter }: ParseCsvParams): ParsedCsv {
  const clean = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const firstLineEnd = clean.indexOf('\n');
  const firstLine = firstLineEnd === -1 ? clean : clean.slice(0, firstLineEnd);
  const sep = delimiter ?? detectDelimiter(firstLine);

  const records: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    if (inQuotes) {
      if (char === '"' && clean[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === sep) {
      current.push(field.trim());
      field = '';
    } else if (char === '\n') {
      current.push(field.trim());
      records.push(current);
      current = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || current.length > 0) {
    current.push(field.trim());
    records.push(current);
  }

  const nonEmpty = records.filter((record) => record.some((value) => value.length > 0));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = nonEmpty[0].map((header, position) => header || `coluna_${position + 1}`);
  const rows = nonEmpty.slice(1).map((record) => {
    const row: CsvRow = {};
    headers.forEach((header, position) => {
      row[header] = record[position] ?? '';
    });
    return row;
  });

  return { headers, rows };
}
