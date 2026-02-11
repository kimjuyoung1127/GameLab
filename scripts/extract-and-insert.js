/**
 * Extract JSON data from MCP tool result files and generate chunked INSERT SQL files
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(
  'C:\\Users\\ezen601\\.claude\\projects\\c--Users-ezen601-Desktop-Jason-GameLab',
  '3fcc2fbe-0450-4dee-8629-4f4e26d9799e\\tool-results'
);

const OUT_DIR = path.join(__dirname, 'sql-chunks');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// File mappings: table -> [filenames]
const FILES = {
  goertzel_test_monitor: [
    'mcp-supabase-execute_sql-1770786629057.txt',
    'mcp-supabase-execute_sql-1770786630461.txt',
  ],
  sound_logs: [
    'mcp-supabase-execute_sql-1770786622454.txt',
    'mcp-supabase-execute_sql-1770786624098.txt',
    'mcp-supabase-execute_sql-1770786625952.txt',
    'mcp-supabase-execute_sql-1770786627459.txt',
  ],
  telemetry_logs: [
    'mcp-supabase-execute_sql-1770786631863.txt',
    'mcp-supabase-execute_sql-1770786633357.txt',
    'mcp-supabase-execute_sql-1770786635025.txt',
  ],
};

function extractRows(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const outer = JSON.parse(raw);
  let text = outer[0].text;

  // The text field is a double-encoded JSON string (starts with ")
  // Need to JSON.parse it to unescape \\n -> \n, \\\" -> \"
  if (text.startsWith('"')) {
    text = JSON.parse(text);
  }

  // Extract content between <untrusted-data-...> tags
  const match = text.match(/<untrusted-data-[^>]+>\n([\s\S]*?)\n<\/untrusted-data/);
  if (!match) {
    console.error('No data found in', filePath);
    return [];
  }

  const innerJson = JSON.parse(match[1]);
  // Result is [{json_agg: [...rows...]}]
  const rows = innerJson[0].json_agg;
  if (!rows) return [];
  return rows;
}

function sqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  // string
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateInsertSQL(tableName, rows, chunkSize = 50) {
  if (rows.length === 0) return [];

  const columns = Object.keys(rows[0]);
  // Quote column names that contain dots
  const quotedCols = columns.map(c => /[.\s]/.test(c) ? `"${c}"` : c);

  const chunks = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const batch = rows.slice(i, i + chunkSize);
    const values = batch.map(row => {
      const vals = columns.map(col => sqlValue(row[col]));
      return `(${vals.join(', ')})`;
    });

    const sql = `INSERT INTO public.${tableName} (${quotedCols.join(', ')}) VALUES\n${values.join(',\n')};`;
    chunks.push(sql);
  }

  return chunks;
}

// Main
let totalRows = 0;
let totalChunks = 0;

for (const [table, files] of Object.entries(FILES)) {
  console.log(`\nProcessing ${table}...`);
  let allRows = [];

  for (const file of files) {
    const filePath = path.join(BASE, file);
    if (!fs.existsSync(filePath)) {
      console.error(`  File not found: ${file}`);
      continue;
    }
    const rows = extractRows(filePath);
    console.log(`  ${file}: ${rows.length} rows`);
    allRows = allRows.concat(rows);
  }

  console.log(`  Total: ${allRows.length} rows`);
  totalRows += allRows.length;

  const chunks = generateInsertSQL(table, allRows, 50);
  totalChunks += chunks.length;

  chunks.forEach((sql, idx) => {
    const outFile = path.join(OUT_DIR, `${table}_${String(idx).padStart(3, '0')}.sql`);
    fs.writeFileSync(outFile, sql, 'utf8');
  });

  console.log(`  Generated ${chunks.length} SQL chunk files`);
}

console.log(`\n=== Summary ===`);
console.log(`Total rows: ${totalRows}`);
console.log(`Total SQL chunks: ${totalChunks}`);
console.log(`Output directory: ${OUT_DIR}`);
