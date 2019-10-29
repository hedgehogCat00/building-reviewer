import { TestBed } from '@angular/core/testing';

import { BuildingChartService } from './building-chart.service';

describe('BuildingChartService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BuildingChartService = TestBed.get(BuildingChartService);
    expect(service).toBeTruthy();
  });
});
