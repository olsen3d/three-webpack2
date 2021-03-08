/* eslint-disable no-multiple-empty-lines */
/* eslint-disable default-case */
/* eslint-disable no-inner-declarations */
/* eslint-disable max-statements */
import * as THREE from 'three'
import { WEBGL } from './webgl'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import gsap from 'gsap'

//testing123

//DEBUG

const statsFPS = new Stats()
statsFPS.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( statsFPS.dom )

const debug1 = document.querySelector('#debug1')
const debug2 = document.querySelector('#debug2')


const mouse = new THREE.Vector2()

let outlinePass
const raycaster = new THREE.Raycaster()

//MAIN

if (WEBGL.isWebGLAvailable()) {

  //VARIABLES

  let camera, scene, renderer, composer
  let ingenuityController, cubeHelperMesh
  let rotor1, rotor2
  let canvasMouse = false

  const canvas = document.querySelector('#THREEContainer')

  canvas.addEventListener('mouseenter', () => {
    canvasMouse = true
  })
  canvas.addEventListener('mouseleave', () => {
    canvasMouse = false
  })


  //PRE-LOAD CONDITIONALS

  let isRendering = true
  let modelReady = false
  let isHovering = false
  let zoomed = false

  //BUTTONS

  const renderButton = document.querySelector('#renderButton')
  renderButton.addEventListener('click', () => {
    if (isRendering) {
      isRendering = false

    } else {
      isRendering = true
      renderLoop()
    }
  })


  //INITIALIZE THREE

  function init() {

    //SCENE
    scene = new THREE.Scene()

    //FOG
    {
      const near = -2000;
      const far = 22000;
      const color = 0xfffdfc;
      //scene.fog = new THREE.Fog(color, near, far);
      //scene.background = new THREE.Color(color);
    }

    //DEBUG MODELS AND HELPERS
    const cubeHelper = new THREE.BoxGeometry(150, 150, 150)
    const materialWire = new THREE.MeshBasicMaterial( {color: 0x00ff00, wireframe: true} )
    cubeHelperMesh = new THREE.Mesh(cubeHelper, materialWire)
    //scene.add(cubeHelperMesh)

    var gridHelper = new THREE.GridHelper(1000, 20, 0xff0000)
    //scene.add(gridHelper)

        //GROUPS AND CONTROLLERS
        ingenuityController = new THREE.Group()
        scene.add(ingenuityController)
        ingenuityController.position.y = 210
        //ingenuityController.add(cubeHelperMesh)
    
        //CAMERA
        camera = new THREE.PerspectiveCamera(
          38,
          700 / 600,
          1,
          50000
        )
        camera.position.set(250, 440, 500)
        camera.lookAt(0, 340, 0)


    //MATERIALS AND TEXTURES

    let hybridMat
    let rt
    const loaderTEXTURE = new THREE.TextureLoader();
    const texture = loaderTEXTURE.load(
      '../static/textures/bg5.jpg',
      () => {
        rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
        rt.fromEquirectangularTexture(renderer, texture);
        hybridMat.envMap = rt
        scene.background = rt;
      });

          // const textureINGENUITY = loaderTEXTURE.load('../static/textures/INGENUITYbake.jpg')
          const textureINGENUITY = loaderTEXTURE.load('../static/textures/INGENUITYbake4k.jpg')

    const lightMat = new THREE.MeshBasicMaterial({map: textureINGENUITY})

    const reflectMat = new THREE.MeshBasicMaterial({color: 0xeeeeee, envMap: texture })

    hybridMat = new THREE.MeshBasicMaterial({
      color: 0xeeeeee,
      map: textureINGENUITY,
      specularMap: textureINGENUITY,
      reflectivity: 1,
      //envMap: texture,
      combine: THREE.AddOperation
    })

    //LOADERS

    const loaderGLTF = new GLTFLoader()
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( 'src/draco/' );
    loaderGLTF.setDRACOLoader( dracoLoader );

    //INGENUITY
    // loaderGLTF.load( '../static/models/ingenuity.glb', function ( gltf ) {
    //   var model = gltf.scene;
    //   model.scale.set(500, 500, 500)
    //   model.position.y = -50
    //   scene.add( model );
    //   ingenuityController.add(model)
    //   model.traverse((o) => {
    //     if (o.isMesh) o.material = reflectMat;
    //     if (o.name === 'rotors_01') rotor1 = o
    //     if (o.name === 'rotors_02') rotor2 = o
    //   })

    //   modelReady = true
    // }, undefined, function ( error ) {
    //   console.error( error );
    // } )

    loaderGLTF.load( '../static/models/ingDraco.gltf', function ( gltf ) {
      var model = gltf.scene;
      model.scale.set(1.25, 1.25, 1.25)
      model.position.y = -50
      scene.add( model );
      ingenuityController.add(model)
      model.traverse((o) => {
        if (o.isMesh) o.material = hybridMat;
        if (o.name === 'rotor1') rotor1 = o
        if (o.name === 'rotor2') rotor2 = o
      })

      modelReady = true
    }, undefined, function ( error ) {
      console.error( error );
    } )

    //TERRAIN
    //export1.glb
    loaderGLTF.load( '../static/models/terrainDraco.gltf', function ( gltf ) {
      var terrain = gltf.scene;
      terrain.scale.set(0.5, 0.5, 0.5)
      terrain.rotation.x = THREE.Math.degToRad(-90)
      terrain.rotation.z = THREE.Math.degToRad(180)
      terrain.position.y = 100
      //model.position.y = -50
      var newMaterial = new THREE.MeshBasicMaterial({color: 0x774422, wireframe: false});
      // var newMaterial = new THREE.MeshNormalMaterial();
      terrain.traverse((o) => {
        if (o.isMesh) o.material = newMaterial;
      });
      scene.add( terrain );
    }, undefined, function ( error ) {
      console.error( error );
    } )


    //RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(700, 600)
    const container = document.getElementById( 'THREEContainer' )
    container.appendChild(renderer.domElement)


    const threeCanvas = renderer.domElement;


    //POST
    composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
    composer.addPass(outlinePass)

    const pass = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
		composer.addPass( pass );

    
    function getCanvasRelativePosition(event) {
      const rect = threeCanvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * threeCanvas.width  / rect.width,
        y: (event.clientY - rect.top ) * threeCanvas.height / rect.height,
      };
    }
    
    function setPickPosition(event) {
      const pos = getCanvasRelativePosition(event);
      mouse.x = (pos.x / threeCanvas.width ) *  2 - 1;
      mouse.y = (pos.y / threeCanvas.height) * -2 + 1;  // note we flip Y

      //checkIntersection()
    }

    function checkIntersection() {
      raycaster.setFromCamera( mouse, camera )

      const intersects = raycaster.intersectObject( scene, true )

      if ( intersects.length > 0 ) {
        const selectedObject = intersects[ 0 ].object;
        outlinePass.selectedObjects = [selectedObject];
      } else {
        outlinePass.selectedObjects = [];
      }
    }
    
    window.addEventListener('pointermove', setPickPosition);
    window.setInterval(checkIntersection, 500)

  }



  let hoverAnim

  const startHover = () => {
    isHovering = true
    hoverAnim = gsap.to(ingenuityController.position, { duration: 4, ease: 'back.inOut(4)', y: 200, repeat: -1, yoyo: true })
  }

  const cameraZoomIn = () => {
    zoomed = true
    gsap.to(camera, { duration: 0.75, ease: 'power1.out', fov: 20, onUpdate: () => camera.updateProjectionMatrix() })
  }

  const cameraZoomOut = () => {
    zoomed = false
    gsap.to(camera, { duration: 0.5, ease: 'power1.out', fov: 38, onUpdate: () => camera.updateProjectionMatrix() })
  }

  const rotors = {multiplier: 1}
  const slowRotors = () => {gsap.to(rotors, { duration: 1.0, ease: 'power4.out', multiplier: 0.01 })}
  const fastRotors = () => {gsap.to(rotors, { duration: 1, ease: 'power4.out', multiplier: 1 })}

  const updateRotors = () => {
    if (rotor1.rotation.y > 360) rotor1.rotation.y = 0
    if (rotor2.rotation.y > 360) rotor2.rotation.y = 0
    rotor1.rotation.y += 0.3 * rotors.multiplier //0.3
    rotor2.rotation.y -= 0.4 * rotors.multiplier //0.4
    //debugArea.innerHTML = rotor1.rotation.x
  }


  //UPDATE
  const update = () => {

    if (modelReady) {
      //outlinePass.selectedObjects = [rotor2]
      if (!isHovering) startHover()
      updateRotors()

      if (canvasMouse) {
        hoverAnim.pause()

        camera.position.x = 250 + mouse.x * 70
        camera.position.y = 440 + mouse.y * 170
        camera.lookAt(0, 340, 0)
        camera.updateProjectionMatrix()

        if (!zoomed) {
          cameraZoomIn()
          slowRotors()
        }
      } else {
        hoverAnim.play()

        if (zoomed) cameraZoomOut()
        fastRotors()
      }
      //updateCamera()
    }

  }

  //FIXED UPDATE
  //const fixedUpdate = () => {}
  //const fixedUpdateFrequency = 33.3 //33.3ms ~30FPS
  //window.setInterval(fixedUpdate, fixedUpdateFrequency)

  //RENDER
  const render = () => composer.render(scene, camera)

  //RENDER LOOP
  const renderLoop = () => {
    if (isRendering) {
      statsFPS.begin()
      update()
      render()
      statsFPS.end()
      requestAnimationFrame( renderLoop )
    }
  }

  init()
  renderLoop()

} else {
  var warning = WEBGL.getWebGLErrorMessage()
  document.body.appendChild(warning)
}
