import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-search-result-item',
  imports: [],
  templateUrl: './search-result-item.html',
  styleUrl: './search-result-item.scss',
})
export class SearchResultItem {
  @Input() firstName!: string;
  @Input() middleName!: string;
  @Input() lastName!: string;
  @Input() natId!: string;

}
