import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  WebGLRenderer,
  Scene, Color,
  PerspectiveCamera,
  GridHelper,
  Material,
  AmbientLight,
  HemisphereLight,
  Fog,
  DirectionalLight,
  DirectionalLightHelper,
  HemisphereLightHelper,
  Raycaster,
  Vector2, Mesh
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

  mousePos: Vector2;
  raycaster: Raycaster;

  casteredObj: Mesh;

  objCasteredEvt: EventEmitter<any>;
  objLeaveEvt: EventEmitter<any>;
  canvasClicked:EventEmitter<any>;

  // returned by requestAnimationFrame
  timer: number;

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
      Accept: 'application/octet-stream',
      'Content-Type': 'application/octet-stream'
    });
    return this.httpClient.get(`${this.host}/model`, {
      headers
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
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display = 'block';
    dom.appendChild(renderer.domElement);

    dom.onresize = () => {
      renderer.setSize(dom.clientWidth, dom.clientHeight);
      if (this.camera) {
        this.camera.aspect = dom.clientWidth / dom.clientHeight;
        this.camera.updateProjectionMatrix();
      }
    };
  }

  initScene() {
    this.scene.background = new Color(0x22a32);
    this.scene.fog = new Fog(0x191e24, 200, 1000);
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
    this.controls.target.set(0, 0, 0);

    this.initRaycaster(this.renderer);
  }

  initLights() {
    const hemiLight = new HemisphereLight(0xffffff, 0xffffff, .6);
    hemiLight.color.setHSL(.6, 1, .6);
    hemiLight.groundColor.setHSL(.095, 1, .75);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const hemiLightHellper = new HemisphereLightHelper(hemiLight, 10);
    this.scene.add(hemiLightHellper);

    const dirLight = new DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, .95);
    dirLight.position.set(0, 50, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    this.scene.add(dirLight);

    const dirLightHelper = new DirectionalLightHelper(dirLight, 10);
    this.scene.add(dirLightHelper);
  }

  initGrid() {
    this.gridHelper = new GridHelper(2000, 20, 0xffffff, 0xaaaaff);
    const mat = this.gridHelper.material as Material;
    mat.opacity = .2;
    mat.transparent = true;
    this.scene.add(this.gridHelper);
  }

  play() {
    this.renderScene();
  }

  pause() {
    cancelAnimationFrame(this.timer);
  }

  renderScene() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
    this.renderRaycasterObj(this.raycaster, this.scene, this.camera, this.mousePos);
    this.timer = requestAnimationFrame(this.renderScene.bind(this));
  }

  renderRaycasterObj(raycaster: Raycaster, scene: Scene, camera: PerspectiveCamera, mousePos: Vector2) {
    raycaster.setFromCamera(mousePos, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      const currObj = intersects[0].object;
      if ((currObj !== this.casteredObj) && (currObj instanceof Mesh)) {
        this.casteredObj = currObj;
        this.objCasteredEvt.emit(currObj);
      }
    } else {
      this.objLeaveEvt.emit(this.casteredObj);
      this.casteredObj = null;
    }
  }

  private initRaycaster(renderer: WebGLRenderer) {
    this.raycaster = new Raycaster();
    this.mousePos = new Vector2();
    const dom = renderer.domElement;
    dom.addEventListener('mousemove', (e) => {
      this.updateMousePos(e, dom);
    });
    dom.addEventListener('click', (e) => {
      // this.updateMousePos(e, dom);
      this.canvasClicked.emit(e);
    });
  }

  private updateMousePos(e: MouseEvent, dom: HTMLCanvasElement) {
    e.preventDefault();
    const deltaX = e.clientX - dom.offsetLeft;
    this.mousePos.setX((deltaX / dom.width) * 2 - 1);

    const deltaY = e.clientX - dom.offsetLeft;
    this.mousePos.setX((deltaY / dom.height) * 2 - 1);
  }

  private initialize() {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.scene = new Scene();

    this.objCasteredEvt = new EventEmitter();
    this.objLeaveEvt = new EventEmitter();
    this.canvasClicked=new EventEmitter();
  }
}
