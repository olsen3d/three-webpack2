/* eslint-disable default-case */
/* eslint-disable no-inner-declarations */
/* eslint-disable max-statements */
import * as THREE from 'three'
import { WEBGL } from './webgl'
import Stats from 'three/examples/jsm/libs/stats.module.js'

const statsFPS = new Stats()
statsFPS.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( statsFPS.dom )

if (WEBGL.isWebGLAvailable()) {
  let camera, scene, renderer
  let cubeMesh

  function init() {
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      10000
    )
    camera.position.set(500, 800, 1300)
    camera.lookAt(0, 0, 0)

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)


    const cubeGeo = new THREE.BoxGeometry(150, 150, 150)
    const texture = new THREE.TextureLoader().load( '../static/textures/brick.jpg' )
    const materialBrick = new THREE.MeshBasicMaterial( { map: texture } )
    cubeMesh = new THREE.Mesh(cubeGeo, materialBrick)
    scene.add(cubeMesh)

    var gridHelper = new THREE.GridHelper(1000, 20, 0xff0000)
    scene.add(gridHelper)

    const light = new THREE.AmbientLight( 0xffffff, 10)
    scene.add(light)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    // renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setSize(720, 480)
    document.body.appendChild(renderer.domElement)

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
    const randomVals = [Math.random() * (5 - -5) + -5, Math.random() * (5 - -5) + -5, Math.random() * (5 - -5) + -5]
    cubeMesh.position.x += randomVals[0]
    cubeMesh.position.y += randomVals[1]
    cubeMesh.position.z += randomVals[2]
    }
  }
  window.setInterval(randomPosition, 100)

  const update = () => {
  }

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
