import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output, Input } from '@angular/core';
import { BuildingChartService } from './building-chart.service';
import { zip as RxZip } from 'rxjs';
import {
  Object3D,
  Mesh,
  Group,
  WebGLRenderer
} from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

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
  get TWEEN() { return this.compService.TWEEN; }
  get renderer(): WebGLRenderer { return this.compService.renderer; }
  get bloomComposer(): EffectComposer { return this.compService.bloomComposer; }
  get bloomPass(): UnrealBloomPass {return this.compService.bloomPass;}

  @ViewChild('glCanvas', { static: true }) glCanvas: ElementRef;

  @Output() floorModelsReady: EventEmitter<Mesh[]>;
  @Output() devicesUpdated: EventEmitter<any[]>;
  @Output() floorSelected: EventEmitter<Mesh>;
  @Output() floorDiselected: EventEmitter<Mesh>;
  @Output() nothingSelected: EventEmitter<void>;
  @Output() getFloorNames: EventEmitter<string[]>;
  @Output() modelOnReady: EventEmitter<Mesh[]>;
  @Output() objOnHovered: EventEmitter<Object3D>;
  @Output() objOnLeaved: EventEmitter<Object3D>;
  @Output() beforeRender: EventEmitter<void>;

  constructor(
    private compService: BuildingChartService
  ) {
    compService.beforeRender = this.onBeforeRender.bind(this);
    this.devicesUpdated = new EventEmitter();
    this.floorSelected = new EventEmitter();
    this.floorDiselected = new EventEmitter();
    this.nothingSelected = new EventEmitter();
    this.getFloorNames = new EventEmitter();
    this.modelOnReady = new EventEmitter();
    this.objOnHovered = new EventEmitter();
    this.objOnLeaved = new EventEmitter();
    this.beforeRender = new EventEmitter();

    this.floorSelected.subscribe(this.onFloorSelected.bind(this));
    this.floorDiselected.subscribe(this.onFloorDiselected.bind(this));
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
    const el = this.glCanvas.nativeElement;
    service.initRenderer(el);
    service.initScene();
    service.initCamera(el);
    service.initLights();
    service.initHelpers();

    service.loadModel$('building2-1.dae')
      .subscribe((model: any) => {
        // return;
        const modelScene = model.scene as Object3D;

        // modelScene.traverse(child => console.log('child', child));
        modelScene.traverse((child: any) => {
          if (child.type === 'Mesh') {
            // child.castShadow = true;
            // child.receiveShadow = true;
            const name = child.name;
            if (this.floorKeys.includes(name)) {
              child.userData.isFloor = true;
              child.userData.floorIdx = this.floorKeys.findIndex((key) => key === name);
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

          modelScene.remove(floor);
          modelScene.add(group);
        });

        console.log('get model', model);
        service.scene.add((modelScene));
        service.play();
        this.modelOnReady.emit(this.floors);
      }, err => {
        console.error(err);

      });

    // this.compService.addDevice(this.floorKeys.length - 1, 0, 0);
  }

  handleObjCastered(obj) {
    obj.userData.hovered = true;
    this.objOnHovered.emit(obj);
  }

  handleObjLeaved(obj) {
    // console.log('leaved', obj);
    const data = obj.userData;
    data.hovered = false;
    this.objOnLeaved.emit(obj);
  }

  handleCanvasClicked() {
    const service = this.compService;
    if (service.casteredObj) {
      if (service.casteredObj === service.selectedObj) {
        return;
      }
      if (service.selectedObj) {
        service.selectedObj.userData.selected = false;
        console.log(`floor ${service.selectedObj.name} is diselected`);
        this.floorDiselected.emit(service.selectedObj);
      }
      service.selectedObj = service.casteredObj;
      service.selectedObj.userData.selected = true;
      console.log(`floor ${service.selectedObj.name} is selected`);
      this.floorSelected.emit(service.selectedObj);
      service.focusOnFloor(service.selectedObj);
    } else {
      if (service.selectedObj) {
        service.selectedObj.userData.selected = false;
        console.log(`floor ${service.selectedObj.name} is diselected`);
        this.floorDiselected.emit(service.selectedObj);
        service.resetCam();
      }
      this.nothingSelected.emit();
      service.selectedObj = null;
    }
  }

  addDevice(floorIdx: number, u: number, v: number): Mesh {
    return this.compService.addDevice(floorIdx, u, v);
  }

  removeDevice(floorIdx: number, id: number) {
    this.compService.removeDevice(floorIdx, id);
  }


  selectFloor(floorIdx: number) {
    const floor = this.floors[floorIdx];
    this.floorSelected.emit(floor);
    this.compService.focusOnFloor(floor);
  }

  onFloorSelected(floor: Mesh) {
    floor.userData.isSelected = true;
  }

  onFloorDiselected(floor: Mesh) {
    const data = floor.userData;
    data.isSelected = false;
  }

  private onBeforeRender() {
    this.beforeRender.emit();
    // this.emitDeviceScreenPos();
  }

}
