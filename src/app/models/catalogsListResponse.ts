export type CatalogsListResponse = Catalog[]

export interface Catalog {
  id: string
  name: string
  parentId?: string
}