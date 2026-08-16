import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SearchRepository } from './search-repository.service';
import { InvalidApiResponseError } from './openverse-response.guard';

const RESPONSE = {
  result_count: 1,
  page_count: 3,
  results: [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Alpha',
      url: 'https://example.test/a.jpg',
      thumbnail: 'https://example.test/a-thumb.jpg',
      width: 10,
      height: 20,
      creator: 'Someone',
      foreign_landing_url: 'https://example.test/a',
    },
  ],
};

describe('SearchRepository', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('should map the response into a search page, when the API responds', () => {
    const repository = TestBed.inject(SearchRepository);
    const controller = TestBed.inject(HttpTestingController);
    let page: unknown;

    repository.search('cats', 1).subscribe((value) => (page = value));
    controller.expectOne((request) => request.url.endsWith('/images/')).flush(RESPONSE);

    expect(page).toEqual({
      results: [
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          title: 'Alpha',
          imageUrl: 'https://example.test/a.jpg',
          thumbnailUrl: 'https://example.test/a-thumb.jpg',
          width: 10,
          height: 20,
          creator: 'Someone',
          sourceUrl: 'https://example.test/a',
        },
      ],
      totalCount: 1,
      pageCount: 3,
    });
  });

  it('should not issue a second request, when the same page is requested again', () => {
    const repository = TestBed.inject(SearchRepository);
    const controller = TestBed.inject(HttpTestingController);

    repository.search('cats', 1).subscribe();
    controller.expectOne((request) => request.url.endsWith('/images/')).flush(RESPONSE);

    repository.search('cats', 1).subscribe();
    controller.verify();
  });

  it('should propagate the failure, when the API responds with a server error', () => {
    const repository = TestBed.inject(SearchRepository);
    const controller = TestBed.inject(HttpTestingController);
    let status: number | undefined;

    repository
      .search('cats', 1)
      .subscribe({ error: (error: { status: number }) => (status = error.status) });
    controller
      .expectOne((request) => request.url.endsWith('/images/'))
      .flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('should request the API again, when a previously failed page is requested again', () => {
    const repository = TestBed.inject(SearchRepository);
    const controller = TestBed.inject(HttpTestingController);

    repository.search('cats', 1).subscribe({ error: () => undefined });
    controller
      .expectOne((request) => request.url.endsWith('/images/'))
      .flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    repository.search('cats', 1).subscribe({ error: () => undefined });

    controller
      .expectOne((request) => request.url.endsWith('/images/'))
      .flush({}, { status: 500, statusText: 'Server Error' });
    controller.verify();
  });

  it('should raise InvalidApiResponseError, when the envelope is malformed', () => {
    const repository = TestBed.inject(SearchRepository);
    const controller = TestBed.inject(HttpTestingController);
    let caught: unknown;

    repository.search('cats', 1).subscribe({ error: (error: unknown) => (caught = error) });
    controller.expectOne((request) => request.url.endsWith('/images/')).flush({ results: 'nope' });

    expect(caught).toBeInstanceOf(InvalidApiResponseError);
  });
});
