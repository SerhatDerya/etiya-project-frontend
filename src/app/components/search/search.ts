import { Component } from '@angular/core';
import { SearchFilter } from "../search-filter/search-filter";
import { SearchResults } from "../search-results/search-results";

@Component({
  selector: 'app-search',
  imports: [SearchFilter, SearchResults],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {

}
