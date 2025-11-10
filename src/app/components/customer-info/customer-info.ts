import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer-service';
import { CustomerListResponse, AddressSearch, ContactMedium } from '../../models/customerListResponse';
import { ActivatedRoute, Router } from '@angular/router';
import { Account, AccountItem } from './account-item/account-item';
import { BillingAccountSearch } from '../../models/customerListResponse';

@Component({
  selector: 'app-customer-info',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AccountItem],
  templateUrl: './customer-info.html',
  styleUrls: ['./customer-info.scss']
})
export class CustomerInfo implements OnInit {

  currentStep = 1;
  customerForm!: FormGroup;
  customerId: string = '';

  editingSteps: { [key: number]: boolean } = { 1: false, 2: false, 3: false, 4: false };
  formBackup: any = {};

  addressList: AddressSearch[] = [];
  billingAccounts: BillingAccountSearch[] = [];

  currentAddressPage = 1;
  addressesPerPage = 2;

  openedAccount: string | null = null;

  customerInfoControls = ['firstName', 'lastName', 'gender', 'motherName', 'middleName', 'birthDate', 'fatherName', 'nationalityId'];
  customerAccountControls: string[] = [];
  addressInfoControls: string[] = [];
  contactMediumControls = ['email', 'mobilePhone', 'homePhone', 'fax'];

  private labels: { [key: string]: string } = {
    firstName: 'First Name',
    lastName: 'Last Name',
    gender: 'Gender',
    motherName: 'Mother Name',
    middleName: 'Middle Name (Optional)',
    birthDate: 'Birth Date',
    fatherName: 'Father Name',
    nationalityId: 'Nationality ID',
    email: 'E-mail',
    mobilePhone: 'Mobile Phone',
    homePhone: 'Home Phone (Optional)',
    fax: 'Fax (Optional)'
  };

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCustomerData();
    this.disableFormControls();
  }

  initializeForm(): void {
    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      motherName: [''],
      middleName: [''],
      birthDate: ['', Validators.required],
      fatherName: [''],
      nationalityId: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]],

      account: this.fb.group({}),
      address: this.fb.group({}),

      email: ['', [Validators.required, Validators.email]],
      mobilePhone: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      homePhone: [''],
      fax: ['']
    });
  }

  /**
   * Müşteri verisini yükler ve form + adres + hesap bilgilerini doldurur.
   */
  loadCustomerData(): void {
    const params = new URLSearchParams();
    params.append('id', localStorage.getItem('selectedCustomerId') || '');

    this.customerService.getCustomers(params).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          const customerData = response[0];
          console.log('Müşteri verisi:', customerData);
          setTimeout(() => this.cd.detectChanges());
          this.patchCustomerInfo(customerData);

          // 👇 Artık hesaplar da bu nesnenin içinden geliyor
          this.billingAccounts = customerData.billingAccountSearches || [];
          console.log('Billing Accounts (müşteriden):', this.billingAccounts);


        } else {
          alert('Müşteri verisi bulunamadı.');
        }
      },
      error: (error) => {
        alert('Müşteri verisi yüklenirken bir hata oluştu.');
        console.error('Müşteri verisi yüklenirken hata oluştu:', error);
      }
    });
  }

  /**
   * API'dan gelen müşteri verisini forma, adres listesine ve hesap listesine uygular.
   */
  private patchCustomerInfo(data: CustomerListResponse): void {

    this.customerId = data.id;

    // 1️⃣ Müşteri Temel Bilgileri
    this.customerForm.patchValue({
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      birthDate: data.dateOfBirth,
      gender:
        data.gender === 'K' || data.gender === 'Female'
          ? 'female'
          : data.gender === 'E' || data.gender === 'Male'
          ? 'male'
          : 'other',
      motherName: data.motherName,
      fatherName: data.fatherName,
      nationalityId: data.natId
    });

    // 2️⃣ İletişim Bilgileri
    const contact: Partial<ContactMedium> =
      data.contactMediums && data.contactMediums.length > 0
        ? data.contactMediums[0]
        : {};
    this.customerForm.patchValue({
      email: contact.email || '',
      mobilePhone: contact.mobilePhone || '',
      homePhone: contact.homePhone || '',
      fax: contact.fax || ''
    });

    // 3️⃣ Adres Bilgileri
    this.addressList = data.addressSearches || [];

    // 4️⃣ Hesap Bilgileri (yeni)
    this.billingAccounts = data.billingAccountSearches || [];

    // 5️⃣ Yedekleme
    this.formBackup = this.customerForm.value;
  }

  deleteCustomer(): void {
    const confirmDelete = confirm('Are you sure you want to delete this customer? This action cannot be undone.');
    if (confirmDelete) {
      // Müşteri silme işlemi
      this.customerService.deleteCustomer(this.customerId).subscribe({
        next: () => {
          alert('Customer successfully deleted.');
          this.router.navigate(['/']);
        },
        error: (error) => {
          alert('An error occurred while deleting the customer.');
          console.error('An error occurred while deleting the customer:', error);
        }
      });
    }
  }

  // --- Hesap Yönetimi ---
  toggleAccount(accountNumber: string): void {
    this.openedAccount = this.openedAccount === accountNumber ? null : accountNumber;
  }

  createNewAccount(): void {
    alert('Create New Account tıklandı (işlev eklenecek).');
  }

  editAccount(account: Account): void {
    alert(`Edit account: ${account.accountName}`);
  }

  deleteAccount(account: Account): void {
    alert(`Delete account: ${account.accountName}`);
  }

  // --- Adres Sayfalama ---
  getDisplayedAddresses(): AddressSearch[] {
    const startIndex = (this.currentAddressPage - 1) * this.addressesPerPage;
    const endIndex = startIndex + this.addressesPerPage;
    return this.addressList.slice(startIndex, endIndex) as AddressSearch[];
  }

  nextAddressPage(): void {
    const totalPages = Math.ceil(this.addressList.length / this.addressesPerPage);
    if (this.currentAddressPage < totalPages) {
      this.currentAddressPage++;
    }
  }

  prevAddressPage(): void {
    if (this.currentAddressPage > 1) {
      this.currentAddressPage--;
    }
  }

  get totalAddressPages(): number {
    return Math.ceil(this.addressList.length / this.addressesPerPage);
  }

  shouldShowNextArrow(): boolean {
    return this.addressList.length > this.addressesPerPage && this.currentAddressPage < this.totalAddressPages;
  }

  shouldShowPrevArrow(): boolean {
    return this.addressList.length > this.addressesPerPage && this.currentAddressPage > 1;
  }

  // --- Diğer Form Kontrol Metotları (değişmedi) ---
  selectStep(step: number): void {
    if (this.currentStep !== step) {
      if (this.editingSteps[this.currentStep]) {
        console.warn(`Lütfen önce adım ${this.currentStep} üzerindeki düzenlemeyi kaydedin veya iptal edin.`);
        return;
      }
      this.currentStep = step;
      if (step === 3) this.currentAddressPage = 1;
    }
  }

  enableEdit(step: number): void {
    if (step === 2 || step === 3) return;
    this.editingSteps[step] = true;
    this.formBackup = JSON.parse(JSON.stringify(this.customerForm.value));
    this.enableFormControls(step);
  }

  cancelEdit(step: number): void {
    this.editingSteps[step] = false;
    this.customerForm.patchValue(this.formBackup);
    this.disableFormControls(step);
    this.customerForm.markAsPristine();
    this.customerForm.markAsUntouched();
  }

  saveChanges(step: number): void {
    if (this.isStepValid(step)) {
      this.editingSteps[step] = false;
      this.disableFormControls(step);
      this.formBackup = JSON.parse(JSON.stringify(this.customerForm.value));
      console.log(`Adım ${step} kaydedildi. Yeni Veriler:`, this.customerForm.value);
      alert(`Adım ${step} bilgileri başarıyla güncellendi!`);
    } else {
      console.error(`Adım ${step} geçersiz. Lütfen zorunlu alanları doldurun.`);
      this.markControlsAsTouched(step);
    }
  }

  private disableFormControls(step: number = 1): void {
    const controls = this.getControlsForStep(step);
    controls.forEach(c => this.customerForm.get(c)?.disable());
  }

  private enableFormControls(step: number): void {
    const controls = this.getControlsForStep(step);
    controls.forEach(c => this.customerForm.get(c)?.enable());
  }

  private getControlsForStep(step: number): string[] {
    switch (step) {
      case 1:
        return this.customerInfoControls;
      case 2:
        return this.customerAccountControls;
      case 3:
        return [];
      case 4:
        return this.contactMediumControls;
      default:
        return [...this.customerInfoControls, ...this.contactMediumControls];
    }
  }

  isStepValid(step: number): boolean {
    const controls = this.getControlsForStep(step);
    if (step === 2 || step === 3) return true;
    return controls.every(c => this.customerForm.get(c)?.valid);
  }

  private markControlsAsTouched(step: number): void {
    const controls = this.getControlsForStep(step);
    controls.forEach(c => this.customerForm.get(c)?.markAsTouched());
  }

  isEditingStep(step: number): boolean {
    return this.editingSteps[step];
  }

  getLabel(controlName: string): string {
    return this.labels[controlName] || controlName;
  }

  getInputType(controlName: string): string {
    switch (controlName) {
      case 'birthDate':
        return 'date';
      case 'email':
        return 'email';
      default:
        return 'text';
    }
  }
}
