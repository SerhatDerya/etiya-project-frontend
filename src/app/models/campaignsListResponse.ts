export type CampaignsListResponse = Campaign[]

export interface Campaign {
  id: string
  name: string
  startDate: string
  endDate?: string
  discountRate: number
}
