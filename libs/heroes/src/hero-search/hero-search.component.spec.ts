import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RouterLinkWithHref } from '@angular/router';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';

import { HeroSearchComponent } from './hero-search.component';
import { HeroService } from '../hero.service';
import { Hero } from '../hero';

class MockHeroService implements Partial<HeroService> {
  private heroes: Hero[] = [{ id: 0, name: 'Mr. Incredible' }, { id: 1, name: 'Mr. Potato Head' }];
  private nextId = this.heroes.reduce((maxId, hero) => Math.max(maxId, hero.id), 0) + 1;

  searchHeroes(term: string): Observable<Hero[]> {
    return !term.trim()
      ? observableOf([])
      : observableOf(this.heroes.filter(h => h.name.includes(term)));
  }
}

describe('HeroSearchComponent', () => {
  describe('isolated', () => {
    let component: HeroSearchComponent;
    let service: MockHeroService;

    beforeEach(() => {
      service = new MockHeroService();
      component = new HeroSearchComponent(service as any);
      component.ngOnInit();
    });

    it('should return empty upon providing an empty search term', () => {
      component.heroes$.subscribe(res => {
        expect(res).toEqual([]);
      });

      component.search('');
    });

    it('should return results upon providing a search term', () => {
      component.heroes$.subscribe(res => {
        expect(res.length).toBe(1);
        expect(res[0].name).toBe('Mr. Potato Head');
      });

      component.search('Potato');
    });

    it('should debounce the search terms provided', fakeAsync(() => {
      let results = null;

      component.heroes$.subscribe(res => results = res);
      component.search('Potato');

      tick(299);
      expect(results).toEqual(null);

      tick(1);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Mr. Potato Head');
    }));

    it('should ignore terms if same as previous term', fakeAsync(() => {
      let results = null;

      component.heroes$.subscribe(res => results = res);

      component.search('Incredible');
      tick(300);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Mr. Incredible');

      component.search('Potato');
      tick(300);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Mr. Potato Head');

      component.search('Potato');
      tick(300);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Mr. Potato Head');

      component.search('Incredible');
      tick(300);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Mr. Incredible');
    }));
  });

  describe('integration', () => {
    let component: HeroSearchComponent;
    let componentDe: DebugElement;
    let fixture: ComponentFixture<HeroSearchComponent>;
    let inputDe: DebugElement;
    let input: HTMLInputElement;

    const getHeroLinksDe = () => componentDe.queryAll(By.css('.search-result li a'));

    beforeEach(
      async(() => {
        TestBed.configureTestingModule({
          imports: [RouterTestingModule],
          declarations: [HeroSearchComponent],
          providers: [{ provide: HeroService, useClass: MockHeroService }]
        }).compileComponents();
      })
    );

    beforeEach(() => {
      fixture = TestBed.createComponent(HeroSearchComponent);
      component = fixture.componentInstance;
      componentDe = fixture.debugElement;
      inputDe = componentDe.query(By.css('input'));
      input = inputDe.nativeElement;
      fixture.detectChanges();
    });

    it('should list-out searched hero matches', fakeAsync(() => {
      let heroLinksDe = getHeroLinksDe();
      expect(heroLinksDe.length).toBe(0);

      input.value = 'Mr.';
      inputDe.triggerEventHandler('keyup', null);
      tick(300);
      fixture.detectChanges();

      heroLinksDe = getHeroLinksDe();
      expect(heroLinksDe.length).toBe(2);
      expect(heroLinksDe[0].nativeElement.textContent.trim()).toBe('Mr. Incredible');
      expect(heroLinksDe[1].nativeElement.textContent.trim()).toBe('Mr. Potato Head');

      input.value = 'Potato';
      inputDe.triggerEventHandler('keyup', null);
      tick(300);
      fixture.detectChanges();

      heroLinksDe = getHeroLinksDe();
      expect(heroLinksDe.length).toBe(1);
      expect(heroLinksDe[0].nativeElement.textContent.trim()).toBe('Mr. Potato Head');
    }));

    it('should debounce the search action', fakeAsync(() => {
      input.value = 'Mr.';
      inputDe.triggerEventHandler('keyup', null);
      tick(299);
      fixture.detectChanges();

      let heroLinksDe = getHeroLinksDe();
      expect(heroLinksDe.length).toBe(0);

      tick(1);
      fixture.detectChanges();

      heroLinksDe = getHeroLinksDe();
      expect(heroLinksDe.length).toBe(2);
      expect(heroLinksDe[0].nativeElement.textContent.trim()).toBe('Mr. Incredible');
      expect(heroLinksDe[1].nativeElement.textContent.trim()).toBe('Mr. Potato Head');
    }));

    it('should contain router links for each hero', fakeAsync(() => {
      input.value = 'Mr.';
      inputDe.triggerEventHandler('keyup', null);
      tick(300);
      fixture.detectChanges();

      const routerLinks = componentDe
        .queryAll(By.directive(RouterLinkWithHref))
        .map(de => de.injector.get(RouterLinkWithHref));

      expect(routerLinks.length).toBe(2);
      expect(routerLinks[0].href).toBe('/detail/0');
      expect(routerLinks[1].href).toBe('/detail/1');
    }));
  });
});
