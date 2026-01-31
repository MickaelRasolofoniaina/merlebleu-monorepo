import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { DatePickerModule } from 'primeng/datepicker';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';

import { Order } from '../../models/order';

@Component({
  selector: 'add-order',
  imports: [
    DatePickerModule,
    FormsModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    InputNumberModule,
    ButtonModule,
    CommonModule,
  ],
  templateUrl: './add-order.html',
  styleUrl: './add-order.scss',
})
export class AddOrder {
  protected order: Order = {
    id: '',
    shopId: '',
    orderDate: new Date(),
    customer: '',
    contact: '',
    description: '',
    deliveryDate: new Date(),
    deliveryAddress: '',
    isFromFacebook: false,
    facebookAccount: '',
    status: 'toDo',
    remarks: '',
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
  };
}
