import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HeroesModule } from '@myprojectname/heroes';
import { AppComponent } from './app.component';

@NgModule({
  imports: [BrowserModule, HeroesModule.withMockData()],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
