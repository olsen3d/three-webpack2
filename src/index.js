/* eslint-disable no-multiple-empty-lines */
/* eslint-disable default-case */
/* eslint-disable no-inner-declarations */
/* eslint-disable max-statements */
import * as THREE from 'three'
import { WEBGL } from './webgl'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import gsap from 'gsap'

const statsFPS = new Stats()
statsFPS.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( statsFPS.dom )

if (WEBGL.isWebGLAvailable()) {
  let camera, scene, renderer
  let cubeMesh, cubeBG1Mesh, cubeBG2Mesh

  function init() {
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      10000
    )
    camera.position.set(0, 250, 1300)
    camera.lookAt(0, 0, 0)

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
    scene.add(cubeMesh)

    const cubeBG1 = new THREE.BoxGeometry(150, 150, 150)
    const cubeBG2 = new THREE.BoxGeometry(150, 150, 150)
    cubeBG1Mesh = new THREE.Mesh(cubeBG1, materialBrick)
    cubeBG1Mesh.position.z = -500
    cubeBG2Mesh = new THREE.Mesh(cubeBG2, materialBrick)
    cubeBG2Mesh.position.z = -1200
    scene.add(cubeBG1Mesh, cubeBG2Mesh)

    var gridHelper = new THREE.GridHelper(1000, 20, 0xff0000)
    scene.add(gridHelper)

    const light = new THREE.AmbientLight( 0xffffff, 10)
    //scene.add(light)

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

  const randomPosition = () => {
    if (cubeMesh.position.x < 100 || cubeMesh.position.y < 100 || cubeMesh.position.z < 100) {
    const randomVals = [Math.random() * (15 - -15) + -15, Math.random() * (15 - -15) + -15, Math.random() * (15 - -15) + -15]
    cubeMesh.position.x += randomVals[0]
    cubeMesh.position.y += randomVals[1]
    cubeMesh.position.z += randomVals[2]
    }
  }
  //window.setInterval(randomPosition, 300)


  // const animateCube = () => {
  //   gsap.to(cubeMesh.position, { duration: 0.75, ease: 'power2.out', x: 600 })
  // }

  // const button = document.getElementById( 'animateButton' )
  // button.addEventListener('click', animateCube)


const mouse = new THREE.Vector2()
function onDocumentMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
document.addEventListener('mousemove', onDocumentMouseMove, false);

// window.setInterval(() => {
//   console.log(mouse.x * 600)
//   console.log(cubeMesh.position.x)
// }, 500)

let hoverHeight = {
  normal: 250,
  hoverAmount: 0,
  mouseAmount: 0,
  hoverMax: 25,
  mouseMax: 100,
  current: function() {
    return this.normal + this.hoverAmount + this.mouseAmount
  }
}

const updateCubePosition = () => {
  const maxHorizontalPosition = 600
  gsap.to(cubeMesh.position, { duration: 5, ease: 'power2.out', x: mouse.x * maxHorizontalPosition })
  gsap.to(hoverHeight, { duration: 5, ease: 'power2.out', mouseAmount: mouse.y * hoverHeight.mouseMax })
}

const takeOff = () => {
  gsap.to(cubeMesh.position, { duration: 2, ease: 'power1.inOut', y: hoverHeight })
}


const hover = () => {
  let isUp = false
let amount = Math.random() * hoverHeight.hoverMax

  const updateCubeVerticalPosition = (isUp, amount) => {
    gsap.to(hoverHeight, { duration: 4, ease: 'back.inOut(4)', hoverAmount: amount })
  }
  window.setInterval(() => {
    isUp = !isUp
    if (isUp) {
      amount = Math.random() * hoverHeight.hoverMax
    } else {
      amount = -amount
    }
    updateCubeVerticalPosition(isUp, amount)
  }, 4000)
}


const updateCamera = () => {
  // var startRotation = new THREE.Euler().copy( camera.rotation );
  // camera.lookAt( cubeMesh.position );
  // var endRotation = new THREE.Euler().copy( camera.rotation );
  // camera.rotation.copy( startRotation );
  const maxRotation = 200
  gsap.to(camera.rotation, { duration: 7, ease: 'power1.out', y: mouse.x * maxRotation * 0.001 * -1 })
}











let startTakeOff = false



  const update = () => {
    if (!startTakeOff) {
      startTakeOff = true
      takeOff()
      hover()
    }

    updateCamera()
    cubeMesh.position.y = hoverHeight.current()
  }

  const fixedUpdate = () => {
    updateCubePosition()
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
