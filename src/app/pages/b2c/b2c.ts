import { Component } from '@angular/core';
import { Navbar } from "../../components/navbar/navbar";
import { Sidebar } from "../../components/sidebar/sidebar";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-b2c',
  imports: [Navbar, Sidebar, RouterOutlet],
  templateUrl: './b2c.html',
  styleUrl: './b2c.scss',
})
export class B2c {

}
