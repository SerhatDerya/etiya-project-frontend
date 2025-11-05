export interface CustomerListResponse {
  id: string
  customerNumber: string
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  gender: string
  motherName: string
  fatherName: string
  natId: string
  contactMediums: ContactMedium[]
  addressSearches: AddressSearch[]
}

export interface ContactMedium {
  id: string
  email: string
  homePhone: string
  mobilePhone: string
  fax: string
  customerId: string
}

export interface AddressSearch {
  id: string
  title: string
  street: string
  houseNumber: string
  description: string
  isDefault: boolean
  customerId: string
  cityId: string
  cityName: string
}