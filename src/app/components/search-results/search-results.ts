import { Component, signal } from '@angular/core';
import { SearchResultItem } from "../search-result-item/search-result-item";
import { CustomerListResponse } from '../../models/customerListResponse';
import { CustomerService } from '../../services/customer-service';

@Component({
  selector: 'app-search-results',
  imports: [SearchResultItem],
  templateUrl: './search-results.html',
  styleUrl: './search-results.scss',
})
export class SearchResults {
  customersResponse = signal<CustomerListResponse[] | undefined>(undefined);

  constructor(private customerService: CustomerService) {}

  ngOnInit() {
    this.fetchCustomers();
  }

  fetchCustomers() {
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.customersResponse.set(response);
      },
      error: (error) => {
        console.error('Error fetching customers:', error);
      }
    })
  }
}
