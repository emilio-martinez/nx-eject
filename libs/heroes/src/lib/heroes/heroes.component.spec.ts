import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RouterLinkWithHref } from '@angular/router';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';

import { HeroesComponent } from './heroes.component';
import { HeroService } from '../hero.service';
import { Hero } from '../hero';

class MockHeroService implements Partial<HeroService> {
  private heroes: Hero[] = [{ id: 0, name: 'Mr. Incredible' }, { id: 1, name: 'Mr. Potato Head' }];
  private nextId = this.heroes.reduce((maxId, hero) => Math.max(maxId, hero.id), 0) + 1;

  getHeroes(): Observable<Hero[]> {
    return observableOf(this.heroes.slice());
  }
  addHero(hero: Hero): Observable<Hero> {
    const newHero = { ...hero, id: this.nextId++ };
    this.heroes = this.heroes.concat(newHero);
    return observableOf(newHero);
  }
  deleteHero(hero: Hero | number): Observable<Hero> {
    const id = typeof hero === 'number' ? hero : hero.id;
    return observableOf(this.heroes.filter(h => h.id !== id)[0]);
  }
}

describe('HeroesComponent', () => {
  describe('isolated', () => {
    let component: HeroesComponent;
    let service: MockHeroService;

    beforeEach(() => {
      service = new MockHeroService();
      component = new HeroesComponent(service as any);
    });

    describe('getHeroes', () => {
      it('should be called on init', () => {
        expect(component.heroes).toBe(undefined);
        component.ngOnInit();
        expect(component.heroes.length).toBe(2);
      });

      it('should fetch heroes when prompted', () => {
        expect(component.heroes).toBe(undefined);
        component.getHeroes();
        expect(component.heroes.length).toBe(2);
        service.addHero({ id: null, name: 'Wonder Woman' });
        expect(component.heroes.length).toBe(2);
        component.getHeroes();
        expect(component.heroes.length).toBe(3);
      });
    });

    describe('add', () => {
      beforeEach(() => {
        component.ngOnInit();
      });

      it('should not add heroes when given an empty name', () => {
        component.add('');
        component.getHeroes();
        expect(component.heroes.length).toBe(2);
      });

      it('should not add heroes with whitespace-only names', () => {
        component.add('   ');
        component.getHeroes();
        expect(component.heroes.length).toBe(2);
      });

      it('should be able to add heroes', () => {
        component.add('Wonder Woman');
        component.getHeroes();
        expect(component.heroes.length).toBe(3);
      });
    });

    describe('delete', () => {
      beforeEach(() => {
        component.ngOnInit();
      });

      it('should be able to delete heroes', () => {
        expect(component.heroes.length).toBe(2);
        component.delete(component.heroes[0]);
        expect(component.heroes.length).toBe(1);
        expect(component.heroes[0].id).toBe(1);
      });
    });
  });

  describe('integration', () => {
    let component: HeroesComponent;
    let componentDe: DebugElement;
    let fixture: ComponentFixture<HeroesComponent>;

    beforeEach(
      async(() => {
        TestBed.configureTestingModule({
          imports: [RouterTestingModule],
          declarations: [HeroesComponent],
          providers: [{ provide: HeroService, useClass: MockHeroService }]
        }).compileComponents();
      })
    );

    beforeEach(() => {
      fixture = TestBed.createComponent(HeroesComponent);
      component = fixture.componentInstance;
      componentDe = fixture.debugElement;
      fixture.detectChanges();
    });

    it('should list-out hero data for each hero', () => {
      const heroesDe = componentDe.queryAll(By.css('.heroes li'));
      const heroLinksDe = heroesDe.map(h => h.query(By.css('a')));

      expect(heroesDe.length).toBe(component.heroes.length);
      expect(heroesDe.length).toBe(2);
      expect(heroLinksDe[0].nativeElement.textContent.trim()).toBe('0 Mr. Incredible');
      expect(heroLinksDe[1].nativeElement.textContent.trim()).toBe('1 Mr. Potato Head');
    });

    it('should contain router links for each hero', () => {
      const routerLinks = componentDe
        .queryAll(By.directive(RouterLinkWithHref))
        .map(de => de.injector.get(RouterLinkWithHref));

      expect(routerLinks.length).toBe(2);
      expect(routerLinks[0].href).toBe('/detail/0');
      expect(routerLinks[1].href).toBe('/detail/1');
    });

    describe('adding', () => {
      it('should update the hero list', () => {
        const addSpy = spyOn(component, 'add').and.callThrough();
        const addInputDe = componentDe.query(By.css('input'));
        const addButtonDe = componentDe.query(By.css('button'));

        (addInputDe.nativeElement as HTMLInputElement).value = 'Wonder Woman';
        addButtonDe.triggerEventHandler('click', null);

        fixture.detectChanges();

        const heroesDe = componentDe.queryAll(By.css('.heroes li'));
        const heroLinksDe = heroesDe.map(h => h.query(By.css('a')));

        expect(addSpy).toHaveBeenCalledTimes(1);
        expect(heroesDe.length).toBe(3);
        expect(heroLinksDe[0].nativeElement.textContent.trim()).toBe('0 Mr. Incredible');
        expect(heroLinksDe[1].nativeElement.textContent.trim()).toBe('1 Mr. Potato Head');
        expect(heroLinksDe[2].nativeElement.textContent.trim()).toBe('2 Wonder Woman');
      });

      it('should clear the input field after click', () => {
        const addSpy = spyOn(component, 'add').and.callThrough();
        const addInputDe = componentDe.query(By.css('input'));
        const addButtonDe = componentDe.query(By.css('button'));

        (addInputDe.nativeElement as HTMLInputElement).value = 'Wonder Woman';
        addButtonDe.triggerEventHandler('click', null);

        expect(addSpy).toHaveBeenCalledTimes(1);
        expect((addInputDe.nativeElement as HTMLInputElement).value).toBe('');
      });
    });

    describe('deleting', () => {
      it('should update the hero list', () => {
        const deleteSpy = spyOn(component, 'delete').and.callThrough();
        const deleteButtonDe = componentDe.queryAll(By.css('.heroes li button'));

        deleteButtonDe[0].triggerEventHandler('click', null);

        fixture.detectChanges();

        const heroesDe = componentDe.queryAll(By.css('.heroes li'));
        const heroLinksDe = heroesDe.map(h => h.query(By.css('a')));

        expect(deleteSpy).toHaveBeenCalledTimes(1);
        expect(heroesDe.length).toBe(1);
        expect(heroLinksDe[0].nativeElement.textContent.trim()).toBe('1 Mr. Potato Head');
      });
    });
  });
});
