import { Injectable } from '@angular/core';
import { CustomerListResponse } from '../models/customerListResponse';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private httpClient: HttpClient) {}
  getCustomers() {
    return this.httpClient.get<CustomerListResponse[]>('http://localhost:8091/customerservice/api/customers/');
  }
  
}
