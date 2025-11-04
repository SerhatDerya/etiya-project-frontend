import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerInfo } from './customer-info';

describe('CustomerInfo', () => {
  let component: CustomerInfo;
  let fixture: ComponentFixture<CustomerInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
