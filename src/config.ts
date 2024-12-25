import { parse } from 'yaml';
import fs from 'node:fs/promises';
import { rootConfigSchema } from './config-schema';

export async function parseYamlConfig(filepath:string) {
    const configFileContent = await fs.readFile(filepath, 'utf8');
    const parsedConfig = parse (configFileContent);
    return JSON.stringify(parsedConfig);
}

export async function validateConfig(config:string) {
    const validConfig = await rootConfigSchema.parseAsync(JSON.parse(config))
    return validConfig;
}