import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BuildingChartService {
  private host = '/api';

  constructor(
    private httpClient: HttpClient
  ) { }

  getFloorsNames() {
    return this.httpClient.get(`${this.host}/floorsList`);
  }

  getModel() {
    return this.httpClient.get(`${this.host}/model`);
  }

}
