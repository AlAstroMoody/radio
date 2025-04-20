interface FilePickerOptions {
  multiple?: boolean
  types?: Array<{
    accept: Record<string, string[]>
    description: string
  }>
}

interface FileSystemFileHandle {
  getFile: () => Promise<File>
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv extends Readonly<Record<string, string>> {
  readonly VITE_APP_API_URL: string
}

interface LaunchParams {
  files: FileSystemFileHandle[]
}

interface LaunchQueue {
  setConsumer: (callback: (params: LaunchParams) => void) => void
}

interface Navigator {
  getInstalledRelatedApps: () => Promise<Array<{ id: string }>>
}

interface Window {
  launchQueue?: LaunchQueue
  showOpenFilePicker: (options?: FilePickerOptions) => Promise<FileSystemFileHandle[]>
}
