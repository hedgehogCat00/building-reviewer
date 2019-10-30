import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { BuildingChartService } from './building-chart.service';
import { zip as RxZip } from 'rxjs';
import { Object3D, Mesh, Material } from 'three';

@Component({
  selector: 'app-building-chart',
  templateUrl: './building-chart.component.html',
  styleUrls: ['./building-chart.component.sass']
})
export class BuildingChartComponent implements OnInit {
  floorKeys: string[];
  floors: Mesh[];
  @ViewChild('canvasContainer', { static: true }) canvasContainer: ElementRef;

  constructor(
    private compService: BuildingChartService
  ) {
    this.floors = [];
  }

  ngOnInit() {
    console.log('start to get information');

    this.compService.objCasteredEvt.subscribe(obj => this.handleObjCastered.bind(this));
    this.compService.objLeaveEvt.subscribe(obj => this.handleObjLeaved.bind(this));
    this.compService.canvasClicked.subscribe(e => this.handleCanvasClicked.bind(this));

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
    service.initLights();
    service.initGrid();

    service.loadModel$('building.dae')
      .subscribe((model: any) => {
        console.log('get model', model);
        const modelScene = model.scene as Object3D;
        // modelScene.traverse(child => console.log('child', child));
        modelScene.traverse((child: any) => {
          if (child.type === 'Mesh') {
            child.castShadow = true;
            child.receiveShadow = true;
            this.floors.push(child);
            // service.scene.add(child);
          }
        });
        service.scene.add((modelScene));
        service.play();
      }, err => {
        console.error(err);

      });
  }

  handleObjCastered(obj) {
    console.log('castered', obj);
  }
  
  handleObjLeaved(obj) {}
  
  handleCanvasClicked(e:MouseEvent) {

  }

}
