import { Component, computed, signal } from '@angular/core';
import { SearchResultItem } from "../search-result-item/search-result-item";
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CustomerListResponse } from '../../models/customerListResponse';
import { CustomerService } from '../../services/customer-service';


@Component({
  selector: 'app-search',
  imports: [SearchResultItem, ReactiveFormsModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {

  searchForm !: FormGroup;
  
  primaryFields = ['nationalId', 'customerId', 'accountNumber', 'gsmNumber', 'orderNumber'];

  customersResponse = signal<CustomerListResponse[] | undefined>(undefined);
  
  constructor(private customerService: CustomerService, private fb : FormBuilder) {}

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

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      nationalId: [''],
      customerId: [''],
      accountNumber: [''],
      gsmNumber: [''],
      orderNumber: [''],
      firstName: [''],
      lastName: [''],
    });

    this.setupPrimaryFieldsControl();
    this.isDirty();
  }

  setupPrimaryFieldsControl(): void {
    this.primaryFields.forEach(fieldName => {
      this.searchForm.get(fieldName)?.valueChanges.subscribe(() => {
        this.updateFieldStates(fieldName);
    });
    });
  }

  updateFieldStates(changedField: string): void {
    if (this.searchForm.get(changedField)?.value.toString().trim() !== '') {
      this.primaryFields.forEach(fieldName => {
        if (fieldName !== changedField) {
          this.searchForm.get(fieldName)?.disable({ emitEvent: false });
        }
      });
    }
    else {
      this.primaryFields.forEach(fieldName => {
        this.searchForm.get(fieldName)?.enable({ emitEvent: false });
      });
    }
  }

  onSubmit(): void {
    console.log(this.searchForm.value);
    this.fetchCustomers();
  }

  onClear(): void {
    this.searchForm.reset();
    this.primaryFields.forEach(fieldName => {
      this.searchForm.get(fieldName)?.enable({ emitEvent: false });
    });
  }

  isDirty(): boolean {
    return Object.keys(this.searchForm.controls).some(fieldName => {
      const value = this.searchForm.get(fieldName)?.value;
      return value && value.toString().trim() !== '';
    });
  }

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

  fetchCustomers() {
    
    const values = this.searchForm?.value ?? {};
    const params = new URLSearchParams();

    Object.keys(values).forEach(key => {
      const val = values[key];
      if (val !== null && val !== undefined) {
      const str = val.toString().trim();
      if (str !== '') {
        params.append(key, str);
      }
      }
    });


    this.customerService.getCustomers(params).subscribe({
      next: (response) => {
        this.customersResponse.set(response);
      },
      error: (error) => {
        console.error('Error fetching customers:', error);
      }
    })
  }

}
