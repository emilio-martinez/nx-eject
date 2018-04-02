import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';

import { HeroesComponent } from './heroes.component';
import { HeroService } from '../hero.service';
import { Hero } from '../hero';

class MockHeroService implements Partial<HeroService> {
  private heroes: Hero[] = [
    { id: 0, name: 'Mr. Incredible' },
    { id: 1, name: 'Mr. Potato Head' }
  ];
  private nextId = this.heroes.reduce((maxId, hero) => Math.max(maxId, hero.id), 0);

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
    let fixture: ComponentFixture<HeroesComponent>;

    beforeEach(
      async(() => {
        TestBed.configureTestingModule({
          imports: [RouterTestingModule],
          declarations: [HeroesComponent],
          providers: [
            { provide: HeroService, useClass: MockHeroService }
          ]
        }).compileComponents();
      })
    );

    beforeEach(() => {
      fixture = TestBed.createComponent(HeroesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

});
