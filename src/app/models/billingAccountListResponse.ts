export type BillingAccountListResponse = BillingAccount[]

export interface BillingAccount {
  id: string
  customerId: string
  addressId: string
  statusId: number
  typeId: number
  accountNumber: string
  accountName: string
  typeName: string
  statusName: string
}