/* eslint-disable no-multiple-empty-lines */
/* eslint-disable default-case */
/* eslint-disable no-inner-declarations */
/* eslint-disable max-statements */
import * as THREE from 'three'
import { WEBGL } from './webgl'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'


const statsFPS = new Stats()
statsFPS.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( statsFPS.dom )

if (WEBGL.isWebGLAvailable()) {
  let camera, scene, renderer
  let cubeMesh, cubeBG1Mesh, cubeBG2Mesh, sphereMesh
  let modelReady = false
  let ingenuityController

  function init() {
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      10000
    )
    camera.position.set(0, 250, 1300)
    camera.lookAt(0, 250, 0)

    scene = new THREE.Scene()

    {
      const near = 1000;
      const far = 3000;
      const color = 0xf0f0f0;
      scene.fog = new THREE.Fog(color, near, far);
      scene.background = new THREE.Color(color);
    }



    const cubeGeo = new THREE.BoxGeometry(150, 150, 150)
    const texture = new THREE.TextureLoader().load( '../static/textures/brick.jpg' )
    const materialBrick = new THREE.MeshBasicMaterial( { map: texture } )
    cubeMesh = new THREE.Mesh(cubeGeo, materialBrick)
    cubeMesh.visible = true
    cubeMesh.rotation.y = 0.45
    cubeMesh.position.y = 50
    scene.add(cubeMesh)

    ingenuityController = new THREE.Group()

    const loader = new GLTFLoader()
    loader.load( '../static/models/ingenuity.glb', function ( gltf ) {
      var model = gltf.scene;
      model.scale.set(500, 500, 500)
      model.position.y = -50
      scene.add( model );
      ingenuityController.add(model)
      cubeMesh.attach(model)
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
    //renderer.setSize(720, 480)
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

const maxHorizontalPosition = 600
const updateHoverMousePosition = () => {
  gsap.to(cubeMesh.position, { duration: 5, ease: 'power2.out', x: mouse.x * maxHorizontalPosition })
  gsap.to(hoverHeight, { duration: 5, ease: 'power2.out', mouseAmount: mouse.y * hoverHeight.mouseMax })
}

const updateHoverMouseRotation = () => {
  const distance = (mouse.x * maxHorizontalPosition) - cubeMesh.position.x
  cubeMesh.rotation.z = THREE.Math.degToRad(distance / -40)
}

const takeOff = () => {
  gsap.to(hoverHeight, { duration: 2, ease: 'power1.inOut', normal: hoverHeight.normalMax })
  gsap.to(cubeMesh.rotation, { duration: 4, ease: 'back.inOut(4)', y: 0 })
}


const hover = () => {
  let isUp = false
let amount = (Math.random() * hoverHeight.hoverMax) + hoverHeight.hoverMin

  const updateCubeVerticalPosition = (amount) => {
    gsap.to(hoverHeight, { duration: 4, ease: 'back.inOut(4)', hoverAmount: amount })
  }
  window.setInterval(() => {
    isUp = !isUp
    if (isUp) {
      amount = (Math.random() * hoverHeight.hoverMax) + hoverHeight.hoverMin
    } else {
      amount = -amount
    }
    updateCubeVerticalPosition(amount)
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
      cubeMesh.position.y = hoverHeight.currentX()
      updateHoverMouseRotation()
      updateHoverMousePosition()
    }
  }

  const fixedUpdate = () => {
    
  }

  const fixedUpdateFrequency = 33.3 //33.3ms ~30FPS
  window.setInterval(fixedUpdate, fixedUpdateFrequency)

  const render = () => renderer.render(scene, camera)

  const animate = () => {
    statsFPS.begin()
    update()
    render()
    statsFPS.end()
    requestAnimationFrame( animate )
  }

  init()
  animate()

} else {
  var warning = WEBGL.getWebGLErrorMessage()
  document.body.appendChild(warning)
}
