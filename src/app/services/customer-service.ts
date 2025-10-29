import { Injectable } from '@angular/core';
import { CustomerListResponse } from '../models/customerListResponse';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private httpClient: HttpClient) {}
  getCustomers(params: URLSearchParams) {
    const baseUrl = 'http://localhost:8091/searchservice/api/customer-search/search';
    const queryUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    console.log('Fetching customers with URL:', queryUrl);
    return this.httpClient.get<CustomerListResponse[]>(queryUrl);
  }
  
}
