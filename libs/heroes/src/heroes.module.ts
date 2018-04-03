import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { MessagesModule } from '@myprojectname/messages';
import { HeroDashboardComponent } from './hero-dashboard/hero-dashboard.component';
import { HeroDetailComponent } from './hero-detail/hero-detail.component';
import { HeroesComponent } from './heroes/heroes.component';
import { HeroesRoutingModule } from './heroes-routing/heroes-routing.module';
import { HeroMockDataService } from './hero-mock-data.service';
import { HeroSearchComponent } from './hero-search/hero-search.component';
import { HeroService } from './hero.service';

@NgModule({
  imports: [CommonModule, FormsModule, HttpClientModule, MessagesModule, HeroesRoutingModule],
  declarations: [HeroDashboardComponent, HeroDetailComponent, HeroSearchComponent, HeroesComponent],
  exports: [MessagesModule, HeroesRoutingModule],
  providers: [HeroService]
})
export class HeroesModule {}

export const HeroesMockApiModule = HttpClientInMemoryWebApiModule.forRoot(HeroMockDataService, {
  dataEncapsulation: false
});
