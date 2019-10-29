import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingChartComponent } from './building-chart.component';

describe('BuildingChartComponent', () => {
  let component: BuildingChartComponent;
  let fixture: ComponentFixture<BuildingChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuildingChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildingChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
