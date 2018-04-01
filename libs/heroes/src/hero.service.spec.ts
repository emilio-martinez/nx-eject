import { TestBed, inject } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HeroService } from './hero.service';
import { MessageService } from '@myprojectname/messages';
import { Hero } from './hero';

describe('HeroService', () => {
  const apiUrl = 'api/heroes';
  let heroService: HeroService;
  let messageService: MessageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HeroService, MessageService]
    });
  });

  beforeEach(
    inject(
      [HeroService, MessageService, HttpTestingController],
      (heroSvc: HeroService, messageSvc: MessageService, httpTestingCtrl: HttpTestingController) => {
        heroService = heroSvc;
        messageService = messageSvc;
        httpMock = httpTestingCtrl;
      }
    )
  );

  afterEach(() => {
    httpMock.verify();
  });

  describe('getHeroes', () => {
    it('should return observable with hero array', () => {
      const mockUsers: Hero[] = [{ id: 0, name: 'Mr. Incredible' }, { id: 1, name: 'Mr. Potato Head' }];

      heroService.getHeroes().subscribe(res => {
        expect(res.length).toBe(2);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes('fetched heroes')).toBeTruthy();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should return empty when requests errors', () => {
      heroService.getHeroes().subscribe(res => {
        expect(res.length).toBe(0);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes('getHeroes failed')).toBeTruthy();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(null, { status: 400, statusText: 'Error' });
    });
  });

  describe('searchHeroes', () => {
    const endpoint = (term: string) => `${apiUrl}/?name=${term}`;

    it('should return empty when no term is provided', () => {
      heroService.searchHeroes('').subscribe(res => {
        expect(res).toEqual([]);
        expect(messageService.messages.length).toBe(0);
      });

      httpMock.expectNone(endpoint(''));
    });

    it('should return observable with hero array', () => {
      const term = 'Mr.';
      const mockUsers: Hero[] = [{ id: 0, name: 'Mr. Incredible' }, { id: 1, name: 'Mr. Potato Head' }];

      heroService.searchHeroes(term).subscribe(res => {
        expect(res.length).toBe(2);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes('found heroes')).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(term));
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should return empty when requests errors', () => {
      const term = 'Mr.';

      heroService.searchHeroes(term).subscribe(res => {
        expect(res.length).toBe(0);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes('searchHeroes failed')).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(term));
      expect(req.request.method).toBe('GET');
      req.flush(null, { status: 400, statusText: 'Error' });
    });
  });
});
