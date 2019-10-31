import { TestBed } from '@angular/core/testing';

import { DevicePanelService } from './device-panel.service';

describe('DevicePanelService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DevicePanelService = TestBed.get(DevicePanelService);
    expect(service).toBeTruthy();
  });
});
