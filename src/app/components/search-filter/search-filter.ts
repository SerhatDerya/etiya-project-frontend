import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-filter',
  imports: [ReactiveFormsModule],
  templateUrl: './search-filter.html',
  styleUrl: './search-filter.scss',
})
export class SearchFilter {
  searchForm !: FormGroup;

  primaryFields = ['natId', 'customerId', 'accountNumber', 'gsmNumber', 'orderNumber'];

  constructor(private fb : FormBuilder){}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      natId: [''],
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

}
