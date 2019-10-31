import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { BuildingChartComponent } from '../building-chart/building-chart.component';
import { Mesh } from 'three';
import { FormControl } from '@angular/forms';
import { state, trigger, style, transition, animate, animation } from '@angular/animations';

interface Device {
  type: DeviceType;
  name: string;
  style: any;
  id: number;
  mesh: Mesh;
  floorIdx: number;
}

interface Floor {
  name: string;
  devices: Device[];
}

interface DeviceType {
  type: string;
  imgUrl: string;
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
        style({opacity: 1}),
        animate('.3s ease-out', style({opacity: 0}))
      ])),
      transition('hide => show', animation([
        style({opacity: 0, display: 'block'}),
        animate('.3s ease-out', style({opacity: 1}))
      ]))
    ])
  ]
})
export class DevicePanelComponent implements OnInit {

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
  constructor() {
    this.floors = [];
    this.deviceTypes = [
      {
        type: '空气检测',
        imgUrl: this.dockCubImgUrl
      },
      {
        type: '湿度传感器',
        imgUrl: this.wetSensorImgUrl
      },
      {
        type: '温度传感器',
        imgUrl: this.tempSensorImgUrl
      },
      {
        type: '二氧化碳传感器',
        imgUrl: this.co2SensorImgUrl
      },
      {
        type: '红外传感器',
        imgUrl: this.infraredSensorImgUrl
      },
      {
        type: '排风阀',
        imgUrl: this.fanImgUrl
      }
    ];
  }

  ngOnInit() {
  }

  floorDiselected(floorIdx: number) {
    if(floorIdx === null) {
      this.onViewFloorIdx = null;
    }
   }

  floorSelected(floorIdx: number) { 
    this.onViewFloorIdx = floorIdx;
  }

  selectFloor(floorIdx: number) {
    this.chartComp.selectFloor(floorIdx);
  }

  // devicesUpdated(devices: { [id: string]: Mesh }[]) { }

  getFloorNames(floorNames: string[]) {
    this.floors = floorNames.map(name => {
      return { name, devices: [] };
    });
  }

  removeDevice(floorIdx: number, id: number) {
    this.chartComp.removeDevice(floorIdx, id);

    const devices = this.floors[floorIdx].devices;
    this.floors[floorIdx].devices = devices.filter(d => d.id !== id);
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

  getIconState(device:Device):'show'|'hide' {
    return device.floorIdx === this.onViewFloorIdx ? 'show' : 'hide';
  }

}
