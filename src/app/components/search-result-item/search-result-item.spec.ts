import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResultItem } from './search-result-item';

describe('SearchResultItem', () => {
  let component: SearchResultItem;
  let fixture: ComponentFixture<SearchResultItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchResultItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
