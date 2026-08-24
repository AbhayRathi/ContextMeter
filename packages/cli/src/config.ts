import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import type { ContextBlock } from "@context-meter/shared";

export const ConfigSchema = z.object({
  apiUrl: z.string().url().default("http://localhost:8080"),
  apiKey: z.string().optional(),
  task: z.string().min(1),
  contextBlocksFile: z.string().min(1),
  failOn: z
    .object({
      conflict: z.boolean().default(false),
      minScore: z.number().min(0).max(100).optional(),
    })
    .default({}),
});

export type CliConfig = z.infer<typeof ConfigSchema>;

export interface LoadedConfig {
  config: CliConfig;
  contextBlocks: ContextBlock[];
}

/**
 * Loads contextmeter.config.json plus the ContextBlock[] file it points at.
 * contextBlocksFile is resolved relative to the config file's own directory,
 * not the process cwd, so a config can be run from anywhere.
 */
export function loadConfig(configPath: string): LoadedConfig {
  const raw: unknown = JSON.parse(readFileSync(configPath, "utf-8"));
  const config = ConfigSchema.parse(raw);
  const blocksPath = resolve(dirname(configPath), config.contextBlocksFile);
  const contextBlocks = JSON.parse(readFileSync(blocksPath, "utf-8")) as ContextBlock[];
  return { config, contextBlocks };
}
