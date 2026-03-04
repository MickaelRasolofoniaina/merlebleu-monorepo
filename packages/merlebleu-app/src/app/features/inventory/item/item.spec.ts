import { ItemService } from './item.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Item, ItemType } from '@merlebleu/shared';

describe('ItemService', () => {
  let service: ItemService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ItemService],
    });
    service = TestBed.inject(ItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch items', () => {
    const mockItems: Item[] = [
      { label: 'Croissant', unitPrice: 1.2, type: ItemType.PASTRY, maxRetentionDays: 2 },
    ];
    service.getItems('', 1, 10).subscribe(({ items, total }) => {
      expect(items.length).toBe(1);
      expect(total).toBe(1);
    });
    const req = httpMock.expectOne('/api/inventory/item?search=&page=1&pageSize=10');
    expect(req.request.method).toBe('GET');
    req.flush({ items: mockItems, total: 1 });
  });

  it('should add item', () => {
    const item: Item = { label: 'Cake', unitPrice: 5, type: ItemType.CAKE, maxRetentionDays: 3 };
    service.addItem(item).subscribe(res => {
      expect(res).toEqual(item);
    });
    const req = httpMock.expectOne('/api/inventory/item');
    expect(req.request.method).toBe('POST');
    req.flush(item);
  });

  it('should edit item', () => {
    const item: Item = { label: 'Cake', unitPrice: 5, type: ItemType.CAKE, maxRetentionDays: 3 };
    service.editItem(item).subscribe(res => {
      expect(res).toEqual(item);
    });
    const req = httpMock.expectOne(`/api/inventory/item/Cake`);
    expect(req.request.method).toBe('PUT');
    req.flush(item);
  });

  it('should delete item', () => {
    const item: Item = { label: 'Cake', unitPrice: 5, type: ItemType.CAKE, maxRetentionDays: 3 };
    service.deleteItem(item).subscribe(res => {
      expect(res).toBeUndefined();
    });
    const req = httpMock.expectOne(`/api/inventory/item/Cake`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
