import { Injectable } from '@angular/core';
import { CustomerListResponse } from '../models/customerListResponse';
import { HttpClient } from '@angular/common/http';
import { CreateCustomerRequest } from '../models/createCustomerRequest';
import { CreateContactMediumsRequest } from '../models/createContactMediumsRequest';
import { CreateAddressRequest } from '../models/createAddressRequest';
import { CreateCustomerResponse } from '../models/createCustomerResponse';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private httpClient: HttpClient) {}

  getCustomers(params: URLSearchParams) {
    const baseUrl = 'http://localhost:8091/searchservice/api/customer-search/search';
    const queryUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    const token = localStorage.getItem('token');
    console.log('Fetching customers with URL:', queryUrl);
    return this.httpClient.get<CustomerListResponse[]>(queryUrl, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  createCustomer(request: CreateCustomerRequest) {
    const url = 'http://localhost:8091/customerservice/api/individual-customers/';
    const token = localStorage.getItem('token');
    console.log('Creating customer with request:', request);
    return this.httpClient.post<CreateCustomerResponse>(url, request, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  getCities() {
    const url = 'http://localhost:8091/customerservice/api/cities/';
    const token = localStorage.getItem('token');
    return this.httpClient.get<any>(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  createContactMediums(request: CreateContactMediumsRequest) {
    const url = 'http://localhost:8091/customerservice/api/contact-mediums/';
    const token = localStorage.getItem('token');
    return this.httpClient.post<any>(url, request, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  createAddress(request: CreateAddressRequest) {
    const url = 'http://localhost:8091/customerservice/api/addresses/';
    const token = localStorage.getItem('token');
    console.log('Creating address with request:', request);
    return this.httpClient.post<any>(url, request, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

}
