import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HeroesModule, HeroesMockApiModule } from '@myprojectname/heroes';
import { AppComponent } from './app.component';

@NgModule({
  imports: [BrowserModule, HeroesModule, HeroesMockApiModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
