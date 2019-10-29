import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { BuildingChartService } from './building-chart.service';
import { zip as RxZip } from 'rxjs';
import { Object3D } from 'three';

@Component({
  selector: 'app-building-chart',
  templateUrl: './building-chart.component.html',
  styleUrls: ['./building-chart.component.sass']
})
export class BuildingChartComponent implements OnInit {
  floorKeys:string[];
  @ViewChild('canvasContainer', {static: true}) canvasContainer: ElementRef;

  constructor(
    private compService: BuildingChartService
  ) { }

  ngOnInit() {
    console.log('start to get information');

    RxZip(
      this.compService.getFloorsNames$(),
      // this.compService.getModel$()
    ).subscribe(res => {
      console.log('get list and model data', res[0]);
      this.floorKeys = res[0] as string[];
      this.init();
    });
  }

  init() {
    const service = this.compService;
    const el = this.canvasContainer.nativeElement;
    service.initRenderer(el);
    service.initCamera(el);
    service.initScene();
    service.initGrid();

    service.loadModel$('building.dae')
    .subscribe((model:any) => {
      console.log('get model', model);
      service.scene.add((model.scene) as Object3D);
    }, err => {
      console.error(err);
      
    });
  }

}
