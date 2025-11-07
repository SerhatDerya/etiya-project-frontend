import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountItem } from './account-item';

describe('AccountItem', () => {
  let component: AccountItem;
  let fixture: ComponentFixture<AccountItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
