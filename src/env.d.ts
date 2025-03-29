interface ImportMetaEnv extends Readonly<Record<string, string>> {
  readonly VITE_APP_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Navigator {
  getInstalledRelatedApps: () => Promise<Array<{ id: string }>>
}

interface LaunchParams {
  files: ReadableArray<FileSystemHandle>
}

interface LaunchQueue {
  setConsumer: (callback: (params: LaunchParams) => void) => void
}

interface Window {
  launchQueue?: LaunchQueue
}
