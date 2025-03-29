interface ImportMetaEnv extends Readonly<Record<string, string>> {
  readonly VITE_APP_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Navigator {
  getInstalledRelatedApps: () => Promise<Array<{ id: string }>>
}
