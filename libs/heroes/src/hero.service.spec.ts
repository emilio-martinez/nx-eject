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
      const mockHeroes: Hero[] = [{ id: 0, name: 'Mr. Incredible' }, { id: 1, name: 'Mr. Potato Head' }];

      heroService.getHeroes().subscribe(res => {
        expect(res.length).toBe(2);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes('fetched heroes')).toBeTruthy();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockHeroes);
    });

    it('should return empty when requests errors', () => {
      heroService.getHeroes().subscribe(res => {
        expect(res.length).toBe(0);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes('getHeroes failed')).toBeTruthy();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getHeroNo404', () => {
    const mockId = 999;
    const endpoint = (id: number) => `${apiUrl}/?id=${id}`;

    it('should return a single hero for a matching id', () => {
      const mockHeroes: Hero[] = [{ id: mockId, name: 'Mr. Incredible' }, { id: mockId, name: 'Mr. Potato Head' }];

      heroService.getHeroNo404(mockId).subscribe(res => {
        expect(typeof res).toBe('object');
        expect(res).toEqual(mockHeroes[0]);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes(`fetched hero id=${res.id}`)).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(mockId));
      expect(req.request.method).toBe('GET');
      req.flush(mockHeroes);
    });

    it('should return undefined when no id is found', () => {
      heroService.getHeroNo404(mockId).subscribe(res => {
        expect(res).toEqual(undefined);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes(`did not find hero id=${mockId}`)).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(mockId));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should return undefined when requests errors', () => {
      heroService.getHeroNo404(mockId).subscribe(res => {
        expect(res).toBe(undefined);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes(`getHero id=${mockId} failed`)).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(mockId));
      expect(req.request.method).toBe('GET');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getHero', () => {
    const mockId = 999;
    const endpoint = (id: number) => `${apiUrl}/${id}`;

    it('should return a single hero for a matching id', () => {
      const mockHero: Hero = { id: mockId, name: 'Mr. Incredible' };

      heroService.getHero(mockId).subscribe(res => {
        expect(typeof res).toBe('object');
        expect(res).toEqual(mockHero);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes(`fetched hero id=${res.id}`)).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(mockId));
      expect(req.request.method).toBe('GET');
      req.flush(mockHero);
    });

    it('should return a 404 when no id is found', () => {
      heroService.getHero(mockId).subscribe(res => {
        expect(res).toEqual(undefined);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes(`getHero id=${mockId}`)).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(mockId));
      expect(req.request.method).toBe('GET');
      req.flush(null, { status: 404, statusText: 'Not Found' });
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
      const mockHeroes: Hero[] = [{ id: 0, name: 'Mr. Incredible' }, { id: 1, name: 'Mr. Potato Head' }];

      heroService.searchHeroes(term).subscribe(res => {
        expect(res.length).toBe(2);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes('found heroes')).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(term));
      expect(req.request.method).toBe('GET');
      req.flush(mockHeroes);
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
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('addHero', () => {
    const mockHero: Hero = { id: 0, name: 'Mr. Incredible' };

    it('should be able to add a hero', () => {
      heroService.addHero(mockHero).subscribe(res => {
        expect(res).toEqual(mockHero);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes(`added hero w/ id=${res.id}`)).toBeTruthy();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockHero);
    });

    it('should return empty when requests errors', () => {
      heroService.addHero(mockHero).subscribe(res => {
        expect(res).toBe(undefined);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes('addHero failed')).toBeTruthy();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('deleteHero', () => {
    const endpoint = (id: number) => `${apiUrl}/${id}`;
    const mockHero: Hero = { id: 0, name: 'Mr. Incredible' };

    it('should be able to delete a hero by object', () => {
      heroService.deleteHero(mockHero).subscribe(res => {
        expect(res).toEqual(mockHero);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes(`deleted hero id=${res.id}`)).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(mockHero.id));
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockHero);
    });

    it('should be able to delete a hero by id', () => {
      heroService.deleteHero(mockHero.id).subscribe(res => {
        expect(res).toEqual(mockHero);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes(`deleted hero id=${res.id}`)).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(mockHero.id));
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockHero);
    });

    it('should return empty when requests errors', () => {
      heroService.deleteHero(mockHero).subscribe(res => {
        expect(res).toBe(undefined);
        expect(messageService.messages.length).toBe(1);
        expect(messageService.messages[0].includes('deleteHero failed')).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint(mockHero.id));
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
