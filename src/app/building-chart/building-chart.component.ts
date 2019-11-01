import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { BuildingChartService } from './building-chart.service';
import { zip as RxZip } from 'rxjs';
import { Object3D, Mesh, Material, Group, Vector3, Color, DoubleSide, WebGLRenderer, Scene, PerspectiveCamera, MeshPhongMaterial, MeshBasicMaterial } from 'three';

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
  @ViewChild('canvasContainer', { static: true }) canvasContainer: ElementRef;

  @Output() devicesUpdated: EventEmitter<any[]>;
  @Output() floorSelected: EventEmitter<number>;
  @Output() floorDiselected: EventEmitter<number>;
  @Output() nothingSelected: EventEmitter<void>;
  @Output() getFloorNames: EventEmitter<string[]>;

  constructor(
    private compService: BuildingChartService
  ) {
    compService.onEachFrame = this.onEachFrame.bind(this);
    this.devicesUpdated = new EventEmitter();
    this.floorSelected = new EventEmitter();
    this.floorDiselected = new EventEmitter();
    this.nothingSelected = new EventEmitter();
    this.getFloorNames = new EventEmitter();

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


    service.loadModel$('building2-1.dae')
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
              child.material.transparent = true;
              // // child.material.alphaTest = 0.5;
              // child.material.emissive = new Color(1, 1, 1);
              // child.material.emissiveIntensity = 1;
              // child.material.emissiveMap = child.material.map;

              // Create unique material for each floor obj
              child.material = child.material.clone();

              // child.onBeforeRender = this.onFloorBeforeRender.bind(this, child);
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

          this.addBackPanel(group, floor);

          // floorGroups.push(group);

          modelScene.remove(floor);
          modelScene.add(group);
          // service.scene.add(group);
        });
        console.log('get model', model);
        service.scene.add((modelScene));
        service.play();

        // service.addDevice(this.floorKeys.length - 1, 0, 0);
      }, err => {
        console.error(err);

      });

    // this.compService.addDevice(this.floorKeys.length - 1, 0, 0);
  }

  handleObjCastered(obj) {
    // console.log('castered', obj);
    const data = obj.userData;
    if (!data.isSelected) {
      obj.material.color = new Color(.5, .5, 1);
    }
    obj.userData.hovered = true;
  }

  handleObjLeaved(obj) {
    // console.log('leaved', obj);
    const data = obj.userData;
    obj.material.color = data.oriColor.clone();
    data.hovered = false;
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
        console.log(`floor ${service.selectedObj.name} is diselected`);
        this.floorDiselected.emit(service.selectedObj.userData.floorIdx);
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
    this.floorSelected.emit(floorIdx);
    this.compService.focusOnFloor(this.floors[floorIdx]);
  }

  onFloorSelected(floorIdx: number) {
    const floor = this.floors[floorIdx] as any;
    floor.userData.isSelected = true;

    // Fade floor
    const fmat = floor.material;
    // Set opacity to 0.6
    const fopacity = fmat.opacity;
    const fvalObj = { val: fopacity };
    new this.TWEEN.Tween(fvalObj)
      .to({ val: 0.6 })
      .easing(this.TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => { fmat.opacity = fvalObj.val; })
      .start();

    // Show backpanel
    const backPanel = floor.parent.getObjectByName('back-panel');
    const mat = backPanel.material;
    // Set opacity to 0.8
    const opacity = mat.opacity;
    const valObj = { val: opacity };
    new this.TWEEN.Tween(valObj)
      .to({ val: 0.8 })
      .easing(this.TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => { mat.opacity = valObj.val; })
      .start();
  }

  onFloorDiselected(floorIdx: number) {
    const floor = this.floors[floorIdx] as any;
    const data = floor.userData;
    data.isSelected = false;

    // Unfade floor
    const fmat = floor.material;
    // Set opacity to 1
    const fopacity = fmat.opacity;
    const fvalObj = { val: fopacity };
    new this.TWEEN.Tween(fvalObj)
      .to({ val: 1 })
      .easing(this.TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => { fmat.opacity = fvalObj.val; })
      .start();

    // Hide backpanel
    const backPanel = floor.parent.getObjectByName('back-panel');
    const mat = backPanel.material;
    const opacity = mat.opacity;
    const valObj = { val: opacity };
    // Set opacity to 0
    new this.TWEEN.Tween(valObj)
      .to({ val: 0 })
      .easing(this.TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => { mat.opacity = valObj.val; })
      .start();
  }

  // As background of floor object
  addBackPanel(group: Group, floor: Mesh) {
    const back = floor.clone();
    back.material = new MeshBasicMaterial({color: 0x191e24});
    back.userData.oriColor = new Color(0x191e24);
    // A bit offset by floor
    back.position.setZ(back.position.z - .001);
    back.name = 'back-panel';
    back.material.transparent = true;
    back.material.opacity = 0;
    group.add(back);
  }

  // onFloorBeforeRender(floor: any, renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) {}

  private onEachFrame() {
    // this.emitDeviceScreenPos();
  }

  // private emitDeviceScreenPos() {
  //   this.devicesUpdated.emit(this.compService.devices);
  //   const info = this.compService.devices.map(devicesOneFloor => {

  //   });
  // }

}
