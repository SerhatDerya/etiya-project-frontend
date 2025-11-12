import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer-service';
import { CustomerListResponse, AddressSearch, ContactMedium } from '../../models/customerListResponse';
import { ActivatedRoute, Router } from '@angular/router';
import { Account, AccountItem } from './account-item/account-item';
import { BillingAccountSearch } from '../../models/customerListResponse';
import { UpdateCustomerRequest } from '../../models/updateCustomerRequest';
import { CreateAddressRequest } from '../../models/createAddressRequest';
import { CreateContactMediumsRequest } from '../../models/createContactMediumsRequest';

// HTML Template dosyası aşağıda

// Şehir modelleri
export type CitiesListResponse = City[];

export interface City {
  id: string;
  name: string;
}

// Adres modeli
interface Address {
  index: number;
  id: string;
  title: string;
  cityName: string;
  cityId: number;
  street: string;
  houseNumber: string;
  description: string;
  isDefault: boolean;
}

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
  contactMediumId: string = '';

  // Modal kontrol değişkenleri
  showDeleteConfirmModal: boolean = false;
  showDeleteAddressConfirmModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  modalMessage: string = '';
  addressToDelete: string | null = null;

  editingSteps: { [key: number]: boolean } = { 1: false, 2: false, 3: false, 4: false };
  formBackup: any = {};

  addressList: Address[] = [];
  billingAccounts: BillingAccountSearch[] = [];

  // Şehir listesi
  cityList: City[] = [];

  // Adres yönetimi
  isAddingNewAddress: boolean = false;
  isEditingAddress: boolean = false;
  editingAddressId: string | null = null;
  newAddressForm!: FormGroup;
  editAddressForm!: FormGroup;

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
    this.loadCities();
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

    // Yeni Adres Formu
    this.newAddressForm = this.fb.group({
      title: ['', Validators.required],
      cityId: ['', Validators.required],
      street: ['', Validators.required],
      houseNumber: ['', Validators.required],
      description: ['', Validators.required],
      isDefault: [false]
    });

    // Düzenleme Adres Formu
    this.editAddressForm = this.fb.group({
      title: ['', Validators.required],
      cityId: ['', Validators.required],
      street: ['', Validators.required],
      houseNumber: ['', Validators.required],
      description: ['', Validators.required],
      isDefault: [false]
    });
  }

  loadCities(): void {
    this.customerService.getCities().subscribe({
      next: (response: CitiesListResponse) => {
        this.cityList = response;
      },
      error: (err) => {
        console.error('Şehirler çekilirken hata oluştu:', err);
      }
    });
  }

  loadCustomerData(): void {
    const params = new URLSearchParams();
    params.append('customerNumber', localStorage.getItem('selectedCustomerNumber') || '');
    
    this.customerService.getCustomers(params).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          const customerData = response[0];
          console.log('Müşteri verisi:', customerData);
          
          this.patchCustomerInfo(customerData);
          this.billingAccounts = customerData.billingAccountSearches || [];
          console.log('Billing Accounts (müşteriden):', this.billingAccounts);
          
          this.cd.detectChanges();
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

  private patchCustomerInfo(data: CustomerListResponse): void {
    this.customerId = data.id;
    
    this.customerForm.patchValue({
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      birthDate: data.dateOfBirth,
      gender: data.gender === 'K' || data.gender === 'Female' ? 'female' : 
              data.gender === 'E' || data.gender === 'Male' ? 'male' : 'other',
      motherName: data.motherName,
      fatherName: data.fatherName,
      nationalityId: data.natId
    }, { emitEvent: false });

    const contact: Partial<ContactMedium> = 
      data.contactMediums && data.contactMediums.length > 0 
        ? data.contactMediums[0] 
        : {};
    
    // Contact medium ID'sini sakla
    this.contactMediumId = (contact as any).id || '';
        
    this.customerForm.patchValue({
      email: contact.email || '',
      mobilePhone: contact.mobilePhone || '',
      homePhone: contact.homePhone || '',
      fax: contact.fax || ''
    }, { emitEvent: false });

    // Adresleri dönüştür
    this.addressList = (data.addressSearches || []).map((addr, index) => ({
      index: index + 1,
      id: addr.id || '',
      title: addr.title || '',
      cityName: addr.cityName || '',
      cityId: parseInt(addr.cityId) || 0,
      street: addr.street || '',
      houseNumber: addr.houseNumber || '',
      description: addr.description || '',
      isDefault: addr.isDefault || false
    }));

    this.billingAccounts = data.billingAccountSearches || [];
    this.formBackup = this.customerForm.getRawValue();
  }

  deleteCustomer(): void {
    this.showDeleteConfirmModal = true;
  }

  confirmDeleteCustomer(): void {
    this.showDeleteConfirmModal = false;
    
    this.customerService.deleteCustomer(this.customerId).subscribe({
      next: () => {
        this.modalMessage = 'Customer has been deleted successfully. You are now returning to the main page.';
        this.showSuccessModal = true;
        this.cd.detectChanges(); // Change detection'ı manuel tetikle
        
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      },
      error: (error) => {
        this.modalMessage = 'An error occurred while deleting the customer.';
        this.showErrorModal = true;
        this.cd.detectChanges(); // Change detection'ı manuel tetikle
      }
    });
  }
  

  cancelDeleteCustomer(): void {
    this.showDeleteConfirmModal = false;
  }

  closeSuccessModal(): void {
    this.router.navigate(['/']);
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
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

  // --- Adres Yönetimi ---
  addNewAddress(): void {
    this.isAddingNewAddress = true;
    this.isEditingAddress = false;
    this.newAddressForm.reset({ cityId: '', isDefault: this.addressList.length === 0 });
    this.newAddressForm.markAsUntouched();
  }

  cancelNewAddress(): void {
    this.isAddingNewAddress = false;
    this.newAddressForm.reset();
  }

  saveNewAddress(): void {
    if (this.newAddressForm.valid) {
      let isDefault = this.newAddressForm.value.isDefault;

      if (this.addressList.length === 0) {
        isDefault = true;
      }

      const selectedCity = this.cityList.find(c => c.id.toString() === this.newAddressForm.value.cityId);

      // API'ye adres ekleme
      const createAddressRequest: CreateAddressRequest = {
        title: this.newAddressForm.value.title,
        street: this.newAddressForm.value.street,
        houseNumber: this.newAddressForm.value.houseNumber,
        description: this.newAddressForm.value.description,
        isDefault: isDefault,
        customerId: this.customerId,
        cityId: parseInt(this.newAddressForm.value.cityId)
      };

      this.customerService.createAddress(createAddressRequest).subscribe({
        next: (response: any) => {
          const newAddress: Address = {
            index: this.addressList.length > 0 ? Math.max(...this.addressList.map(a => a.index)) + 1 : 1,
            id: response.id || response.data?.id || '', // API'den dönen gerçek ID
            title: this.newAddressForm.value.title,
            cityName: selectedCity ? selectedCity.name : 'Bilinmeyen Şehir',
            cityId: parseInt(this.newAddressForm.value.cityId),
            street: this.newAddressForm.value.street,
            houseNumber: this.newAddressForm.value.houseNumber,
            description: this.newAddressForm.value.description,
            isDefault: isDefault
          };

          if (newAddress.isDefault) {
            this.addressList.forEach(addr => addr.isDefault = false);
          }

          this.addressList.push(newAddress);
          this.isAddingNewAddress = false;
          this.currentAddressPage = this.totalAddressPages;
          this.newAddressForm.reset();
          //('Address added successfully.');
        },
        error: (error) => {
          alert('An error occurred while adding the address.');
          console.error('Address add error:', error);
        }
      });

    } else {
      console.error('Lütfen adres bilgilerini doğru giriniz.');
      this.newAddressForm.markAllAsTouched();
    }
  }

  editAddress(address: Address): void {
    this.isEditingAddress = true;
    this.isAddingNewAddress = false;
    this.editingAddressId = address.id;

    this.editAddressForm.setValue({
      title: address.title,
      cityId: address.cityId.toString(),
      street: address.street,
      houseNumber: address.houseNumber,
      description: address.description,
      isDefault: address.isDefault
    });
    this.editAddressForm.markAsUntouched();
  }

  cancelEditAddress(): void {
    this.isEditingAddress = false;
    this.editingAddressId = null;
    this.editAddressForm.reset();
  }

  saveEditedAddress(): void {
    if (this.editAddressForm.valid && this.editingAddressId !== null) {
      const updatedData = this.editAddressForm.value;
      const index = this.addressList.findIndex(a => a.id === this.editingAddressId);
      
      if (index !== -1) {
        const selectedCity = this.cityList.find(c => c.id.toString() === updatedData.cityId);

        // API'ye gönderilecek request CreateAddressRequest modeline uygun
        const updateRequest: CreateAddressRequest = {
          title: updatedData.title,
          street: updatedData.street,
          houseNumber: updatedData.houseNumber,
          description: updatedData.description,
          isDefault: updatedData.isDefault,
          customerId: this.customerId,
          cityId: parseInt(updatedData.cityId)
        };

        console.log('Update request:', updateRequest);
        this.customerService.updateAddress(this.editingAddressId, updateRequest).subscribe({
          next: () => {
            // API'den başarılı yanıt aldıktan sonra local state'i güncelle
            
            // Eğer yeni adres primary yapıldıysa, diğer primary adresi bul ve API'ye false olarak güncelle
            if (updatedData.isDefault) {
              const currentPrimaryAddress = this.addressList.find(
                addr => addr.isDefault && addr.id !== this.editingAddressId
              );
              
              if (currentPrimaryAddress) {
                // Eski primary adresi false yap
                const oldPrimaryRequest: CreateAddressRequest = {
                  title: currentPrimaryAddress.title,
                  street: currentPrimaryAddress.street,
                  houseNumber: currentPrimaryAddress.houseNumber,
                  description: currentPrimaryAddress.description,
                  isDefault: false,
                  customerId: this.customerId,
                  cityId: currentPrimaryAddress.cityId
                };

                this.customerService.updateAddress(currentPrimaryAddress.id, oldPrimaryRequest).subscribe({
                  next: () => {
                    // Local state'i güncelle
                    this.addressList.forEach(addr => {
                      if (addr.id === currentPrimaryAddress.id) {
                        addr.isDefault = false;
                      }
                    });
                    this.cd.detectChanges();
                  },
                  error: (error) => {
                    console.error('Eski primary adres güncellenirken hata:', error);
                  }
                });
              }
              
              // Tüm adreslerde primary false yap (local)
              this.addressList.forEach(addr => addr.isDefault = false);
            }

            // Düzenlenen adresi güncelle
            this.addressList[index] = {
              ...this.addressList[index],
              id: this.editingAddressId!,
              title: updatedData.title,
              street: updatedData.street,
              houseNumber: updatedData.houseNumber,
              description: updatedData.description,
              isDefault: updatedData.isDefault,
              cityName: selectedCity ? selectedCity.name : 'Bilinmeyen Şehir',
              cityId: parseInt(updatedData.cityId)
            };

            this.cd.detectChanges();
            //alert('Address updated successfully.');
            this.cancelEditAddress();
          },
          error: (error) => {
            alert('An error occurred while updating the address.');
            console.error('Address update error:', error);
          }
        });
      }
    } else {
      console.error('Lütfen adres düzenleme bilgilerini doğru giriniz.');
      this.editAddressForm.markAllAsTouched();
    }
  }

  deleteAddress(addressId: string): void {
    this.addressToDelete = addressId;
    this.showDeleteAddressConfirmModal = true;
  }

  confirmDeleteAddress(): void {
    if (!this.addressToDelete) return;

    const addressId = this.addressToDelete;
    this.showDeleteAddressConfirmModal = false;

    const deletedAddress = this.addressList.find(a => a.id === addressId);
    
    if (!deletedAddress) {
      this.modalMessage = 'Address not found.';
      this.showErrorModal = true;
      return;
    }

    if (!addressId || addressId.startsWith('temp-')) {
      this.modalMessage = 'Invalid address ID.';
      this.showErrorModal = true;
      return;
    }

    this.customerService.deleteAddress(addressId).subscribe({
      next: () => {
        this.addressList = this.addressList.filter(a => a.id !== addressId);
        
        if (deletedAddress.isDefault && this.addressList.length > 0) {
          this.addressList[0].isDefault = true;
        }
        
        const totalPages = this.totalAddressPages;
        if (this.currentAddressPage > totalPages && totalPages > 0) {
          this.currentAddressPage = totalPages;
        } else if (this.addressList.length === 0) {
          this.currentAddressPage = 1;
        }
        
        this.cd.detectChanges();
        this.modalMessage = 'Address deleted successfully.';
        this.showSuccessModal = true;
        setTimeout(() => {
          this.showSuccessModal = false;
        }, 2000);
      },
      error: (error) => {
        this.modalMessage = error.error?.detail || error.error?.message || error.message || 'An error occurred while deleting the address.';
        this.showErrorModal = true;
        console.error('Address delete error:', error);
      }
    });

    this.addressToDelete = null;
  }

  cancelDeleteAddress(): void {
    this.showDeleteAddressConfirmModal = false;
    this.addressToDelete = null;
  }

  // --- Adres Sayfalama ---
  getDisplayedAddresses(): Address[] {
    const startIndex = (this.currentAddressPage - 1) * this.addressesPerPage;
    const endIndex = startIndex + this.addressesPerPage;
    return this.addressList.slice(startIndex, endIndex);
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

  // --- Diğer Form Kontrol Metotları ---
  selectStep(step: number): void {
    if (this.currentStep !== step) {
      if (this.editingSteps[this.currentStep]) {
        console.warn(`Lütfen önce adım ${this.currentStep} üzerindeki düzenlemeyi kaydedin veya iptal edin.`);
        return;
      }
      // Adres ekleme/düzenleme modundaysa uyarı ver
      if (this.isAddingNewAddress || this.isEditingAddress) {
        console.warn('Lütfen adresi kaydedin veya iptal edin.');
        return;
      }
      this.currentStep = step;
      if (step === 3) this.currentAddressPage = 1;
    }
  }

  enableEdit(step: number): void {
    if (step === 2 || step === 3) return;
    
    this.editingSteps[step] = true;
    this.formBackup = this.customerForm.getRawValue();
    this.enableFormControls(step);
  }

  cancelEdit(step: number): void {
    this.editingSteps[step] = false;
    this.customerForm.patchValue(this.formBackup);
    this.disableFormControls(step);
    this.customerForm.markAsPristine();
    this.customerForm.markAsUntouched();
  }

  private formatDateForApi(dateString: string): string {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-'); 
    return `${day}/${month}/${year}`;
  }

  saveChanges(step: number): void {
    if (this.isStepValid(step)) {
      if (step === 1) {
        // Customer info update
        const updateRequest: UpdateCustomerRequest = {
          firstName: this.customerForm.controls['firstName'].value,
          middleName: this.customerForm.controls['middleName'].value,
          lastName: this.customerForm.controls['lastName'].value,
          dateOfBirth: this.formatDateForApi(this.customerForm.controls['birthDate'].value),
          gender: this.customerForm.controls['gender'].value,
          motherName: this.customerForm.controls['motherName'].value,
          fatherName: this.customerForm.controls['fatherName'].value,
          natId: this.customerForm.controls['nationalityId'].value
        };

        this.customerService.updateCustomer(this.customerId, updateRequest).subscribe({
          next: () => {
            this.editingSteps[step] = false;
            this.disableFormControls(step);
            this.formBackup = this.customerForm.getRawValue();
            // Success modal kaldırıldı
          },
          error: (error) => {
            this.enableFormControls(step);
            this.customerForm.patchValue(this.formBackup, { emitEvent: false });
            this.disableFormControls(step);
            this.editingSteps[step] = false;
            this.cd.detectChanges();
            
            this.modalMessage = error.error?.detail || error.error?.message || error.message || 'An error occurred while updating customer information.';
            this.showErrorModal = true;
          }
        });
      } else if (step === 4) {
        // Contact medium update
        const contactMediumRequest: CreateContactMediumsRequest = {
          email: this.customerForm.controls['email'].value,
          mobilePhone: this.customerForm.controls['mobilePhone'].value,
          homePhone: this.customerForm.controls['homePhone'].value,
          fax: this.customerForm.controls['fax'].value,
          customerId: this.customerId
        };

        if (this.contactMediumId) {
          // Update existing contact medium
          this.customerService.updateContactMediums(this.contactMediumId, contactMediumRequest).subscribe({
            next: () => {
              this.editingSteps[step] = false;
              this.disableFormControls(step);
              this.formBackup = this.customerForm.getRawValue();
              // Success modal kaldırıldı
            },
            error: (error) => {
              this.enableFormControls(step);
              this.customerForm.patchValue(this.formBackup, { emitEvent: false });
              this.disableFormControls(step);
              this.editingSteps[step] = false;
              this.cd.detectChanges();
              
              this.modalMessage = error.error?.detail || error.error?.message || error.message || 'An error occurred while updating contact information.';
              this.showErrorModal = true;
            }
          });
        } else {
          // Create new contact medium if doesn't exist
          this.customerService.createContactMediums(contactMediumRequest).subscribe({
            next: (response: any) => {
              this.contactMediumId = response.id || response.data?.id || '';
              this.editingSteps[step] = false;
              this.disableFormControls(step);
              this.formBackup = this.customerForm.getRawValue();
              // Success modal kaldırıldı
            },
            error: (error) => {
              this.enableFormControls(step);
              this.customerForm.patchValue(this.formBackup, { emitEvent: false });
              this.disableFormControls(step);
              this.editingSteps[step] = false;
              this.cd.detectChanges();
              
              this.modalMessage = error.error?.detail || error.error?.message || error.message || 'An error occurred while creating contact information.';
              this.showErrorModal = true;
            }
          });
        }
      }
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