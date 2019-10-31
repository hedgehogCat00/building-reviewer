import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { BuildingChartService } from './building-chart.service';
import { zip as RxZip } from 'rxjs';
import { Object3D, Mesh, Material, Group, Vector3, Color, DoubleSide } from 'three';

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

  @Output() devicesUpdated: EventEmitter<any[]>;
  @Output() floorSelected: EventEmitter<number>;
  @Output() floorDiselected: EventEmitter<number>;
  @Output() getFloorNames: EventEmitter<string[]>;

  constructor(
    private compService: BuildingChartService
  ) {
    compService.onEachFrame = this.onEachFrame.bind(this);
    this.devicesUpdated = new EventEmitter();
    this.floorSelected = new EventEmitter();
    this.floorDiselected = new EventEmitter();
    this.getFloorNames = new EventEmitter();
  }

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
      // Each floor save an empty object
      this.compService.devices = this.floorKeys.map(() => {
        return {} as any;
      });
      this.getFloorNames.emit(this.floorKeys);
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
    service.initHelpers();

    // setInterval(() => {
    //   const id = service.addDevice(this.floorKeys.length - 1, 1, 1);
    //   setTimeout(() => {
    //     service.removeDevice(this.floorKeys.length - 1, id);
    //   }, 1000);
    // }, 2000);

    // service.addDevice(this.floorKeys.length - 1, 0, 0);
    // service.play();


    service.loadModel$('building.dae')
      .subscribe((model: any) => {
        // return;
        const modelScene = model.scene as Object3D;

        // modelScene.traverse(child => console.log('child', child));
        modelScene.traverse((child: any) => {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.type === 'Mesh') {
            // child.castShadow = true;
            // child.receiveShadow = true;
            const name = child.name;
            if (this.floorKeys.includes(name)) {
              // child.material.side = DoubleSide;
              child.userData.isFloor = true;
              child.userData.floorIdx = this.floorKeys.findIndex((key) => key === name);
              child.userData.oriColor = child.material.color.clone();
              this.floors.push(child);
            }
          }
        });

        // Sort in right order
        this.floors.sort((a, b) => a.userData.floorIdx - b.userData.floorIdx);

        // const floorGroups = [];
        this.floors.forEach(floor => {
          const group = new Group();
          group.name = `${floor.name}-group`;
          group.castShadow = true;
          group.receiveShadow = true;
          const cpos = floor.position;
          // const cpos = floor.parent.matr(floor.position.clone());
          group.position.set(cpos.x, cpos.y, cpos.z);

          const crot = floor.rotation;
          // const crot = floor.getWorldQuaternion(floor.quaternion.clone());
          group.rotation.set(crot.x, crot.y, crot.z);

          // Save original information
          group.userData.oriPos = group.position.clone();
          group.userData.oriRotation = group.rotation.clone();

          floor.position.set(0, 0, 0);
          floor.rotation.set(0, 0, 0);

          group.add(floor);
          floor.parent = group;

          // floorGroups.push(group);

          modelScene.remove(floor);
          modelScene.add(group);
          // service.scene.add(group);
        });
        console.log('get model', model);
        service.scene.add((modelScene));
        service.play();

        service.addDevice(this.floorKeys.length - 1, 0, 0);
      }, err => {
        console.error(err);

      });

    // this.compService.addDevice(this.floorKeys.length - 1, 0, 0);
  }

  handleObjCastered(obj) {
    // console.log('castered', obj);
    obj.material.color = new Color(.5, .5, 1);
  }

  handleObjLeaved(obj) {
    // console.log('leaved', obj);
    obj.material.color = obj.userData.oriColor.clone();
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
        this.floorDiselected.emit(service.selectedObj.userData.floorIdx);
      }
      service.selectedObj = service.casteredObj;
      service.selectedObj.userData.selected = true;
      console.log(`floor ${service.selectedObj.name} is selected`);
      this.floorSelected.emit(service.selectedObj.userData.floorIdx);
      service.focusOnFloor(service.selectedObj);
    } else {
      if (service.selectedObj) {
        service.selectedObj.userData.selected = false;
        this.floorDiselected.emit(service.selectedObj.userData.floorIdx);
        service.resetCam();
      }
      service.selectedObj = null;
    }
  }

  addDevice(floorIdx: number, u: number, v: number): Mesh {
    return this.compService.addDevice(floorIdx, u, v);
  }

  removeDevice(floorIdx: number, id: number) {
    this.compService.removeDevice(floorIdx, id);
  }

  private onEachFrame() {
    // this.emitDeviceScreenPos();
  }

  // private emitDeviceScreenPos() {
  //   this.devicesUpdated.emit(this.compService.devices);
  //   const info = this.compService.devices.map(devicesOneFloor => {

  //   });
  // }

}
