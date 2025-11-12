import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  status: string;
}

@Component({
  selector: 'app-account-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-item.html',
  styleUrls: ['./account-item.scss']
})
export class AccountItem {
  @Input() account!: Account;
  @Input() isOpen: boolean = false;

  @Output() toggle = new EventEmitter<string>();
  @Output() edit = new EventEmitter<Account>();
  @Output() delete = new EventEmitter<Account>();

  onHeaderClick(): void {
    this.toggle.emit(this.account.accountNumber);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.account);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.account);
  }
}
