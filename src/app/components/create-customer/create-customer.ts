// create-customer.component.ts (GÜNCELLENMİŞ)

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerService, } from '../../services/customer-service'; 
import { CreateCustomerRequest } from '../../models/createCustomerRequest'; // CreateCustomerRequest'i import et
import { CreateCustomerResponse } from '../../models/createCustomerResponse'; // CreateCustomerResponse'i import et
import { CreateContactMediumsRequest } from '../../models/createContactMediumsRequest'; // CreateContactMediumsRequest'i import et
import { CreateAddressRequest } from '../../models/createAddressRequest'; // CreateAddressRequest'i import et
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError, concatMap } from 'rxjs/operators';

// Yeni eklenen şehir modelleri (Değişmedi)
export type CitiesListResponse = City[];

export interface City {
  id: string;
  name: string;
}

// GÜNCELLENMİŞ Adres modeli: cityName yerine cityId tutulacak
interface Address {
  id: number;
  title: string;
  cityName: string; // Görünümde kullanılacak isim
  cityId: number;   // API'a gönderilecek ID
  street: string;
  houseNumber: string;
  description: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-create-customer',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    CommonModule, 
  ],
  templateUrl: './create-customer.html',
  styleUrls: ['./create-customer.scss']
})
export class CreateCustomer implements OnInit {
  currentStep: number = 1; 
  customerForm!: FormGroup;

  // Yeni Şehir Listesi
  cityList: City[] = []; 

  // Adres Yönetimi
  addressList: Address[] = [];
  isAddingNewAddress: boolean = false; 
  newAddressForm!: FormGroup;

  // Düzenleme Yönetimi için yeni eklenenler
  isEditingAddress: boolean = false;
  editingAddressId: number | null = null;
  editAddressForm!: FormGroup; 
  
  // Sayfalama Yönetimi
  addressesPerPage: number = 2;
  currentAddressPage: number = 1;

  // Modal kontrol değişkenleri
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  modalMessage: string = '';

  get totalAddressPages(): number {
    return Math.ceil(this.addressList.length / this.addressesPerPage);
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private customerService: CustomerService,
    private cd: ChangeDetectorRef
  ) {}

  ageValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Değer boşsa, zorunluluk (required) kontrolü halleder.
      }

      const birthDate = new Date(control.value);
      const today = new Date();
      
      // Doğum tarihinden itibaren geçen yıl sayısını hesapla
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      
      // Yıl farkı yetersizse veya yıl aynı, ancak ay/gün henüz dolmadıysa 1 yaş düşür.
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= minAge ? null : { minAgeRequired: { requiredAge: minAge, actualAge: age } };
    };
}

  ngOnInit(): void {
    // Şehir verilerini çekme işlemi (Değişmedi)
    this.customerService.getCities().subscribe({
      next: (response: CitiesListResponse) => {
        this.cityList = response;
      },
      error: (err) => {
        console.error('Şehirler çekilirken hata oluştu:', err);
      }
    });

    // Ana Müşteri Formu
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      gender: ['', Validators.required],
      motherName: ['', [Validators.minLength(2), Validators.maxLength(20)]],
      middleName: ['', [Validators.minLength(2), Validators.maxLength(20)]],
      // API request'e uyum sağlamak için: dateOfBirth alanı
      birthDate: ['', [Validators.required, this.ageValidator(16)]], // En az 16 yaş doğrulaması
      fatherName: ['', [Validators.minLength(2), Validators.maxLength(20)]],
      nationalityId: ['', [Validators.required, Validators.pattern('^\\d{10}[02468]$')]],

      // ... Contact Medium Group (Değişmedi)
      email: ['', [Validators.required, Validators.email]],
      mobilePhone: ['', [Validators.required, Validators.pattern('^\\+?\\d{10,15}$')]],
      homePhone: [''],
      fax: ['']
    });

    // Yeni Adres Formu: cityName yerine cityId kullanılıyor
    this.newAddressForm = this.fb.group({
      title: ['', Validators.required],
      cityId: ['', Validators.required], // DİKKAT: cityName yerine cityId kullanıldı
      street: ['', Validators.required],
      houseNumber: ['', Validators.required],
      description: ['', Validators.required],
      isDefault: [false]
    });

    // Düzenleme Adres Formu: cityName yerine cityId kullanılıyor
    this.editAddressForm = this.fb.group({
      title: ['', Validators.required],
      cityId: ['', Validators.required], // DİKKAT: cityName yerine cityId kullanıldı
      street: ['', Validators.required],
      houseNumber: ['', Validators.required],
      description: ['', Validators.required],
      isDefault: [false]
    });
  }
  
  // ... (nextStep, prevStep, onCancel, markControlsAsTouched fonksiyonları değişmedi) ...
  nextStep() {
    if (this.currentStep === 1) {
      const demographicInfoControls = ['firstName', 'lastName', 'gender', 'birthDate', 'nationalityId'];
      this.markControlsAsTouched(demographicInfoControls);
      
      const isStep1Valid = demographicInfoControls.every(c => this.customerForm.get(c)?.valid);
      
      if (isStep1Valid) {
        this.currentStep = 2;
        this.currentAddressPage = 1; 
      } else {
        console.error('Lütfen Demografik Bilgileri doğru giriniz.');
      }
    } else if (this.currentStep === 2) {
      // Yeni adres ekleme/düzenleme modunda değilsek ilerle
      if (!this.isAddingNewAddress && !this.isEditingAddress) {
        this.currentStep = 3;
      } else {
        console.error('Lütfen adresi kaydedin veya iptal edin.');
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onCancel() {
    this.router.navigateByUrl('/b2c');
  }

  private markControlsAsTouched(controls: string[]) {
    controls.forEach(controlName => {
      this.customerForm.get(controlName)?.markAsTouched();
    });
  }

  private formatDateForApi(dateString: string): string {
        if (!dateString) return '';
        // Input type="date" yyyy-MM-dd formatında döndürür.
        const [year, month, day] = dateString.split('-'); 
        return `${day}/${month}/${year}`; // DD/MM/YYYY formatına çevir
  }

  private cleanFormData(data: any): any {
    const cleanedData: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];

        if (typeof value === 'string'&& value.trim() === '') {
          // Boş veya sadece boşluk içeren stringleri temizle
          cleanedData[key] = null;
        } else {
          cleanedData[key] = value;
        }
      }
    }
    return cleanedData;
  }

  private addAddressesSequentially(customerId: string) {
    if (this.addressList.length === 0) {
      // Adres yoksa boş observable döndür
      return of(null);
    }

    // Her adresi sırayla işleyebilmek için RxJS concatMap kullan
    return of(...this.addressList).pipe(
      concatMap((address) => {
        const createAddressRequest: CreateAddressRequest = {
          title: address.title,
          street: address.street,
          houseNumber: address.houseNumber,
          description: address.description,
          isDefault: address.isDefault,
          customerId,
          cityId: address.cityId
        };
        console.log('Adres ekleniyor:', createAddressRequest);
        return this.customerService.createAddress(createAddressRequest);
      })
    );
  }


  
  createCustomer() {
    const contactMediumControls = ['email', 'mobilePhone'];
    this.markControlsAsTouched(contactMediumControls);
    
    if (this.customerForm.valid) {
      const customerFormData = this.customerForm.value;
      const cleanedData = this.cleanFormData(customerFormData);
      const formattedBirthDate = this.formatDateForApi(cleanedData.birthDate);

      const createCustomerRequest: CreateCustomerRequest = {
        firstName: cleanedData.firstName,
        middleName: cleanedData.middleName,
        lastName: cleanedData.lastName,
        dateOfBirth: formattedBirthDate,
        gender: cleanedData.gender,
        motherName: cleanedData.motherName,
        fatherName: cleanedData.fatherName,
        natId: cleanedData.nationalityId
      };

      console.log('1️. Müşteri oluşturma başlatılıyor:', createCustomerRequest);

      this.customerService.createCustomer(createCustomerRequest).pipe(
        switchMap((customerResponse: CreateCustomerResponse) => {
          const customerId = customerResponse.id;
          console.log(`2️. Müşteri ID alındı: ${customerId}. Şimdi adresler ekleniyor...`);

          return this.addAddressesSequentially(customerId).pipe(
            map(() => customerId)
          );
        }),
        switchMap((customerId: string) => {
          console.log(`3️. Adresler tamamlandı. Şimdi iletişim bilgileri ekleniyor...`);
          const createContactMediumsRequest: CreateContactMediumsRequest = {
            email: cleanedData.email,
            homePhone: cleanedData.homePhone,
            mobilePhone: cleanedData.mobilePhone,
            fax: cleanedData.fax,
            customerId
          };
          return this.customerService.createContactMediums(createContactMediumsRequest).pipe(
            map(() => customerId)
          );
        }),
        catchError(error => {
          console.error('Zincirde hata oluştu:', error);
          this.modalMessage = error.error?.detail || error.error?.message || error.message || 'An error occurred while creating customer.';
          this.showErrorModal = true;
          this.cd.detectChanges();
          return of(null);
        })
      ).subscribe(customerId => {
        if (customerId) {
          console.log('Tüm işlemler başarıyla tamamlandı!');
          this.modalMessage = 'Customer created successfully. You are now returning to the main page.';
          this.showSuccessModal = true;
          this.cd.detectChanges(); // Change detection'ı manuel tetikle
          setTimeout(() => {
            this.router.navigateByUrl('/b2c');
          }, 3000);
        }
      });

    } else {
      console.error('Form geçersiz. Lütfen tüm alanları doldurun.');
      this.customerForm.markAllAsTouched();
    }
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.router.navigateByUrl('/b2c');
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
  }

  // --- Yeni Adres Ekleme İşlevleri (GÜNCELLENMİŞ) ---

  // ... (addNewAddress, cancelNewAddress fonksiyonları cityId'ye uygun güncellendi) ...

  addNewAddress() {
    this.isAddingNewAddress = true;
    this.isEditingAddress = false; 
    // cityId'yi boş string olarak resetle
    this.newAddressForm.reset({ cityId: '', isDefault: this.addressList.length === 0 }); 
    this.newAddressForm.markAsUntouched();
  }

  cancelNewAddress() {
    this.isAddingNewAddress = false;
    this.newAddressForm.reset();
  }

  saveNewAddress() {
    if (this.newAddressForm.valid) {
      let isDefault = this.newAddressForm.value.isDefault;

      if (this.addressList.length === 0) {
        isDefault = true;
      }

      console.log("Form cityId değeri:", this.newAddressForm.value.cityId);
      
      const selectedCity = this.cityList.find(c => c.id.toString() === this.newAddressForm.value.cityId);
      
      const newAddress: Address = {
        id: this.addressList.length > 0 ? Math.max(...this.addressList.map(a => a.id)) + 1 : 1,
        title: this.newAddressForm.value.title,
        cityName: selectedCity ? selectedCity.name : 'Bilinmeyen Şehir', // Görüntüleme için isim
        cityId: this.newAddressForm.value.cityId, // API için ID
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

    } else {
      console.error('Lütfen adres bilgilerini doğru giriniz.');
      this.newAddressForm.markAllAsTouched();
    }
  }

  // --- Adres Düzenleme/Silme İşlevleri (GÜNCELLENMİŞ) ---

  editAddress(address: Address) {
    this.isEditingAddress = true;
    this.isAddingNewAddress = false;
    this.editingAddressId = address.id;

    // Formu mevcut adres verileriyle doldur
    this.editAddressForm.setValue({
      title: address.title,
      cityId: address.cityId, // DİKKAT: cityId kullanıldı
      street: address.street,
      houseNumber: address.houseNumber,
      description: address.description,
      isDefault: address.isDefault
    });
    this.editAddressForm.markAsUntouched();
  }

  // ... (cancelEditAddress fonksiyonu değişmedi) ...
  cancelEditAddress() {
    this.isEditingAddress = false;
    this.editingAddressId = null;
    this.editAddressForm.reset();
  }


  saveEditedAddress() {
    if (this.editAddressForm.valid && this.editingAddressId !== null) {
      const updatedData = this.editAddressForm.value;
      const index = this.addressList.findIndex(a => a.id === this.editingAddressId);

      if (index !== -1) {
        if (updatedData.isDefault) {
          this.addressList.forEach(addr => addr.isDefault = false);
        }

        const selectedCity = this.cityList.find(c => c.id === updatedData.cityId);

        this.addressList[index] = {
          id: this.editingAddressId,
          ...updatedData,
          cityName: selectedCity ? selectedCity.name : 'Bilinmeyen Şehir', // Görüntüleme için isim
          cityId: updatedData.cityId // API için ID
        };
      }

      this.cancelEditAddress(); 
    } else {
      console.error('Lütfen adres düzenleme bilgilerini doğru giriniz.');
      this.editAddressForm.markAllAsTouched();
    }
  }

  // ... (deleteAddress ve Sayfalama İşlevleri değişmedi) ...
  deleteAddress(addressId: number) {
    if (confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
      const deletedAddress = this.addressList.find(a => a.id === addressId);
      this.addressList = this.addressList.filter(a => a.id !== addressId);
      
      if (deletedAddress?.isDefault && this.addressList.length > 0) {
        this.addressList[0].isDefault = true;
      }

      if (this.currentAddressPage > this.totalAddressPages && this.totalAddressPages > 0) {
        this.currentAddressPage = this.totalAddressPages;
      } else if (this.totalAddressPages === 0) {
        this.currentAddressPage = 1;
      }
    }
  }

  // --- Sayfalama İşlevleri (Değişmedi) ---

  getDisplayedAddresses(): Address[] {
    const startIndex = (this.currentAddressPage - 1) * this.addressesPerPage;
    const endIndex = startIndex + this.addressesPerPage;
    return this.addressList.slice(startIndex, endIndex);
  }

  shouldShowPrevArrow(): boolean {
    return this.addressList.length > this.addressesPerPage;
  }

  shouldShowNextArrow(): boolean {
    return this.addressList.length > this.addressesPerPage;
  }

  prevAddressPage() {
    if (this.currentAddressPage > 1) {
      this.currentAddressPage--;
    }
  }

  nextAddressPage() {
    if (this.currentAddressPage < this.totalAddressPages) {
      this.currentAddressPage++;
    }
  }
}