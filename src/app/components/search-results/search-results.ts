import { Component, computed, signal } from '@angular/core';
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

  // Sayfalama için signal'lar
  currentPage = signal(1);
  pageSize = signal(20); // Her sayfada 20 müşteri
  
  // Toplam sayfa sayısı (computed)
  totalPages = computed(() => {
    const list = this.customersResponse() ?? [];
    return Math.ceil(list.length / this.pageSize());
  });

  // Mevcut sayfadaki müşteriler (computed)
  paginatedCustomers = computed(() => {
    const list = this.customersResponse() ?? [];
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return list.slice(start, end);
  });
  
  
  // Sayfa değiştirme metodları
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
  
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }
  
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }
  
  // İlk ve son sayfa kontrolü
  isFirstPage = computed(() => this.currentPage() === 1);
  isLastPage = computed(() => this.currentPage() === this.totalPages());

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
