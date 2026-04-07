import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OptionsPriceScreenComponent } from './options-price-screen.component';

@NgModule({
  declarations: [OptionsPriceScreenComponent],
  imports: [CommonModule, FormsModule],
  exports: [OptionsPriceScreenComponent]
})
export class OptionsPriceModule {}
