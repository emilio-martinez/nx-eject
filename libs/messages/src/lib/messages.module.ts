import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessagesComponent } from './messages/messages.component';
import { MessageService } from './message.service';

@NgModule({
  imports: [CommonModule],
  declarations: [MessagesComponent],
  exports: [MessagesComponent],
  providers: [MessageService]
})
export class MessagesModule {}
