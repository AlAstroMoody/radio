interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv extends Readonly<Record<string, string>> {
  readonly VITE_APP_API_URL: string
}

interface LaunchParams {
  files: ReadableArray<FileSystemHandle>
}

interface LaunchQueue {
  setConsumer: (callback: (params: LaunchParams) => void) => void
}

interface Navigator {
  getInstalledRelatedApps: () => Promise<Array<{ id: string }>>
}

interface Window {
  launchQueue?: LaunchQueue
}
