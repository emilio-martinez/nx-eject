import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';

import { HeroDashboardComponent } from './hero-dashboard.component';
import { HeroSearchComponent } from '../hero-search/hero-search.component';
import { HeroService } from '../hero.service';
import { Hero } from '../hero';

class MockHeroService implements Partial<HeroService> {
  private heroes: Hero[] = [{ id: 0, name: 'Mr. Incredible' }, { id: 1, name: 'Mr. Potato Head' }];

  getHeroes(): Observable<Hero[]> {
    return observableOf(this.heroes.slice());
  }
}

describe('DashboardComponent', () => {
  describe('isolated', () => {
    let component: HeroDashboardComponent;
    let service: MockHeroService;

    beforeEach(() => {
      service = new MockHeroService();
      component = new HeroDashboardComponent(service as any);
    });

    it('should be created', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('shallow', () => {
    let component: HeroDashboardComponent;
    let fixture: ComponentFixture<HeroDashboardComponent>;

    beforeEach(
      async(() => {
        TestBed.configureTestingModule({
          declarations: [HeroDashboardComponent],
          providers: [{ provide: HeroService, useClass: MockHeroService }],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
      })
    );

    beforeEach(() => {
      fixture = TestBed.createComponent(HeroDashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should be created', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('integration', () => {
    let component: HeroDashboardComponent;
    let fixture: ComponentFixture<HeroDashboardComponent>;

    beforeEach(
      async(() => {
        TestBed.configureTestingModule({
          imports: [RouterTestingModule],
          declarations: [HeroDashboardComponent, HeroSearchComponent],
          providers: [{ provide: HeroService, useClass: MockHeroService }]
        }).compileComponents();
      })
    );

    beforeEach(() => {
      fixture = TestBed.createComponent(HeroDashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should be created', () => {
      expect(component).toBeTruthy();
    });
  });
});
