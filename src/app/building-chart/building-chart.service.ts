import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  WebGLRenderer, Scene, Color, PerspectiveCamera, GridHelper
} from 'three';
import {
  OrbitControls,
  FBXLoader,
  ColladaLoader
} from 'three-full';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BuildingChartService {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  gridHelper: GridHelper;

  private host = '/api';

  constructor(
    private httpClient: HttpClient
  ) {
    this.initialize();
  }

  getFloorsNames$() {
    return this.httpClient.get(`${this.host}/floorsList`);
  }

  getModel$() {
    const headers = new HttpHeaders({
      'Accept': 'application/octet-stream',
      'Content-Type': 'application/octet-stream'
    });
    return this.httpClient.get(`${this.host}/model`, {
      headers: headers
    });
  }

  loadModel$(fileName) {
    // const loader = new FBXLoader();
    // load dae format model
    const loader = new ColladaLoader();
    return new Observable(subs => {
      loader.load(`${this.host}/model/${fileName}`, model => {
        subs.next(model);
      }, undefined, err => {
        subs.error(err);
      });
    });
  }

  initRenderer(dom: HTMLElement) {
    const renderer = this.renderer;
    renderer.setSize(dom.clientWidth, dom.clientHeight);
    renderer.shadowMap.enabled = true;// 打开辅助线
    dom.appendChild(renderer.domElement);

    dom.onresize = () => {
      renderer.setSize(dom.clientWidth, dom.clientHeight);
      if(this.camera) {
        this.camera.aspect = dom.clientWidth / dom.clientHeight;
        this.camera.updateProjectionMatrix();
      }
    }
  }

  initScene() {
    this.scene.background = new Color('#fff');
  }

  initCamera(dom: HTMLElement) {
    const config = {
      fov: 30, near: 1, far: 1000
    };
    this.camera = new PerspectiveCamera(config.fov, dom.clientWidth / dom.clientHeight, config.near, config.far);
    const pos = { x: 20, y: 20, z: 20 };
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.camera.lookAt(0, 0, 0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  initGrid() {
    this.gridHelper = new GridHelper(100, 50);
    this.scene.add(this.gridHelper);
  }

  private initialize() {
    this.renderer = new WebGLRenderer();
    this.scene = new Scene();
  }
}
