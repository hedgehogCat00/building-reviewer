import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BloomTestComponent } from './bloom-test.component';

describe('BloomTestComponent', () => {
  let component: BloomTestComponent;
  let fixture: ComponentFixture<BloomTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BloomTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BloomTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
