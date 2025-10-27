import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./components/navbar/navbar";
import { Sidebar } from "./components/sidebar/sidebar";
import { Search } from "./components/search/search";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Sidebar, Search],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('etiya-project-front');
}
