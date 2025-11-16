export type ProductOffersListResponse = ProductOffer[]

export interface ProductOffer {
  id: string
  name: string
  description: string
  startDate: string
  endDate?: string
  discountRate: number
  status: string
  productId: string
}