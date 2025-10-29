import { Component } from '@angular/core';
import { Navbar } from "../../components/navbar/navbar";
import { Search } from "../../components/search/search";
import { Sidebar } from "../../components/sidebar/sidebar";

@Component({
  selector: 'app-b2c',
  imports: [Navbar, Search, Sidebar],
  templateUrl: './b2c.html',
  styleUrl: './b2c.scss',
})
export class B2c {

}
