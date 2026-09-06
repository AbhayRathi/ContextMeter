import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATASETS_SERVER = "https://datasets-server.huggingface.co";
const PAGE_SIZE = 100;
const CACHE_DIR = join(fileURLToPath(new URL("../.cache", import.meta.url)));

/**
 * Fetches every row of one (dataset, config, split) from HuggingFace's
 * datasets-server `/rows` endpoint, paginating in blocks of PAGE_SIZE, and
 * caches the result to disk so a second run (or a flaky network) doesn't
 * re-hit the API. Rows come back as plain JSON — no python `datasets`
 * library or parquet parsing needed.
 */
export async function fetchHfRows<Row>(
  dataset: string,
  config: string,
  split: string,
  limit: number
): Promise<Row[]> {
  const cachePath = join(
    CACHE_DIR,
    `${dataset.replace("/", "__")}__${config}__${split}__${limit}.json`
  );

  const cached = await readCache<Row[]>(cachePath);
  if (cached) return cached;

  const rows: Row[] = [];
  let offset = 0;
  while (rows.length < limit) {
    const length = Math.min(PAGE_SIZE, limit - rows.length);
    const url =
      `${DATASETS_SERVER}/rows?dataset=${encodeURIComponent(dataset)}` +
      `&config=${encodeURIComponent(config)}&split=${encodeURIComponent(split)}` +
      `&offset=${offset}&length=${length}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `HF datasets-server request failed (${res.status}) for ${dataset}/${config}/${split} at offset ${offset}: ${await res.text().catch(() => "")}`
      );
    }
    const body = (await res.json()) as { rows: Array<{ row: Row }>; num_rows_total?: number };
    if (body.rows.length === 0) break;

    for (const r of body.rows) rows.push(r.row);
    offset += body.rows.length;

    if (body.num_rows_total !== undefined && offset >= body.num_rows_total) break;
  }

  await writeCache(cachePath, rows);
  return rows;
}

async function readCache<T>(path: string): Promise<T | null> {
  try {
    const text = await readFile(path, "utf-8");
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function writeCache(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data), "utf-8");
}
