import { async, ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RouterLinkWithHref } from '@angular/router';
import { DebugElement, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Observable, of as observableOf } from 'rxjs';

import { HeroDashboardComponent } from './hero-dashboard.component';
import { HeroService } from '../hero.service';
import { Hero } from '../hero';

class MockHeroService implements Partial<HeroService> {
  private heroes: Hero[] = [
    { id: 0, name: 'Mr. Incredible' },
    { id: 1, name: 'Mr. Potato Head' },
    { id: 2, name: 'Wonder Woman' },
    { id: 3, name: 'Iron Man' },
    { id: 4, name: 'Elastigirl' },
    { id: 5, name: 'Hulk' }
  ];

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

    it('should populate heroes on init', () => {
      expect(component.heroes.length).toBe(0);
      component.ngOnInit();
      expect(component.heroes.length).toBeGreaterThan(0);
    });

    it('should only populate heroes from 2 to 5, 4 in total', () => {
      component.ngOnInit();
      expect(component.heroes.length).toBe(4);
      expect(component.heroes[0].name).toBe('Mr. Potato Head');
      expect(component.heroes.slice(-1)[0].name).toBe('Elastigirl');
    });
  });

  describe('shallow', () => {
    let component: HeroDashboardComponent;
    let componentDe: DebugElement;
    let fixture: ComponentFixture<HeroDashboardComponent>;

    beforeEach(
      async(() => {
        TestBed.configureTestingModule({
          imports: [RouterTestingModule],
          declarations: [HeroDashboardComponent],
          providers: [{ provide: HeroService, useClass: MockHeroService }],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
      })
    );

    beforeEach(() => {
      fixture = TestBed.createComponent(HeroDashboardComponent);
      component = fixture.componentInstance;
      componentDe = fixture.debugElement;
      fixture.detectChanges();
    });

    it('should list-out each hero', () => {
      const heroesDe = componentDe.queryAll(By.css('.grid-pad a h4'));

      expect(heroesDe.length).toBe(4);
      expect(heroesDe[0].nativeElement.textContent.trim()).toBe('Mr. Potato Head');
      expect(heroesDe.slice(-1)[0].nativeElement.textContent.trim()).toBe('Elastigirl');
    });

    it('should contain router links for each hero', () => {
      const routerLinks = componentDe
        .queryAll(By.directive(RouterLinkWithHref))
        .map(de => de.injector.get(RouterLinkWithHref));

      expect(routerLinks.length).toBe(4);
      expect(routerLinks[0].href).toBe('/detail/1');
      expect(routerLinks.slice(-1)[0].href).toBe('/detail/4');
    });
  });
});
