import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { BuildingChartComponent } from '../building-chart/building-chart.component';
import { Mesh, MeshBasicMaterial, Group, Color, Object3D, BoxGeometry, Scene, DoubleSide, MeshPhongMaterial } from 'three';
import { FormControl } from '@angular/forms';
import { state, trigger, style, transition, animate, animation } from '@angular/animations';
import { DevicePanelService } from './device-panel.service';
import { SCENE } from '../building-chart/entity';

interface Device {
  type: DeviceType;
  name: string;
  style: any;
  id: number;
  mesh: Mesh;
  floorIdx: number;

  // When set to false,
  // hide animation will display
  alive?: boolean;
}

interface Floor {
  name: string;
  devices: Device[];
}

interface DeviceType {
  type: string;
  imgUrl: string;
  // type1: 蓝色尖角
  // type2: 灰色圆形
  UIType: 'type1' | 'type2';
}

@Component({
  selector: 'app-device-panel',
  templateUrl: './device-panel.component.html',
  styleUrls: ['./device-panel.component.sass'],
  animations: [
    trigger('iconState', [
      state('show', style({
        opacity: 1,
        display: 'block'
      })),
      state('hide', style({
        opacity: 0,
        display: 'none'
      })),
      transition('show => hide', animation([
        style({ opacity: 1 }),
        animate('.3s ease-out', style({ opacity: 0 }))
      ])),
      transition('hide => show', animation([
        style({ opacity: 0, display: 'block' }),
        animate('.3s ease-out', style({ opacity: 1 }))
      ]))
    ])
  ]
})
export class DevicePanelComponent implements OnInit, AfterViewInit {

  floors: Floor[];

  deviceTypes: DeviceType[];

  targetFloorIdx: number;
  onViewFloorIdx: number;

  modalShow: boolean;

  dockCubImgUrl = require('../../assets/images/dock-cube.png');
  wetSensorImgUrl = require('../../assets/images/wet-sensor.png');
  tempSensorImgUrl = require('../../assets/images/temp-sensor.png');
  co2SensorImgUrl = require('../../assets/images/co2-sensor.png');
  infraredSensorImgUrl = require('../../assets/images/infrared-sensor.png');
  fanImgUrl = require('../../assets/images/fan.png');

  @ViewChild(BuildingChartComponent, { static: true }) chartComp: BuildingChartComponent;
  @ViewChild('container', { static: true }) container: ElementRef;
  get devices(): Device[] {
    if (!this.floors) {
      return [];
    } else {
      return [].concat(...this.floors.map(f => f.devices));
    }
  }

  constructor(
    private compService: DevicePanelService
  ) {
    this.floors = [];
    this.deviceTypes = [
      {
        type: '空气检测',
        imgUrl: this.dockCubImgUrl,
        UIType: 'type1'
      },
      {
        type: '湿度传感器',
        imgUrl: this.wetSensorImgUrl,
        UIType: 'type1'
      },
      {
        type: '温度传感器',
        imgUrl: this.tempSensorImgUrl,
        UIType: 'type1'
      },
      {
        type: '二氧化碳传感器',
        imgUrl: this.co2SensorImgUrl,
        UIType: 'type1'
      },
      {
        type: '红外传感器',
        imgUrl: this.infraredSensorImgUrl,
        UIType: 'type1'
      },
      {
        type: '排风阀',
        imgUrl: this.fanImgUrl,
        UIType: 'type2'
      }
    ];
  }

  ngOnInit() { }

  ngAfterViewInit() {}

  modelOnReady(floors: Mesh[]) {
    const renderer = this.chartComp.renderer;
    const bloomPass = this.chartComp.bloomPass;
    this.compService.genGUI(renderer, bloomPass);

    floors.forEach(floor => {
      (floor as any).cursor = 'pointer';

      floor.castShadow = true;
      floor.receiveShadow = true;
      floor.layers.enable(SCENE.BLOOM_SCENE);

      // Create unique material for each floor obj
      const floorMat = floor.material as MeshBasicMaterial;
      floorMat.side = DoubleSide;
      floorMat.color.setHex(0xa5cacbc);
      floorMat.transparent = true;
      floor.userData.oriColor = floorMat.color.clone();

      floor.material = floorMat.clone();

      // this.addBackPanel(floor.parent as Group, floor);

      // const boxGeo = new BoxGeometry(2, 2, 2);
      // const mat = new MeshBasicMaterial({color: 0xa0dadd});
      // const box = new Mesh(boxGeo, mat);
      // box.layers.enable(SCENE.BLOOM_SCENE);
      // (box.material as any).depthWrite = false;
      // floor.parent.add(box);
    });
  }

  onObjHovered(obj: Object3D) {
    // console.log('castered', obj);
    const data = obj.userData;
    if (data.isFloor && !data.isSelected) {
      const mat = (obj as Mesh).material as MeshBasicMaterial;
      mat.color = new Color(.5, .5, 1);
    }
  }

  onObjLeaved(obj: Object3D) {
    // console.log('leaved', obj);
    const data = obj.userData;
    if (data.isFloor) {
      const mat = (obj as Mesh).material as MeshBasicMaterial;
      mat.color = data.oriColor.clone();
    }
  }

  floorDiselected(floorIdx: number) {
    const floorMesh = this.chartComp.floors[floorIdx];
    floorMesh.layers.enable(SCENE.BLOOM_SCENE);
    this.onViewFloorIdx = null;

    // const TWEEN = this.chartComp.TWEEN;
    // const floorMesh = this.chartComp.floors[floorIdx];
    // // Unfade floor
    // const fmat = floorMesh.material as MeshBasicMaterial;
    // // Set opacity to 1
    // const fopacity = fmat.opacity;
    // const fvalObj = { val: fopacity };
    // new TWEEN.Tween(fvalObj)
    //   .to({ val: 1 })
    //   .easing(TWEEN.Easing.Quadratic.Out)
    //   .onUpdate(() => { fmat.opacity = fvalObj.val; })
    //   .start();

    // // Hide backpanel
    // const backPanel = floorMesh.parent.getObjectByName('back-panel') as Mesh;
    // const mat = backPanel.material as MeshBasicMaterial;
    // const opacity = mat.opacity;
    // const valObj = { val: opacity };
    // // Set opacity to 0
    // new TWEEN.Tween(valObj)
    //   .to({ val: 0 })
    //   .easing(TWEEN.Easing.Quadratic.Out)
    //   .onUpdate(() => { mat.opacity = valObj.val; })
    //   .start();
  }

  floorSelected(floorIdx: number) {
    const floorMesh = this.chartComp.floors[floorIdx];
    floorMesh.layers.disable(SCENE.BLOOM_SCENE);
    this.onViewFloorIdx = floorIdx;

    // const TWEEN = this.chartComp.TWEEN;
    // const floorMesh = this.chartComp.floors[floorIdx];
    // // Fade floor
    // const fmat = floorMesh.material as MeshBasicMaterial;
    // // Set opacity to 0.6
    // const fopacity = fmat.opacity;
    // const fvalObj = { val: fopacity };
    // new TWEEN.Tween(fvalObj)
    //   .to({ val: 0.6 })
    //   .easing(TWEEN.Easing.Quadratic.Out)
    //   .onUpdate(() => { fmat.opacity = fvalObj.val; })
    //   .start();

    // // Show backpanel
    // const backPanel = floorMesh.parent.getObjectByName('back-panel') as Mesh;
    // const mat = backPanel.material as MeshBasicMaterial;
    // // Set opacity to 0.8
    // const opacity = mat.opacity;
    // const valObj = { val: opacity };
    // new TWEEN.Tween(valObj)
    //   .to({ val: 0.8 })
    //   .easing(TWEEN.Easing.Quadratic.Out)
    //   .onUpdate(() => { mat.opacity = valObj.val; })
    //   .start();
  }

  nothingSelected() {
    this.onViewFloorIdx = null;
  }

  selectFloor(floorIdx: number) {
    this.chartComp.selectFloor(floorIdx);
  }

  getFloorNames(floorNames: string[]) {
    this.floors = floorNames.map(name => {
      return { name, devices: [] };
    });
  }

  removeDevice(floorIdx: number, id: number) {
    const devices = this.floors[floorIdx].devices;
    const idx = devices.findIndex(d => d.id === id);
    const device = devices[idx];
    device.alive = false;

    setTimeout(() => {
      this.chartComp.removeDevice(floorIdx, id);
      devices.splice(idx, 1);
    }, 30);
  }

  raiseModal(floorIdx: number) {
    this.targetFloorIdx = floorIdx;
    this.modalShow = true;
  }

  closeModal() {
    this.modalShow = false;
  }

  createDevice(form: FormControl) {
    const value = form.value;
    const deviceMesh = this.chartComp.addDevice(this.targetFloorIdx, Number(value.xpos), Number(value.ypos));
    const type = this.deviceTypes.find(t => t.type === value.type);

    const device = {
      name: value.name,
      id: deviceMesh.id,
      type,
      style: {},
      mesh: deviceMesh,
      floorIdx: this.targetFloorIdx
    } as Device;
    this.floors[this.targetFloorIdx].devices.push(device);
  }

  getDeviceStyle(device: Device) {
    if (!this.container) {
      return device.style || {};
    } else {
      const dom = this.container.nativeElement as HTMLElement;
      const coord = device.mesh.userData.screenCoord || { x: -Infinity, y: -Infinity };
      return {
        left: `${coord.x + dom.offsetLeft}px`,
        top: `${coord.y + dom.offsetTop}px`
      };
    }
  }

  getIconState(device: Device): 'show' | 'hide' {
    return (device.floorIdx === this.onViewFloorIdx) && (device.alive !== false) ? 'show' : 'hide';
  }


  // As background of floor object
  // private addBackPanel(group: Group, floor: Mesh) {
  //   const back = floor.clone();
  //   back.material = new MeshBasicMaterial({ color: 0x191e24 });
  //   back.userData.oriColor = new Color(0x191e24);
  //   // A bit offset by floor
  //   back.position.setZ(back.position.z - .001);
  //   back.name = 'back-panel';
  //   back.material.transparent = true;
  //   back.material.opacity = 0;
  //   group.add(back);
  // }


}
