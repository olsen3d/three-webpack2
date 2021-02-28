/* eslint-disable no-multiple-empty-lines */
/* eslint-disable default-case */
/* eslint-disable no-inner-declarations */
/* eslint-disable max-statements */
import * as THREE from 'three'
import { WEBGL } from './webgl'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'

//testing123

//DEBUG

const statsFPS = new Stats()
statsFPS.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( statsFPS.dom )

const debug1 = document.querySelector('#debug1')
const debug2 = document.querySelector('#debug2')



//MAIN

if (WEBGL.isWebGLAvailable()) {

  //VARIABLES

  let camera, scene, renderer
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
      const near = -8000;
      const far = 20000;
      const color = 0xd4bfaf;
      scene.fog = new THREE.Fog(color, near, far);
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
        ingenuityController.position.y = 50
        //ingenuityController.add(cubeHelperMesh)
    
        //CAMERA
        camera = new THREE.PerspectiveCamera(
          35,
          700 / 600,
          1,
          50000
        )
        camera.position.set(250, 340, 500)
        camera.lookAt(0, 300, 0)


    //MATERIALS AND TEXTURES

    const loaderTEXTURE = new THREE.TextureLoader();
    const texture = loaderTEXTURE.load(
      '../static/textures/bg5.jpg',
      () => {
        const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
        rt.fromEquirectangularTexture(renderer, texture);
        scene.background = rt;
      });

    const reflectMat = new THREE.MeshBasicMaterial({color: 0xeeeeee, envMap: texture })

    //LOADERS

    const loaderGLTF = new GLTFLoader()
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( 'src/draco/' );
    loaderGLTF.setDRACOLoader( dracoLoader );

    //INGENUITY
    loaderGLTF.load( '../static/models/ingenuity.glb', function ( gltf ) {
      var model = gltf.scene;
      model.scale.set(500, 500, 500)
      model.position.y = -50
      scene.add( model );
      ingenuityController.add(model)
      model.traverse((o) => {
        if (o.isMesh) o.material = reflectMat;
        if (o.name === 'rotors_01') rotor1 = o
        if (o.name === 'rotors_02') rotor2 = o
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


  }

  const mouse = new THREE.Vector2()
  function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  document.addEventListener('mousemove', onDocumentMouseMove, false);


  let hoverHeight = {
    normal: 200,
    normalMax: 300,
    hoverAmount: 0,
    mouseAmount: 0,
    hoverMin: 2,
    hoverMax: 8,
    mouseMax: 150,
    currentX: function() {
      return this.normal + this.hoverAmount + this.mouseAmount
    }
  }

  const hover = () => {
    isHovering = true
    let isUp = false
    let amount = (Math.random() * hoverHeight.hoverMax) + hoverHeight.hoverMin

    const updateHoverVerticalPosition = (amount) => {
      gsap.to(hoverHeight, { duration: 4, ease: 'back.inOut(4)', hoverAmount: amount })
    }

  window.setInterval(() => {
    isUp = !isUp
    if (isUp) {
      amount = (Math.random() * hoverHeight.hoverMax) + hoverHeight.hoverMin
    } else {
      amount = -amount
    }
    updateHoverVerticalPosition(amount)
  }, 4000)
}



  const updateCamera = () => {
    const maxRotation = 350
    gsap.to(camera.rotation, { duration: 7, ease: 'power1.out', y: mouse.x * maxRotation * 0.001 * -1 })
  }

  const cameraZoomIn = () => {
    console.log('zoom')
    camera.fov = 28
  }



  const updateRotorsFast = () => {
    if (rotor1.rotation.x > 360) rotor1.rotation.x = 0
    if (rotor2.rotation.x > 360) rotor2.rotation.x = 0
    rotor1.rotation.x += 0.3
    rotor2.rotation.x -= 0.4
    //debugArea.innerHTML = rotor1.rotation.x
  }
  const updateRotorsSlow = () => {
    if (rotor1.rotation.x > 360) rotor1.rotation.x = 0
    if (rotor2.rotation.x > 360) rotor2.rotation.x = 0
    rotor1.rotation.x += 0.002
    rotor2.rotation.x -= 0.003
    //debugArea.innerHTML = rotor1.rotation.x
  }







  //POST-LOAD CONDITIONALS

  let startTakeOff = false

  //UPDATE
  const update = () => {

    if (modelReady) {
      if (!isHovering) hover()
      ingenuityController.position.y = hoverHeight.currentX()
      if (canvasMouse) {
        updateRotorsSlow()
        cameraZoomIn()
      } else {
        updateRotorsFast()
      }
      //updateCamera()
    }

  }

  //FIXED UPDATE
  //const fixedUpdate = () => {}
  //const fixedUpdateFrequency = 33.3 //33.3ms ~30FPS
  //window.setInterval(fixedUpdate, fixedUpdateFrequency)

  //RENDER
  const render = () => renderer.render(scene, camera)

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
