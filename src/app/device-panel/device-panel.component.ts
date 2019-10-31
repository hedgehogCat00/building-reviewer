import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { BuildingChartComponent } from '../building-chart/building-chart.component';
import { Mesh } from 'three';
import { FormControl } from '@angular/forms';

interface Device {
  type: DeviceType;
  name: string;
  style: any;
  id: number;
  mesh: Mesh;
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
  styleUrls: ['./device-panel.component.sass']
})
export class DevicePanelComponent implements OnInit {

  floors: Floor[];

  deviceTypes: DeviceType[];

  selectedFloorIdx: number;

  modalShow: boolean;

  @ViewChild(BuildingChartComponent, { static: true }) chartComp: BuildingChartComponent;
  @ViewChild('container', { static: true }) container: ElementRef;
  get devices(): Device[] {
    if (!this.floors) {
      return [];
    } else {
      return [].concat(this.floors.map(f => f.devices));
    }
  }
  constructor() {
    this.floors = [];
    this.deviceTypes = [
      {
        type: '风检测',
        imgUrl: ''
      },
      {
        type: '电检测',
        imgUrl: ''
      },
      {
        type: 'CO2检测',
        imgUrl: ''
      },
      {
        type: 'SO2检测',
        imgUrl: ''
      }
    ];
  }

  ngOnInit() {
  }

  floorDiselected(floorIdx: number) { }

  floorSelected(floorIdx: number) { }

  // devicesUpdated(devices: { [id: string]: Mesh }[]) { }

  getFloorNames(floorNames: string[]) {
    this.floors = floorNames.map(name => {
      return { name, devices: [] };
    });
  }

  removeDevice(floorIdx: number, id: number) {
    this.chartComp.removeDevice(floorIdx, id);
  }

  raiseModal(floorIdx: number) {
    this.selectedFloorIdx = floorIdx;
  }

  createDevice(form: FormControl) {
    const value = form.value;
    const deviceMesh = this.chartComp.addDevice(this.selectedFloorIdx, value.x, value.y);
    const type = this.deviceTypes.find(t => t.type === value.type);

    const device = {
      id: deviceMesh.id,
      type,
      style: {},
      mesh: deviceMesh
    } as Device;
    this.floors[this.selectedFloorIdx].devices.push(device);

    this.modalShow = false;
  }

  getDeviceStyle(device: Device) {
    if (!this.container) {
      return device.style;
    } else {
      const dom = this.container.nativeElement as HTMLElement;
      const pos = device.mesh.userData.screenPos;
      return {
        left: `${pos.x + dom.offsetLeft}px`,
        top: `${pos.y + dom.offsetTop}px`
      };
    }
  }

}
