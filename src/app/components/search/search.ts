import { Component, computed, signal } from '@angular/core';
import { SearchResultItem } from "../search-result-item/search-result-item";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CustomerListResponse } from '../../models/customerListResponse';
import { CustomerService } from '../../services/customer-service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-search',
  imports: [SearchResultItem, ReactiveFormsModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {

  searchForm !: FormGroup;
  
  primaryFields = ['natId', 'customerId', 'accountNumber', 'gsmNumber', 'orderNumber'];

  customersResponse = signal<CustomerListResponse[] | undefined>(undefined);

  // Form değişikliklerini takip etmek için signal
  formChanges = signal<number>(0);

  constructor(private customerService: CustomerService, private fb : FormBuilder, private router : Router) {}

  // Sayfalama için signal'lar
  currentPage = signal(1);
  pageSize = signal(20); // Her sayfada 20 müşteri

  isLoading = signal(false);

  // Form geçerli mi kontrolü (computed) - Sadece doldurulmuş alanları kontrol et
  isFormValid = computed(() => {
    // formChanges'i oku (reactive olması için)
    this.formChanges();

    if (!this.searchForm || !this.isDirty()) {
      return false;
    }

    // Sadece doldurulmuş alanların valid olup olmadığını kontrol et
    return Object.keys(this.searchForm.controls).every(fieldName => {
      const control = this.searchForm.get(fieldName);
      const value = control?.value;
      
      // Eğer alan boşsa, geçerli kabul et
      if (!value || value.toString().trim() === '') {
        return true;
      }
      
      // Eğer alan doluysa, valid olup olmadığını kontrol et
      return control?.valid ?? true;
    });
  });
  
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
      natId: ['', Validators.pattern('^\\d{10}[02468]$')],
      customerId: [''],
      accountNumber: [''],
      gsmNumber: ['', Validators.pattern('^\\+?\\d{10,15}$')],
      orderNumber: [''],
      firstName: [''],
      lastName: [''],
    });

    this.setupPrimaryFieldsControl();

    // Form değişikliklerini dinle
    this.searchForm.valueChanges.subscribe(() => {
      this.formChanges.update(v => v + 1);
    });

    this.isDirty();
    this.currentPage.set(0);
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
    if(this.searchForm.valid){
      //console.log(this.searchForm.value);
      this.fetchCustomers();
      this.currentPage.set(1);
    }else{
      Object.keys(this.searchForm.controls).forEach(field => {
        if (this.searchForm.get(field)?.invalid) {
          alert(`${field} field is invalid!`);
        }
      });
      //alert('Form geçersiz');
    }
  }

  onClear(): void {
    this.searchForm.reset();
    this.primaryFields.forEach(fieldName => {
      this.searchForm.get(fieldName)?.enable({ emitEvent: false });
    });
    // Form değişikliğini tetikle
    this.formChanges.update(v => v + 1);
    //this.customersResponse.set(undefined);
    //this.currentPage.set(0);
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

  onCreateCustomer(): void {
    this.router.navigateByUrl('/b2c/create-customer');
  }
  
  // İlk ve son sayfa kontrolü
  isFirstPage = computed(() => {
    if (this.totalPages() === 0) {
      return true;
    }
    return this.currentPage() === 1;
  });
  isLastPage = computed(() => this.currentPage() === this.totalPages());

  fetchCustomers() {

    this.isLoading.set(true);
    
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
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error fetching customers:', error);
        this.isLoading.set(false);
      }
    })
  }

}
