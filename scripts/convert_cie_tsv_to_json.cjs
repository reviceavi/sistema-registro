const fs = require('fs');
const path = require('path');

const tsvPath = path.resolve('/workspaces/sistema_registro/data/cie.tsv');
const jsonPath = path.resolve('/workspaces/sistema_registro/data/cie.json');

function normalizeHeader(h, idx) {
  if (!h || !h.trim()) return `col_${idx}`;
  // remove diacritics (only the combining diacritical marks)
  const removed = h.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // replace non-alphanum with underscore
  const sanitized = removed.replace(/[^0-9a-zA-Z]+/g, '_');
  // collapse underscores
  const collapsed = sanitized.replace(/_+/g, '_').replace(/^_|_$/g, '');
  const lower = collapsed.toLowerCase();
  return lower || `col_${idx}`;
}

try {
  const raw = fs.readFileSync(tsvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    console.error('El archivo TSV está vacío o no existe.');
    process.exit(2);
  }

  const headerLine = lines[0];
  const headers = headerLine.split('\t');
  const keys = headers.map((h, i) => normalizeHeader(h, i + 1));

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split('\t');
    const obj = {};
    for (let j = 0; j < row.length; j++) {
      const key = keys[j] || `col_${j+1}`;
      obj[key] = row[j] === undefined ? null : row[j].trim();
    }
    for (let k = 0; k < keys.length; k++) {
      if (!(keys[k] in obj)) obj[keys[k]] = null;
    }
    data.push(obj);
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Wrote ${data.length} records to ${jsonPath}`);
  console.log('Preview (first 5):');
  console.log(JSON.stringify(data.slice(0,5), null, 2));
  process.exit(0);
} catch (err) {
  console.error('Error converting TSV to JSON:', err.message);
  process.exit(1);
}
