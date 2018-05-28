import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, NgModel } from '@angular/forms';
import { DebugElement } from '@angular/core';
import { Location } from '@angular/common';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';

import { HeroDetailComponent } from './hero-detail.component';
import { HeroService } from '../hero.service';
import { Hero } from '../hero';
import { By } from '@angular/platform-browser';

class MockHeroService implements Partial<HeroService> {
  private heroes: Hero[] = [{ id: 0, name: 'Mr. Incredible' }, { id: 1, name: 'Mr. Potato Head' }];

  getHero(id: number): Observable<Hero> {
    return observableOf(this.heroes.filter(h => h.id === id)[0]);
  }
  updateHero(hero: Hero): Observable<any> {
    const heroToUpdate = this.heroes.filter(h => h.id === hero.id)[0];

    if (heroToUpdate) {
      heroToUpdate.name = name;
    } else {
      this.heroes = this.heroes.concat(hero);
    }
    return observableOf(hero);
  }
}

const activatedRouteWithId = (id: number): ActivatedRoute => {
  return {
    snapshot: {
      paramMap: {
        get() {
          return id;
        }
      }
    }
  } as any;
};

describe('HeroDetailComponent', () => {
  let component: HeroDetailComponent;
  let componentDe: DebugElement;
  let fixture: ComponentFixture<HeroDetailComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        imports: [FormsModule, RouterTestingModule],
        declarations: [HeroDetailComponent],
        providers: [{ provide: HeroService, useClass: MockHeroService }]
      }).compileComponents();
    })
  );

  describe('with valid route id', () => {
    beforeEach(
      async(() => {
        TestBed.overrideProvider(ActivatedRoute, {
          useValue: activatedRouteWithId(1)
        });

        fixture = TestBed.createComponent(HeroDetailComponent);
        component = fixture.componentInstance;
        componentDe = fixture.debugElement;
        fixture.detectChanges();
      })
    );

    it('should display a hero based on the active route', () => {
      const titleDe = fixture.debugElement.query(By.css('h2'));

      expect(titleDe).toBeDefined();
      expect(titleDe.nativeElement.textContent).toMatch(/Mr\.\ Potato\ Head/i);
    });

    it('should display an input with the hero name', () => {
      const inputDe = componentDe.query(By.css('input'));
      const ngModel = componentDe.query(By.directive(NgModel)).injector.get(NgModel);

      expect(inputDe).toBeDefined();
      expect(inputDe.nativeElement.value).toMatch(/Mr\.\ Potato\ Head/i);
      expect(ngModel).toBeDefined();
      expect(ngModel.value).toMatch(/Mr\.\ Potato\ Head/i);
    });

    it('changing input value should change hero name', () => {
      const inputDe = componentDe.query(By.css('input'));
      const input: HTMLInputElement = inputDe.nativeElement;
      const ngModel = componentDe.query(By.directive(NgModel)).injector.get(NgModel);

      input.value = 'Wonder Woman';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.hero.name).toMatch(/Wonder\ Woman/i);
      expect(ngModel.value).toMatch(/Wonder\ Woman/i);
    });

    it('clicking goBack should navigate back', () => {
      const location: Location = TestBed.get(Location);
      const locationBackSpy = spyOn(location, 'back').and.callThrough();
      const backButtonDe = componentDe
        .queryAll(By.css('button'))
        .filter(b => b.nativeElement.textContent === 'go back')[0];

      backButtonDe.triggerEventHandler('click', null);
      expect(locationBackSpy).toHaveBeenCalledTimes(1);
    });

    it('clicking save should navigate back', () => {
      const location: Location = TestBed.get(Location);
      const locationBackSpy = spyOn(location, 'back').and.callThrough();
      const backButtonDe = componentDe
        .queryAll(By.css('button'))
        .filter(b => b.nativeElement.textContent === 'save')[0];

      backButtonDe.triggerEventHandler('click', null);
      expect(locationBackSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('with invalid route id', () => {
    beforeEach(
      async(() => {
        TestBed.overrideProvider(ActivatedRoute, {
          useValue: activatedRouteWithId(99)
        });

        fixture = TestBed.createComponent(HeroDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      })
    );

    it('should not display hero info', () => {
      const titleDe = fixture.debugElement.query(By.css('h2'));
      expect(titleDe).toBe(null);
    });
  });
});
