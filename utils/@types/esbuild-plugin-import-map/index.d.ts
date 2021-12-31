// TODO( trygve-lie/esbuild-plugin-import-map#25 ): Remove when official definition is added.
declare module 'esbuild-plugin-import-map' {
  import type { PluginBuild } from 'esbuild';

  interface Plugin {
    name: 'importMap';
    setup: (build: PluginBuild) => void;
  }

  interface ImportMap {
    imports: Record<string, string>;
    scope: Record<string, Record<string, string>>;
  }

  export function plugin(): Plugin;
  export function clear(): void;
  export function load(
    importMaps?: string | string[] | ImportMap
  ): Promise<void>;
}
