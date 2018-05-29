import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { MessagesComponent } from './messages.component';
import { MessageService } from '../message.service';

describe('MessagesComponent', () => {
  let component: MessagesComponent;
  let componentDe: DebugElement;
  let fixture: ComponentFixture<MessagesComponent>;

  const getDisplayedMessageDes = () => componentDe.queryAll(By.css('h2 ~ div'));

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [MessagesComponent],
        providers: [MessageService]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
    componentDe = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should list-out messages', () => {
    component.messageService.add('one');
    component.messageService.add('two');
    component.messageService.add('three');
    fixture.detectChanges();

    const messages: HTMLElement[] = getDisplayedMessageDes().map(m => m.nativeElement);
    expect(messages.length).toBe(3);
    expect(messages[0].textContent.trim()).toBe('one');
    expect(messages[1].textContent.trim()).toBe('two');
    expect(messages[2].textContent.trim()).toBe('three');
  });

  it('should not display anything when no messages are available', () => {
    const messageDes = getDisplayedMessageDes();
    const clearButtonDe = componentDe.query(By.css('button'));

    expect(messageDes.length).toBe(0);
    expect(clearButtonDe).toBeDefined();
  });

  it('should clear messages', () => {
    const messageClearSpy = spyOn(component.messageService, 'clear').and.callThrough();

    component.messageService.add('one');
    fixture.detectChanges();

    const clearButtonDe = componentDe.query(By.css('button'));
    let messageDes = getDisplayedMessageDes();
    expect(messageDes.length).toBe(1);

    clearButtonDe.triggerEventHandler('click', null);
    fixture.detectChanges();

    messageDes = getDisplayedMessageDes();
    expect(messageDes.length).toBe(0);
    expect(messageClearSpy).toHaveBeenCalledTimes(1);
  });
});
