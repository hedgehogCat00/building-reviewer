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
  Vector2, Mesh, BoxGeometry, MeshBasicMaterial
} from 'three';
import {
  OrbitControls,
  FBXLoader,
  ColladaLoader
} from 'three-full';
import { Interaction } from 'three.interaction';
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
  interaction: Interaction;

  casteredObj: Mesh = null;
  selectedObj:Mesh = null;

  objCasteredEvt: EventEmitter<any>;
  objLeaveEvt: EventEmitter<any>;
  canvasClicked: EventEmitter<any>;

  floorKeys:string[];
  floors:Mesh[];

  // returned by requestAnimationFrame
  timer: number;
  camInitPos = {x:20,y:20,z:20};
  camInitLookAt = {x:0,y:0,z:0};

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
    this.resetCam();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);

    this.initRaycaster(this.renderer);
    this.interaction = new Interaction(this.renderer, this.scene, this.camera);

    // const cube = new Mesh(
    //   new BoxGeometry(1, 1, 1),
    //   new MeshBasicMaterial({ color: 0xffffff }),
    // ) as any;
    // this.scene.add(cube);
    // cube.cursor = 'pointer';
    // cube.on('click', function(ev) {console.log('cube clicked')});
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
    // const intersects = raycaster.intersectObjects(scene.children);
    const intersects = raycaster.intersectObjects(this.floors);
    if (intersects.length > 0) {
      const intersect = intersects.find(inter => inter.object.userData.isFloor);
      if (intersect) {
        const floorObj = intersect.object;
        if (floorObj !== this.casteredObj) {
          if (this.casteredObj !== null) {
            this.objLeaveEvt.emit(this.casteredObj);
          }
          this.casteredObj = floorObj as Mesh;
          this.objCasteredEvt.emit(floorObj);
        }
      }

      // const currObj = intersects[0].object;
      // // console.log('intersect', intersects);
      // if ((currObj !== this.casteredObj) && (currObj.type === 'Mesh')) {
      //   this.casteredObj = currObj as Mesh;
      //   this.objCasteredEvt.emit(currObj);
      // }
    } else {
      if (this.casteredObj !== null) {
        this.objLeaveEvt.emit(this.casteredObj);
        this.casteredObj = null;
      }

    }
  }

  focusOnFloor(floor:Mesh) {
    const floorPos = floor.position;
    const initPos = this.camInitPos;
    this.camera.position.set(initPos.x, initPos.y, initPos.z + floorPos.z);
    this.camera.lookAt(floorPos);
  }

  resetCam() {
    const pos = this.camInitPos;
    this.camera.position.set(pos.x, pos.y, pos.z);
    const lookAt = this.camInitLookAt;
    this.camera.lookAt(lookAt.x, lookAt.y,lookAt.z);
  }

  private initRaycaster(renderer: WebGLRenderer) {
    this.raycaster = new Raycaster();
    this.mousePos = new Vector2(-Infinity, -Infinity);

    let isMouseDown;
    let isClick = true;
    const dom = renderer.domElement;
    dom.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      isClick = true;
    });
    dom.addEventListener('mouseup', (e) => {
      isMouseDown = false;
    });
    dom.addEventListener('mousemove', (e) => {
      console.log('mouse move');
      
      if(isMouseDown) {
        isClick = false;
      }
      this.updateMousePos(e, dom);
    });
    dom.addEventListener('click', (e) => {
      if(isClick) {
        this.canvasClicked.emit(e);
      }
    });
  }

  private updateMousePos(e: MouseEvent, dom: HTMLCanvasElement) {
    e.preventDefault();
    const boundRect = dom.getBoundingClientRect();
    const deltaX = e.clientX - boundRect.left;
    this.mousePos.setX((deltaX / boundRect.width) * 2 - 1);

    const deltaY = e.clientY - boundRect.top;
    this.mousePos.setY(-(deltaY / boundRect.height) * 2 + 1);
    // console.log('mousePos', this.mousePos);
  }

  private initialize() {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.scene = new Scene();

    this.floorKeys = [];
    this.floors = [];
    this.objCasteredEvt = new EventEmitter();
    this.objLeaveEvt = new EventEmitter();
    this.canvasClicked = new EventEmitter();
  }
}
