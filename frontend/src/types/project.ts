export interface Project {
  id: string
  name: string
  description: string
  language: string
  filesCount: number
  lastGenerated?: Date
  createdAt: Date
  status: 'active' | 'archived'
}
