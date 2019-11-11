import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebGLRenderer, PerspectiveCamera, ReinhardToneMapping, Scene, PointLight, Vector2, Mesh, MeshBasicMaterial, DoubleSide, Layers, ShaderMaterial } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ColladaLoader, Collada } from 'three/examples/jsm/loaders/ColladaLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { Interaction } from 'three.interaction';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

enum SCENET {
  ENTIRE_SCENE,
  BLOOM_SCENE
}

@Component({
  selector: 'app-bloom-test',
  templateUrl: './bloom-test.component.html',
  styleUrls: ['./bloom-test.component.sass']
})
export class BloomTestComponent implements OnInit, AfterViewInit {

  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  interaction: Interaction;
  colladaLoader: ColladaLoader;
  bloomComposer: EffectComposer;
  finalComposer: EffectComposer;
  renderPass: RenderPass;
  bloomPass: UnrealBloomPass;
  finalPass: ShaderPass;
  bloomLayer: Layers;

  darkMat: MeshBasicMaterial;
  materials: Map<string, any>;

  meshes: Mesh[];

  style: any;
  params: any;

  vshader: string;
  fshader: string;

  @ViewChild('canvas', { static: true }) gl: ElementRef;
  constructor(
    private httpClient: HttpClient
  ) { }

  ngOnInit() {
    this.style = {
      position: 'fixed',
      top: 0,
      left: 0
    };
    this.params = {
      exposure: 1,
      bloomStrength: 1.5,
      bloomThreshold: 0,
      bloomRadius: 0
    };
    this.vshader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `.trim();
    this.fshader = `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;
    vec4 getTexture(sampler2D texelToLinearTexture) {
        return mapTexelToLinear(texture2D(texelToLinearTexture, vUv));
    }
    void main() {
        gl_FragColor = getTexture(baseTexture) + vec4(1.0) * getTexture(bloomTexture);
    }
    `.trim();

    this.meshes = [];
  }

  ngAfterViewInit() {
    const dom = this.gl.nativeElement;
    dom.width = window.innerWidth;
    dom.height = window.innerHeight;

    this.bloomLayer = new Layers();
    this.bloomLayer.set(SCENET.BLOOM_SCENE);

    this.darkMat = new MeshBasicMaterial({color: 0x00000000});
    this.darkMat.transparent = true;
    this.materials = new Map();

    this.renderer = new WebGLRenderer({ antialias: true, canvas: this.gl.nativeElement });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = ReinhardToneMapping;

    this.scene = new Scene();

    this.camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 100);
    this.camera.position.set(-5, 2.5, -3.5);
    this.scene.add(this.camera);

    this.interaction = new Interaction(this.renderer, this.scene, this.camera);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.maxPolarAngle = Math.PI * 0.5;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 100;

    const pointLight = new PointLight(0xffffff, 1);
    this.camera.add(pointLight);

    this.renderPass = new RenderPass(this.scene, this.camera);

    this.bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    this.bloomPass.threshold = this.params.bloomThreshold;
    this.bloomPass.strength = this.params.bloomStrength;
    this.bloomPass.radius = this.params.bloomRadius;
    // this.bloomPass.renderToScreen = false;

    this.bloomComposer = new EffectComposer(this.renderer);
    this.bloomComposer.addPass(this.renderPass);
    this.bloomComposer.addPass(this.bloomPass);
    (this.bloomComposer as any).renderToScreen = false;

    const shaderMat = new ShaderMaterial({
      uniforms: {
        baseTexture: { value: null},
        bloomTexture:{value:this.bloomComposer.renderTarget2.texture}
      },
      vertexShader: this.vshader,
      fragmentShader: this.fshader,
      defines: {}
    });
    this.finalPass = new ShaderPass(shaderMat, 'baseTexture');
    this.finalPass.needsSwap = true;

    this.finalComposer = new EffectComposer(this.renderer);
    this.finalComposer.addPass(this.renderPass);
    this.finalComposer.addPass(this.finalPass);

    const gui = new GUI();
    gui.add(this.params, 'exposure', 0.1, 2).onChange(value => {
      this.renderer.toneMappingExposure = Math.pow(value, 4.0);
    });
    gui.add(this.params, 'bloomThreshold', 0.0, 1.0).onChange(value => {
      this.bloomPass.threshold = Number(value);
    });
    gui.add(this.params, 'bloomStrength', 0.0, 3.0).onChange(value => {
      this.bloomPass.strength = Number(value);
    });
    gui.add(this.params, 'bloomRadius', 0.0, 1.0).step(0.01).onChange(value => {
      this.bloomPass.radius = Number(value);
    });

    new ColladaLoader().load('/api/model/building2-1.dae', this.onModelLoaded.bind(this));

    window.onresize = this.onWindowResize.bind(this);
  }

  onModelLoaded(model: Collada) {
    const scene = model.scene;
    scene.traverse((obj: any) => {
      if(!obj.isMesh) {
        return;
      }
      const fMat = obj.material as MeshBasicMaterial;
      fMat.color.setHex(0xa5cacbc);
      fMat.transparent = true;
      fMat.side = DoubleSide;
      obj.material = fMat.clone();
      this.meshes.push(obj);

      // obj.on('mouseover', e => {
      //   // obj.material.color.setHex(0xffffff);
      //   obj.layers.enable(SCENET.BLOOM_SCENE);
      // });
      // obj.on('mouseout', e => {
      //   // obj.material.color.setHex(0xa5cacbc);
      //   obj.layers.disable(SCENET.BLOOM_SCENE);
      // });
      obj.on('click', e => {
        obj.layers.toggle(SCENET.BLOOM_SCENE);
      })
    });
    this.scene.add(scene);
    this.animate();
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.bloomComposer.setSize(width, height);
  }

  renderBloom() {
    this.meshes.forEach(mesh => {
      if(this.bloomLayer.test(mesh.layers) === false) {
        this.materials.set(mesh.uuid, mesh.material);
        mesh.material = this.darkMat;
      }
    });
    this.bloomComposer.render();
    this.meshes.forEach(mesh => {
      if(this.materials.has(mesh.uuid)) {
        mesh.material = this.materials.get(mesh.uuid);
        this.materials.delete(mesh.uuid);
      }
    });
  }

  animate() {
    this.renderBloom();
    this.finalComposer.render();
    // this.bloomComposer.render();

    requestAnimationFrame(this.animate.bind(this));
  }


}
