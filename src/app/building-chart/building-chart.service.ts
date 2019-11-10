import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  WebGLRenderer,
  Scene, Color,
  PerspectiveCamera,
  GridHelper,
  Material,
  AmbientLight,
  Layers,
  HemisphereLight,
  Fog,
  DirectionalLight,
  DirectionalLightHelper,
  HemisphereLightHelper,
  Raycaster,
  Vector2, Mesh, BoxGeometry, MeshBasicMaterial, Vector3, AxesHelper, Group, MeshLambertMaterial, PCFSoftShadowMap, PlaneGeometry,
  ReinhardToneMapping,
  ShaderMaterial
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

import { Interaction } from 'three.interaction';
import { default as _TWEEN } from '@tweenjs/tween.js';
// const TWEEN = require('@tweenjs/tween.js');
import { Observable } from 'rxjs';
import { SCENE, vshader, fshader } from './entity';


@Injectable({
  providedIn: 'root'
})
export class BuildingChartService {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  gridHelper: GridHelper;

  bloomLayer: Layers;
  darkMaterial: MeshBasicMaterial;
  // tempory materials cache
  materials: Map<string, any>;

  // passes
  bloomPass: UnrealBloomPass;
  renderPass: RenderPass;
  finalPass: ShaderPass;

  bloomComposer: EffectComposer;
  finalComposer: EffectComposer;

  mousePos: Vector2;
  raycaster: Raycaster;
  interaction: Interaction;

  casteredObj: Mesh = null;
  selectedObj: Mesh = null;

  objCasteredEvt: EventEmitter<any>;
  objLeaveEvt: EventEmitter<any>;
  canvasClicked: EventEmitter<any>;

  floorKeys: string[];
  floors: Mesh[];
  devices: any[];

  // returned by requestAnimationFrame
  timer: number;
  camInitPos = new Vector3(60, 70, 60);
  camInitLookAt = new Vector3();

  beforeRender: () => void;

  get TWEEN() {
    return _TWEEN;
  }

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
    // const loader = new FBXLoader();
    return new Observable(subs => {
      loader.load(`${this.host}/model/${fileName}`, model => {
        subs.next(model);
      }, undefined, err => {
        subs.error(err);
      });
    });
  }

  initRenderer(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ antialias: true, canvas: canvas });
    const renderer = this.renderer;

    const wWidth = window.innerWidth;
    const wHeight = window.innerHeight;

    // renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setSize(wWidth, wHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.toneMapping = ReinhardToneMapping;
    renderer.domElement.style.display = 'block';

    window.onresize = () => {
      renderer.setSize(wWidth, wHeight);
      if (this.camera) {
        this.camera.aspect = wWidth / wHeight;
        this.camera.updateProjectionMatrix();
      }
      if (this.bloomComposer) {
        this.bloomComposer.setSize(wWidth, wHeight);
      }
      if (this.finalComposer) {
        this.finalComposer.setSize(wWidth, wHeight);
      }
    };
  }

  initScene() {
    this.scene.background = new Color(0x191e24);
    this.scene.fog = new Fog(0x191e24, 40, 1000);
  }

  initCamera(canvas: HTMLCanvasElement) {
    const config = {
      fov: 30, near: 1, far: 1000
    };
    this.camera = new PerspectiveCamera(config.fov, window.innerWidth / window.innerHeight, config.near, config.far);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('changed', e => { });
    this.resetCam();
    // this.controls.target.set(0, 0, 0);

    this.initRaycaster(this.renderer);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.initBloomComposer();
    this.initFinalComposer();
    this.interaction = new Interaction(this.renderer, this.scene, this.camera);

    // const cube = new Mesh(
    //   new BoxGeometry(10, 10, 10),
    //   new MeshBasicMaterial({ color: 0xffffff }),
    // ) as any;
    // this.scene.add(cube);
    // cube.cursor = 'pointer';
    // cube.on('click', function(ev) {console.log('cube clicked')});
  }

  initLights() {
    // const hemiLight = new HemisphereLight(0xffffff, 0xffffff, .6);
    // hemiLight.color.setHSL(.6, 1, .6);
    // hemiLight.groundColor.setHSL(.095, 1, .75);
    // hemiLight.position.set(0, 50, 0);
    // this.scene.add(hemiLight);

    // const hemiLightHellper = new HemisphereLightHelper(hemiLight, 10);
    // this.scene.add(hemiLightHellper);

    // const dirLight = new DirectionalLight(0xffffff, 1);
    // dirLight.color.setHSL(0.1, 1, .95);
    // dirLight.position.set(0, 50, 0);
    // dirLight.castShadow = true;
    // this.scene.add(dirLight);

    // const dirLightHelper = new DirectionalLightHelper(dirLight, 10);
    // this.scene.add(dirLightHelper);

    const ambientLight = new AmbientLight(0x404040);
    this.scene.add(ambientLight);
  }

  initHelpers() {
    this.gridHelper = new GridHelper(2000, 200, 0xffffff, 0xaaaaff);
    const mat = this.gridHelper.material as Material;
    mat.opacity = .2;
    mat.transparent = true;
    this.scene.add(this.gridHelper);

    const axesHelper = new AxesHelper(100);
    this.scene.add(axesHelper);
  }

  play() {
    this.renderScene(Date.now());
  }

  pause() {
    cancelAnimationFrame(this.timer);
  }

  renderBloom() {
    // const scene = this.scene;
    // scene.traverse(this.darkenNonBloomed.bind(this));
    this.floors.forEach(this.darkenNonBloomed.bind(this))
    this.bloomComposer.render();
    this.floors.forEach(this.restoreMaterial.bind(this))
    // scene.traverse(this.restoreMaterial.bind(this));
  }

  renderScene(time) {
    this.TWEEN.update(time);
    this.controls.update();
    this.renderRaycasterObj(this.raycaster, this.scene, this.camera, this.mousePos);
    if (this.beforeRender instanceof Function) {
      this.beforeRender();
    }
    // this.renderer.render(this.scene, this.camera);
    this.renderBloom();
    this.finalComposer.render();

    // this.storeDeviceScreenCoord();
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

  focusOnFloor(floor: Mesh) {
    // Change view
    const group = floor.parent;
    const floorPos = group.getWorldPosition(group.userData.oriPos.clone());

    new this.TWEEN.Tween(this.camera.position)
      .to({ x: 20, y: 15 + floorPos.y, z: 20 }, 1000)
      .easing(this.TWEEN.Easing.Quadratic.Out)
      .start();

    new this.TWEEN.Tween(this.controls.target)
      .to({ x: floorPos.x, y: floorPos.y, z: floorPos.z }, 1000)
      .easing(this.TWEEN.Easing.Quadratic.Out)
      .start();

    // Update other floors
    // Lift the parents of other floors
    const floorIdx = floor.userData.floorIdx;
    this.floors.forEach((f, i) => {
      const parent = f.parent;
      const parentData = parent.userData;

      if (i <= floorIdx) {
        if (!parentData.isLifted) { return; }
        // Reset back to the original position
        parentData.isLifted = false;
        const oriPos = parentData.oriPos;
        new this.TWEEN.Tween(parent.position)
          .to({ z: oriPos.z }, 1000)
          .easing(this.TWEEN.Easing.Quadratic.Out)
          .start();
      } else {
        if (parentData.isLifted) { return; }
        // Lift the parent
        parentData.isLifted = true;
        const currPos = parent.position;
        const gap = 8;
        new this.TWEEN.Tween(parent.position)
          .to({ z: currPos.z + gap }, 1000)
          .easing(this.TWEEN.Easing.Quadratic.Out)
          .start();
      }
    });
  }

  resetCam() {
    // Change view
    const pos = this.camInitPos;
    new this.TWEEN.Tween(this.camera.position)
      .to({ x: pos.x, y: pos.y, z: pos.z }, 1000)
      .easing(this.TWEEN.Easing.Quadratic.Out)
      .start();

    const lookAt = this.camInitLookAt;
    new this.TWEEN.Tween(this.controls.target)
      .to({ x: lookAt.x, y: lookAt.y, z: lookAt.z }, 1000)
      .easing(this.TWEEN.Easing.Quadratic.Out)
      .start();

    // Update other floors
    // Unlift all the floors
    this.floors.forEach((f, i) => {
      const parent = f.parent;
      const parentData = parent.userData;
      if (!parentData.isLifted) { return; }

      // Reset back to the original position
      parentData.isLifted = false;
      const oriPos = parentData.oriPos;
      new this.TWEEN.Tween(parent.position)
        .to({ z: oriPos.z }, 1000)
        .easing(this.TWEEN.Easing.Quadratic.Out)
        .start();
    });
  }

  /**
   *
   * @param floorIdx
   * @param u range from 0-1
   * @param v range from 0-1
   */
  addDevice(floorIdx: number, u: number, v: number): Mesh {
    console.log('add device');
    u = Math.max(Math.min(u, 1), 0);
    v = Math.max(Math.min(v, 1), 0);

    const idx = floorIdx % this.floorKeys.length;
    const floor = this.floors[idx];
    const parent = floor.parent;

    const geo = new BoxGeometry(0.2, 0.02, 0.2);
    const mat = new MeshLambertMaterial({ color: 0xdcaa1c });
    const device = new Mesh(geo, mat);
    device.name = `device-${device.uuid}`;
    device.castShadow = true;
    device.receiveShadow = true;

    floor.geometry.computeBoundingBox();
    const boundery = floor.geometry.boundingBox;
    const minB = boundery.min.multiply(floor.scale);
    const maxB = boundery.max.multiply(floor.scale);

    // console.log('boundery', boundery);
    const width = maxB.x - minB.x;
    const depth = maxB.y - minB.y;
    device.position.setX(width * (u - .5));
    device.position.setY(depth * (v - .5));
    device.position.setZ(0.02);

    // Save into local
    this.devices[idx][device.id] = device;

    // this.scene.add(device);

    // console.log(this.scene);

    device.onBeforeRender = this.storeDeviceScreenCoord.bind(this, device);

    parent.add(device);

    return device;
  }

  removeDevice(floorIdx: number, id: number) {
    console.log('remove device');
    const idx = floorIdx % this.floorKeys.length;
    const floor = this.floors[idx];
    // const device = this.devices[idx][id];
    const device = floor.parent.getObjectById(id);
    // this.scene.remove(device);
    floor.parent.remove(device);

    delete this.devices[idx][id];
  }


  // storeDeviceScreenCoord() {
  //   this.devices.forEach(devicesOneFloor => {
  //     Object.values(devicesOneFloor).forEach((device: Mesh) => {
  //       // const worldMatEl = device.matrixWorld.elements;
  //       // const vec = new Vector3(worldMatEl[12], worldMatEl[13], worldMatEl[14]);
  //       const vec = device.getWorldPosition(device.position.clone());
  //       vec.project(this.camera);
  //       const dom = this.renderer.domElement;
  //       // Restore result
  //       device.userData.screenCoord = {
  //         x: Math.round((.5 + vec.x / 2) * dom.width),
  //         y: Math.round((.5 - vec.y / 2) * dom.height),
  //       };
  //     });
  //   });
  // }
  storeDeviceScreenCoord(device: Mesh) {
    // const worldMatEl = device.matrixWorld.elements;
    // const vec = new Vector3(worldMatEl[12], worldMatEl[13], worldMatEl[14]);
    const vec = device.getWorldPosition(device.position.clone());
    vec.project(this.camera);
    const dom = this.renderer.domElement;
    // Restore result
    device.userData.screenCoord = {
      x: Math.round((.5 + vec.x / 2) * dom.width),
      y: Math.round((.5 - vec.y / 2) * dom.height),
    };
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
      // console.log('mouse move');

      if (isMouseDown) {
        isClick = false;
      }
      this.updateMousePos(e, dom);
    });
    dom.addEventListener('click', (e) => {
      if (isClick) {
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

  private darkenNonBloomed(obj: any) {
    if (obj.userData.isFloor && this.bloomLayer.test(obj.layers) === false) {
      this.materials.set(obj.uuid, obj.material);
      obj.material = this.darkMaterial;
    }
  }

  private restoreMaterial(obj: any) {
    if (this.materials.has(obj.uuid)) {
      obj.material = this.materials.get(obj.uuid);
      this.materials.delete(obj.uuid);
    }
  }

  private initBloomLayer() {
    this.bloomLayer = new Layers();
    this.bloomLayer.set(SCENE.BLOOM_SCENE);
  }

  private initBloomPass() {
    this.bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      1.5, 0.4, 0.85
    );
  }

  private initFinalPass(bloomComposer: EffectComposer) {
    const mat = new ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture }
      },
      vertexShader: vshader,
      fragmentShader: fshader,
      defines: {}
    });
    this.finalPass = new ShaderPass(mat, 'baseTexture');
    this.finalPass.needsSwap = true;
  }

  private initBloomComposer() {
    this.bloomComposer = new EffectComposer(this.renderer);
    const composer = this.bloomComposer;
    // composer.renderToScreen = false;
    composer.addPass(this.renderPass);
    composer.addPass(this.bloomPass);

    this.initFinalPass(composer);
  }

  private initFinalComposer() {
    this.finalComposer = new EffectComposer(this.renderer);
    const composer = this.finalComposer;
    composer.addPass(this.renderPass);
    composer.addPass(this.finalPass);
  }

  private initialize() {
    this.scene = new Scene();

    this.darkMaterial = new MeshBasicMaterial({ color: 0x000000 });
    this.materials = new Map();
    this.initBloomLayer();
    this.initBloomPass();

    this.floorKeys = [];
    this.floors = [];
    this.objCasteredEvt = new EventEmitter();
    this.objLeaveEvt = new EventEmitter();
    this.canvasClicked = new EventEmitter();
  }
}
