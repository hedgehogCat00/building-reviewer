import { Injectable } from '@angular/core';
import { WebGLRenderer } from 'three';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

@Injectable()
export class DevicePanelService {
  constructor() {
    this.initialize();
  }

  genGUI(renderer: WebGLRenderer, bloomPass: UnrealBloomPass) {
    const params = {
      exposure: 1,
      bloomStrength: 5,
      bloomThreshold: 0,
      bloomRadius: 0,
      scene: "Scene with Glow"
    };
    // provide some initialize data
    renderer.toneMappingExposure = Math.pow(params.exposure, 4);
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    const gui = new GUI();
    const folder = gui.addFolder('光晕参数');
    folder.add(params, 'exposure', 0.1, 2).onChange(val => {
      renderer.toneMappingExposure = Math.pow(val, 4);
    });
    folder.add(params, 'bloomThreshold', 0.0, 1.0).step(0.01).onChange(val => {
      bloomPass.threshold = Number(val);
    });
    folder.add(params, 'bloomStrength', 0.0, 10.0).onChange(val => {
      bloomPass.strength = Number(val);
    });
    folder.add(params, 'bloomRadius', 0.0, 1.0).step(0.01).onChange(val => {
      bloomPass.radius = Number(val);
    });
  }

  private initialize() {
  }

}
