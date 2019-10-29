import { Component, OnInit } from '@angular/core';
import { BuildingChartService } from './building-chart.service';
import { zip as RxZip } from 'rxjs';

@Component({
  selector: 'app-building-chart',
  templateUrl: './building-chart.component.html',
  styleUrls: ['./building-chart.component.sass']
})
export class BuildingChartComponent implements OnInit {

  constructor(
    private compService: BuildingChartService
  ) { }

  ngOnInit() {
    console.log('start to get information');

    RxZip(
      this.compService.getFloorsNames(),
      this.compService.getModel()
    ).subscribe(res => {
      console.log('get list and model data', res[0]);
    });
  }

}
