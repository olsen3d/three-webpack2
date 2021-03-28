/* eslint-disable no-multiple-empty-lines */
/* eslint-disable default-case */
/* eslint-disable no-inner-declarations */
/* eslint-disable max-statements */
import * as THREE from 'three'
import { WEBGL } from './webgl'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'


const mouse = new THREE.Vector2()
const raycaster = new THREE.Raycaster()
const video = document.getElementById('video')

//MAIN

if (WEBGL.isWebGLAvailable()) {

  //VARIABLES

  let camera, scene, renderer
  let ingenuityController
  let rotor1, rotor2, rotor1Base, rotor2Base, dustMesh, dustMesh2
  let canvasMouse = false
  let terrainMat
  const ingenuityMeshes = []

  const canvas = document.querySelector('#THREEContainer')


  //PRE-LOAD CONDITIONALS

  let isRendering = true
  let modelReady = false
  let isHovering = false
  let zoomed = false

  //BUTTONS


  //INITIALIZE THREE

  function init() {

    //SCENE
    scene = new THREE.Scene()

    //FOG
    {
      const near = 2000;
      const far = 40000;
      const color = 0xf8f4f0;
      scene.fog = new THREE.Fog(color, near, far);
      scene.background = new THREE.Color( color )
    }

        //GROUPS AND CONTROLLERS
        ingenuityController = new THREE.Group()
        scene.add(ingenuityController)
        ingenuityController.position.y = 210
  
        //CAMERA
        camera = new THREE.PerspectiveCamera(
          46, //42
          700 / 600,
          1,
          50000
        )
        camera.position.set(250, 340, 500)
        camera.lookAt(0, 340, 0)


    //MATERIALS AND TEXTURES

    let hybridMat, xRayMat
    let rt
    const loaderTEXTURE = new THREE.TextureLoader();
    const texture = loaderTEXTURE.load(
      '../static/textures/bgInspect.jpg',
        () => {
          rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
          rt.fromEquirectangularTexture(renderer, texture);
          hybridMat.envMap = rt
        }
      )

    const textureINGENUITY = loaderTEXTURE.load('../static/textures/INGENUITY_TEXTURE_BAKED_01.jpg')
    const textureROCKS = loaderTEXTURE.load('../static/textures/TERRAIN_TEXTURE_03.jpg')


    hybridMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: textureINGENUITY,
      specularMap: textureINGENUITY,
      reflectivity: 1,
      combine: THREE.AddOperation,
      fog: false
    })

    xRayMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: textureINGENUITY,
      transparent: true,
      opacity: 0.4,
      fog: false
    })

    terrainMat = new THREE.MeshBasicMaterial({
      map: textureROCKS,
      fog: true
    })

    const textureDust = loaderTEXTURE.load('../static/textures/dust.jpg')

    video.play()
    const videoTexture = new THREE.VideoTexture(video);
    const videoMaterial =  new THREE.MeshBasicMaterial(
        {
          map: textureDust,
          alphaMap: videoTexture,
          opacity: 1,
          transparent: true,
          fog: false,
        }
      )

    const testPlane = new THREE.PlaneGeometry(600, 250, 0)
    const testPlane2 = new THREE.PlaneGeometry(1000, 400, 0)
    dustMesh = new THREE.Mesh(testPlane, videoMaterial)
    dustMesh.position.y = 270
    dustMesh.position.x = 225
    dustMesh.position.z = 170
    dustMesh.rotation.y = THREE.Math.degToRad(25)
    scene.add(dustMesh)

    dustMesh2 = new THREE.Mesh(testPlane2, videoMaterial)
    dustMesh2.position.y = 260
    dustMesh2.position.x = -105
    dustMesh2.position.z = -170
    dustMesh2.rotation.y = THREE.Math.degToRad(25)
    scene.add(dustMesh2)


    //LOADERS

    const loaderGLTF = new GLTFLoader()
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( 'src/draco/' );
    loaderGLTF.setDRACOLoader( dracoLoader );

    //INGENUITY

    loaderGLTF.load( '../static/models/ingDraco02.gltf', function ( gltf ) {
      var model = gltf.scene;
      model.scale.set(1.25, 1.25, 1.25)
      model.position.y = -50
      scene.add( model );
      ingenuityController.add(model)
      model.traverse((o) => {
        if (o.isMesh) {
          o.material = hybridMat
          ingenuityMeshes.push(o)
        }
        if (o.name === 'rotor1') rotor1 = o
        if (o.name === 'rotor1Base') rotor1Base = o
        if (o.name === 'rotor2') rotor2 = o
        if (o.name === 'rotor2Base') rotor2Base = o
      })

      modelReady = true
    }, undefined, function ( error ) {
      console.error( error );
    } )


    //TERRAIN
    loaderGLTF.load( '../static/models/terrainDraco2.gltf', function ( gltf ) {
      var terrain = gltf.scene;
      terrain.scale.set(1.5, 1.5, 1.5)
      terrain.position.y = -100
      terrain.position.x = -2500
      terrain.position.z = -300
      terrain.traverse((o) => {
        if (o.isMesh) o.material = terrainMat;
      });
      scene.add( terrain );
    }, undefined, function ( error ) {
      console.error( error );
    } )


    //RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(1)
    renderer.setSize(600, 500)
    const container = document.getElementById( 'THREEWindow' )
    container.appendChild(renderer.domElement)


    const threeCanvas = renderer.domElement;


    function getCanvasRelativePosition(event) {
      const rect = threeCanvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * threeCanvas.width  / rect.width,
        y: (event.clientY - rect.top ) * threeCanvas.height / rect.height,
      };
    }

    const inspectSelectors = ['#solarPanel', '#rotors', '#inspectInitial', '#body', '#legs']
    const inspectCopyElements = inspectSelectors.map(selector => document.querySelector(selector))

    const switchInspectCopyElements = elementId => {
      const activeElement = inspectCopyElements.find(el => el.id === elementId)
      const inactiveElements = inspectCopyElements.filter(el => el.id !== elementId)
      activeElement.classList.add('inspectVisible')
      inactiveElements.forEach(el => el.classList.remove('inspectVisible'))
    }

    const switchInspectObjects = object => {
      if (!object) {
        ingenuityMeshes.forEach(mesh => {mesh.material = hybridMat})
        return
        }

      if (object === 'rotors') {
        const rotorGroup = [rotor1, rotor1Base, rotor2, rotor2Base]
        const otherMeshes = ingenuityMeshes.filter(mesh => !rotorGroup.includes(mesh))
        rotorGroup.forEach(mesh => {mesh.material = hybridMat})
        otherMeshes.forEach(mesh => {mesh.material = xRayMat})
        return
      }

      const otherMeshes = ingenuityMeshes.filter(mesh => mesh.name !== object.name)
      object.material = hybridMat
      otherMeshes.forEach(mesh => {mesh.material = xRayMat})
    }

    // eslint-disable-next-line complexity
    function checkIntersection() {
      raycaster.setFromCamera( mouse, camera )
      const intersects = raycaster.intersectObject( ingenuityController, true )
      if ( intersects.length > 0 ) {
        let selectedObject = intersects[ 0 ].object;
        if (!selectedObject.name) selectedObject = intersects[ 1 ].object
        switch (selectedObject.name) {
          case 'body':
            switchInspectCopyElements('body')
            switchInspectObjects(selectedObject)
            break
          case 'solarPanel':
            switchInspectCopyElements('solarPanel')
            switchInspectObjects(selectedObject)
            break
          case 'legs':
            switchInspectCopyElements('legs')
            switchInspectObjects(selectedObject)
            break
          case 'rotor1':
          case 'rotor1Base':
          case 'rotor2':
          case 'rotor2Base':
            switchInspectCopyElements('rotors')
            switchInspectObjects('rotors')
            break
          default:
            switchInspectCopyElements('inspectInitial')
            switchInspectObjects(null)
        }
      } else {
        switchInspectCopyElements('inspectInitial')
        switchInspectObjects(null)
      }
    }

    function setPickPosition(event) {
      const pos = getCanvasRelativePosition(event);
      mouse.x = (pos.x / threeCanvas.width ) *  2 - 1;
      mouse.y = (pos.y / threeCanvas.height) * -2 + 1;  // note we flip Y

      checkIntersection()
    }


    canvas.addEventListener('mouseenter', () => {
      canvasMouse = true
      window.addEventListener('pointermove', setPickPosition);
    })

    canvas.addEventListener('mouseleave', () => {
      canvasMouse = false
      switchInspectCopyElements('inspectInitial')
      switchInspectObjects(null)
      window.removeEventListener('pointermove', setPickPosition);
    })

  }



  let hoverAnim

  const startHover = () => {
    isHovering = true
    hoverAnim = gsap.to(ingenuityController.position, { duration: 4, ease: 'back.inOut(4)', y: 200, repeat: -1, yoyo: true })
  }

  const alignCamera = () => {
    camera.lookAt(0, 340, 0)
    camera.updateProjectionMatrix()
  }

  const cameraZoomIn = () => {
    zoomed = true
    gsap.to(camera, { duration: 0.75, ease: 'power1.out', fov: 24, onUpdate: () => alignCamera() })
  }

  const cameraZoomOut = () => {
    zoomed = false
    gsap.to(camera, { duration: 0.5, ease: 'power1.out', fov: 46, onUpdate: () => alignCamera() })
    gsap.to(camera.position, { duration: 1.5, ease: 'power1.out', x: 250, onUpdate: () => alignCamera() })
    gsap.to(camera.position, { duration: 1.5, ease: 'power1.out', y: 440, onUpdate: () => alignCamera() })
  }

  const updateCamera = () => {
    gsap.to(camera.position, { duration: 1.5, ease: 'power1.out', x: 250 + mouse.x * 100, onUpdate: () => alignCamera() })
    gsap.to(camera.position, { duration: 1.5, ease: 'power1.out', y: 440 + mouse.y * 220, onUpdate: () => alignCamera() })
  }

  const rotors = {multiplier: 1}
  const slowRotors = () => {gsap.to(rotors, { duration: 1.0, ease: 'power4.out', multiplier: 0.005 })}
  const fastRotors = () => {gsap.to(rotors, { duration: 1, ease: 'power4.out', multiplier: 1 })}

  const updateRotors = () => {
    if (rotor1.rotation.y > 360) rotor1.rotation.y = 0
    if (rotor2.rotation.y > 360) rotor2.rotation.y = 0
    rotor1.rotation.y += 0.3 * rotors.multiplier
    rotor2.rotation.y -= 0.4 * rotors.multiplier
  }

  const slowDust = () => {video.pause()}
  const fastDust = () => {video.play()}

  //UPDATE
  const update = () => {

    if (modelReady) {
      if (!isHovering) startHover()
      updateRotors()
      if (canvasMouse) {
        hoverAnim.pause()
        updateCamera()
        if (!zoomed) {
          cameraZoomIn()
          slowRotors()
          slowDust()
        }
      } else {
        hoverAnim.play()
        if (zoomed) cameraZoomOut()
        fastRotors()
        fastDust()
      }
    }

  }

  //RENDER
  const render = () => renderer.render(scene, camera)

  //RENDER LOOP
  const renderLoop = () => {
    if (isRendering) {
      update()
      render()
      requestAnimationFrame( renderLoop )
    }
  }

  init()
  renderLoop()

} else {
  var warning = WEBGL.getWebGLErrorMessage()
  document.body.appendChild(warning)
}
