/* eslint-disable no-multiple-empty-lines */
/* eslint-disable default-case */
/* eslint-disable no-inner-declarations */
/* eslint-disable max-statements */
import * as THREE from 'three'
import { WEBGL } from './webgl'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'

//https://threejs.org/examples/#webgl_geometry_terrain_fog


const statsFPS = new Stats()
statsFPS.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( statsFPS.dom )

if (WEBGL.isWebGLAvailable()) {
  let camera, scene, renderer
  let modelReady = false
  let ingenuityController, cubeHelperMesh

  let rotor1, rotor2

  function init() {
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      10000
    )
    camera.position.set(0, 350, 1000)
    camera.lookAt(0, 350, 0)

    scene = new THREE.Scene()

    {
      const near = 1000;
      const far = 3000;
      const color = 0xf0f0f0;
      scene.fog = new THREE.Fog(color, near, far);
      scene.background = new THREE.Color(color);
    }

    const cubeHelper = new THREE.BoxGeometry(150, 150, 150)
    const materialWire = new THREE.MeshBasicMaterial( {color: 0x00ff00, wireframe: true} )
    cubeHelperMesh = new THREE.Mesh(cubeHelper, materialWire)
    scene.add(cubeHelperMesh)




    ingenuityController = new THREE.Group()
    scene.add(ingenuityController)
    ingenuityController.rotation.y = 0.45
    ingenuityController.position.y = 50
    ingenuityController.add(cubeHelperMesh)


    const loader = new GLTFLoader()
    loader.load( '../static/models/ingenuity.glb', function ( gltf ) {
      var model = gltf.scene;
      model.scale.set(500, 500, 500)
      model.position.y = -50
      scene.add( model );
      ingenuityController.add(model)
      model.traverse((o) => {
        if (o.name === 'rotors_01') rotor1 = o
        if (o.name === 'rotors_02') rotor2 = o
      })

      modelReady = true
    }, undefined, function ( error ) {
      console.error( error );
    } )

    const ambientLight = new THREE.AmbientLight( 0xffffff, 10)
    scene.add(ambientLight)

    var gridHelper = new THREE.GridHelper(1000, 20, 0xff0000)
    scene.add(gridHelper)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    const container = document.getElementById( 'THREEContainer' )
    container.appendChild(renderer.domElement)

    window.addEventListener('resize', onWindowResize, false)

  }

  function onWindowResize() {
    // camera.aspect = window.innerWidth / window.innerHeight
    camera.aspect = 720 / 480
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
  }




const mouse = new THREE.Vector2()
function onDocumentMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
document.addEventListener('mousemove', onDocumentMouseMove, false);

let hoverHeight = {
  normal: 100,
  normalMax: 300,
  hoverAmount: 0,
  mouseAmount: 0,
  hoverMin: 10,
  hoverMax: 25,
  mouseMax: 150,
  currentX: function() {
    return this.normal + this.hoverAmount + this.mouseAmount
  }
}

const maxHorizontalPosition = 1000
const updateHoverMousePosition = () => {
  gsap.to(ingenuityController.position, { duration: 5, ease: 'power2.out', x: mouse.x * maxHorizontalPosition })
  gsap.to(hoverHeight, { duration: 5, ease: 'power2.out', mouseAmount: mouse.y * hoverHeight.mouseMax })
}

const updateHoverMouseRotation = () => {
  const distance = (mouse.x * maxHorizontalPosition) - ingenuityController.position.x
  ingenuityController.rotation.z = THREE.Math.degToRad(distance / -40)
}

const takeOff = () => {
  gsap.to(hoverHeight, { duration: 2, ease: 'power1.inOut', normal: hoverHeight.normalMax })
  gsap.to(ingenuityController.rotation, { duration: 4, ease: 'back.inOut(4)', y: 0 })
}


const hover = () => {
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
  const maxRotation = 200
  gsap.to(camera.rotation, { duration: 7, ease: 'power1.out', y: mouse.x * maxRotation * 0.001 * -1 })
}











  let startTakeOff = false

  const update = () => {
    if (modelReady && !startTakeOff) {
      setTimeout(() => {
        startTakeOff = true
      }, 1000)
      takeOff()
      hover()
    }

    if (modelReady) {
      updateCamera()
      ingenuityController.position.y = hoverHeight.currentX()
      updateHoverMouseRotation()
      updateHoverMousePosition()
      rotor1.rotation.x += 0.3
      rotor2.rotation.x -= 0.4
    }
  }

  const fixedUpdate = () => {}

  const fixedUpdateFrequency = 33.3 //33.3ms ~30FPS
  window.setInterval(fixedUpdate, fixedUpdateFrequency)

  const render = () => renderer.render(scene, camera)

  const renderLoop = () => {
    statsFPS.begin()
    update()
    render()
    statsFPS.end()
    requestAnimationFrame( renderLoop )
  }

  init()
  renderLoop()

} else {
  var warning = WEBGL.getWebGLErrorMessage()
  document.body.appendChild(warning)
}
