export interface Category {
  description: string
  id: string
  name: string
}

export interface Wave {
  category?: string
  description?: string
  id: number
  name: string
  src: string
}
