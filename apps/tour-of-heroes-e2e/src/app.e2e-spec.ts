import { AppPage } from './app.po';

describe('tour-of-heroes App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display the main headline', () => {
    page.navigateTo();
    expect(page.text()).toContain('Tour of Heroes');
  });
});
