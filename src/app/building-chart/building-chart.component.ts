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
  get floorKeys(): string[] {
    return this.compService.floorKeys;
  }
  set floorKeys(keys: string[]) {
    this.compService.floorKeys = keys;
  }

  get floors(): Mesh[] {
    return this.compService.floors;
  }
  @ViewChild('canvasContainer', { static: true }) canvasContainer: ElementRef;

  constructor(
    private compService: BuildingChartService
  ) { }

  ngOnInit() {
    console.log('start to get information');

    this.compService.objCasteredEvt.subscribe(this.handleObjCastered.bind(this));
    this.compService.objLeaveEvt.subscribe(this.handleObjLeaved.bind(this));
    this.compService.canvasClicked.subscribe(this.handleCanvasClicked.bind(this));

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
        const modelScene = model.scene as Object3D;
        // modelScene.traverse(child => console.log('child', child));
        modelScene.traverse((child: any) => {
          if (child.type === 'Mesh') {
            child.castShadow = true;
            child.receiveShadow = true;
            const name = child.name;
            if (this.floorKeys.includes(name)) {
              child.userData.isFloor = true;
              child.userData.floorIdx = this.floorKeys.findIndex((key) => key === name);
              this.floors.push(child);
            }
            // service.scene.add(child);
          }
        });
        console.log('get model', model);
        // this.floors.forEach(floor => service.scene.add(floor));
        service.scene.add((modelScene));
        // this.floorKeys.forEach(key => {
        //   const floor = service.scene.getObjectByName(key) as any;
        //   floor.cursor = 'pointer';
        //   floor.on('click', (e) => { console.log('floor clicked', e) });
        //   floor.on('mouseover', e => { floor.material.color = { r: 1, g: .5, b: .5 } })
        //   floor.on('mouseout', e => { floor.material.color = { r: 1, g: 1, b: 1 } })
        //   this.floors.push(floor);
        // });
        // this.floors.forEach((floor: any) => {
        //   service.scene.add(floor);
        //   // floor.cursor = 'pointer';
        //   // floor.on('click', (e) => { console.log('floor clicked', e) });
        //   // floor.on('mouseover', e => { floor.material.color = { r: 1, g: .5, b: .5 } })
        //   // floor.on('mouseout', e => { floor.material.color = { r: 1, g: 1, b: 1 } })
        // });
        // (service.scene as any).on('click',e=>console.log('scene clicked'))
        service.play();
      }, err => {
        console.error(err);

      });
  }

  handleObjCastered(obj) {
    // console.log('castered', obj);
    obj.material.color = { r: 1, g: .5, b: .5 };
  }

  handleObjLeaved(obj) {
    // console.log('leaved', obj);
    obj.material.color = { r: 1, g: 1, b: 1 };
  }

  handleCanvasClicked(e: MouseEvent) {
    const service = this.compService;
    if (service.casteredObj) {
      if (service.casteredObj === service.selectedObj) {
        return;
      }
      if (service.selectedObj) {
        service.selectedObj.userData.selected = false;
        console.log(`floor ${service.selectedObj.name} is diselected`);
      }
      service.selectedObj = service.casteredObj;
      service.selectedObj.userData.selected = true;
      console.log(`floor ${service.selectedObj.name} is selected`);
      service.focusOnFloor(service.selectedObj);
    } else {
      if (service.selectedObj) {
        service.selectedObj.userData.selected = false;
        service.resetCam();
      }
      service.selectedObj = null;
    }
  }

}
