/* globals BABYLON */
import Dude from './Dude.js';

let canvas;
let engine;
let scene;
let tank = {};
// vars for handling inputs
const inputStates = {};

window.onload = startGame;

function startGame () {
  canvas = document.querySelector('#myCanvas');
  engine = new BABYLON.Engine(canvas, true);
  scene = createScene();

  // modify some default settings (i.e pointer events to prevent cursor to go
  // out of the game window)
  modifySettings();

  engine.runRenderLoop(() => {
    tank.move();

    const heroDude = scene.getMeshByName('heroDude');
    if (heroDude) {
      heroDude.Dude.move(scene);
    }

    if (scene.dudes) {
      for (let i = 0; i < scene.dudes.length; i++) {
        scene.dudes[i].Dude.move(scene);
      }
    }

    scene.render();
  });
}

function createScene () {
  const scene = new BABYLON.Scene(engine);
  const ground = createGround(scene); // eslint-disable-line no-unused-vars
  const freeCamera = createFreeCamera(scene); // eslint-disable-line no-unused-vars

  const tank = createTank(scene);

  // second parameter is the target to follow
  const followCamera = createFollowCamera(scene, tank.body);
  scene.activeCamera = followCamera;

  createLights(scene);

  createHeroDude(scene);

  return scene;
}

function createGround (scene) {
  const groundOptions = { width: 2000, height: 2000, subdivisions: 20, minHeight: 0, maxHeight: 100, onReady: onGroundCreated };
  // scene is optional and defaults to the current scene
  const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap('gdhm', 'images/hmap1.png', groundOptions, scene);

  function onGroundCreated () {
    const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture('images/grass.jpg');
    ground.material = groundMaterial;
    // to be taken into account by collision detection
    ground.checkCollisions = true;
    // groundMaterial.wireframe=true;
  }
  return ground;
}

function createLights (scene) {
  // i.e sun light with all light rays parallels, the vector is the direction.
  new BABYLON.DirectionalLight('dir0', new BABYLON.Vector3(-1, -1, 0), scene); // eslint-disable-line no-new
}

function createFreeCamera (scene) {
  const camera = new BABYLON.FreeCamera('freeCamera', new BABYLON.Vector3(0, 50, 0), scene);
  camera.attachControl(canvas);
  // prevent camera to cross ground
  camera.checkCollisions = true;
  // avoid flying with the camera
  camera.applyGravity = true;

  // Add extra keys for camera movements
  // Need the ascii code of the extra key(s). We use a string method here to get the ascii code
  camera.keysUp.push('z'.charCodeAt(0));
  camera.keysDown.push('s'.charCodeAt(0));
  camera.keysLeft.push('q'.charCodeAt(0));
  camera.keysRight.push('d'.charCodeAt(0));
  camera.keysUp.push('Z'.charCodeAt(0));
  camera.keysDown.push('S'.charCodeAt(0));
  camera.keysLeft.push('Q'.charCodeAt(0));
  camera.keysRight.push('D'.charCodeAt(0));

  return camera;
}

function createFollowCamera (scene, target) {
  const camera = new BABYLON.FollowCamera('tankFollowCamera', target.position, scene, target);

  camera.radius = 100; // how far from the object to follow
  camera.heightOffset = 30; // how high above the object to place the camera
  camera.rotationOffset = 180; // the viewing angle
  camera.cameraAcceleration = 0.1; // how fast to move
  camera.maxCameraSpeed = 5; // speed limit

  return camera;
}

function createTank (scene) {
  tank = {
    body: new BABYLON.MeshBuilder.CreateBox('heroTank', { height: 10, depth: 70, width: 30 }, scene),
    turret: new BABYLON.MeshBuilder.CreateBox('heroTankTurret', { height: 5, depth: 30, width: 20 }, scene),
    gun: new BABYLON.MeshBuilder.CreateBox('heroTankGun', { height: 2, depth: 40, width: 2 }, scene)
  };

  const tankMaterial = new BABYLON.StandardMaterial('tankMaterial', scene);
  tankMaterial.diffuseColor = new BABYLON.Color3(0, 0.6, 0);
  tankMaterial.emissiveColor = new BABYLON.Color3(0, 0.2, 0);
  tank.body.material = tankMaterial;

  const tankTurretMaterial = new BABYLON.StandardMaterial('tankTurretMaterial', scene);
  tankTurretMaterial.diffuseColor = new BABYLON.Color3(0, 0.6, 0);
  tankTurretMaterial.emissiveColor = new BABYLON.Color3(0, 0.3, 0);
  tank.turret.material = tankTurretMaterial;

  const tankGunMaterial = new BABYLON.StandardMaterial('tankGunMaterial', scene);
  tankGunMaterial.diffuseColor = new BABYLON.Color3(0, 0.6, 0);
  tankGunMaterial.emissiveColor = new BABYLON.Color3(0, 0.4, 0);
  tank.gun.material = tankGunMaterial;

  // By default the box/tank is in 0, 0, 0, let's change that...
  tank.body.position.y = 5.1;
  tank.turret.position.y = 12.5;
  tank.gun.position.y = 12.5;
  tank.gun.position.z = 35;
  tank.gun.rotation.y = Math.PI;

  tank.speed = 1;
  tank.frontVector = new BABYLON.Vector3(0, 0, 1);

  tank.turret.move = () => {
    tank.turret.position.x = tank.body.position.x;
    tank.turret.position.y = tank.body.position.y + 7.5;
    tank.turret.position.z = tank.body.position.z;
  };

  tank.gun.move = () => {
    tank.gun.position.x = tank.turret.position.x - Math.sin(tank.gun.rotation.y) * 30;
    tank.gun.position.y = tank.turret.position.y + Math.sin(tank.gun.rotation.x) * 20;
    tank.gun.position.z = tank.turret.position.z - Math.cos(tank.gun.rotation.y) * 30;
  };

  tank.move = () => {
    // tank.position.z += -1; // speed should be in unit/s, and depends on
    // deltaTime !

    // if we want to move while taking into account collision detections
    // collision uses by default "ellipsoids"

    // tank.moveWithCollisions(new BABYLON.Vector3(0, yMovement, zMovement));

    if (inputStates.up) {
      // tank.moveWithCollisions(new BABYLON.Vector3(0, 0, 1*tank.speed));
      tank.body.moveWithCollisions(tank.frontVector.multiplyByFloats(tank.speed, tank.speed, tank.speed));
    }
    if (inputStates.down) {
      // tank.moveWithCollisions(new BABYLON.Vector3(0, 0, -1*tank.speed));
      tank.body.moveWithCollisions(tank.frontVector.multiplyByFloats(-tank.speed, -tank.speed, -tank.speed));
      // tank.turret.position.
      // tank.turret.moveWithCollisions(tank.frontVector.multiplyByFloats(-tank.speed, -tank.speed, -tank.speed));
      // tank.gun.moveWithCollisions(tank.frontVector.multiplyByFloats(-tank.speed, -tank.speed, -tank.speed));
    }
    if (inputStates.left) {
      // tank.moveWithCollisions(new BABYLON.Vector3(-1*tank.speed, 0, 0));
      tank.body.rotation.y -= 0.02;
      tank.turret.rotation.y -= 0.02;
      tank.gun.rotation.y -= 0.02;

      tank.frontVector = new BABYLON.Vector3(Math.sin(tank.body.rotation.y), 0, Math.cos(tank.body.rotation.y));
    }
    if (inputStates.right) {
      // tank.moveWithCollisions(new BABYLON.Vector3(1*tank.speed, 0, 0));
      tank.body.rotation.y += 0.02;
      tank.turret.rotation.y += 0.02;
      tank.gun.rotation.y += 0.02;

      tank.frontVector = new BABYLON.Vector3(Math.sin(tank.body.rotation.y), 0, Math.cos(tank.body.rotation.y));
    }
    if (inputStates.leftTurret) {
      // tank.moveWithCollisions(new BABYLON.Vector3(-1*tank.speed, 0, 0));
      tank.turret.rotation.y -= 0.02;
      tank.gun.rotation.y -= 0.02;

      // tank.frontVector = new BABYLON.Vector3(Math.sin(tank.body.rotation.y), 0, Math.cos(tank.body.rotation.y));
    }
    if (inputStates.rightTurret) {
      // tank.moveWithCollisions(new BABYLON.Vector3(1*tank.speed, 0, 0));
      tank.turret.rotation.y += 0.02;
      tank.gun.rotation.y += 0.02;

      // tank.frontVector = new BABYLON.Vector3(Math.sin(tank.body.rotation.y), 0, Math.cos(tank.body.rotation.y));
    }
    if (inputStates.upTurret) {
      // tank.moveWithCollisions(new BABYLON.Vector3(-1*tank.speed, 0, 0));
      // tank.turret.rotation.y -= 0.02;
      tank.gun.rotation.x = Math.min(tank.gun.rotation.x + 0.005, 0.2);

      // tank.frontVector = new BABYLON.Vector3(Math.sin(tank.body.rotation.y), 0, Math.cos(tank.body.rotation.y));
    }
    if (inputStates.downTurret) {
      // tank.moveWithCollisions(new BABYLON.Vector3(1*tank.speed, 0, 0));
      // tank.turret.rotation.y += 0.02;
      tank.gun.rotation.x = Math.max(tank.gun.rotation.x - 0.005, -0.2);

      // tank.frontVector = new BABYLON.Vector3(Math.sin(tank.body.rotation.y), 0, Math.cos(tank.body.rotation.y));
    }

    tank.turret.move();
    tank.gun.move();
  };

  return tank;
}

function createHeroDude (scene) {
  // load the Dude 3D animated model
  // name, folder, skeleton name
  BABYLON.SceneLoader.ImportMesh('him', 'models/Dude/', 'Dude.babylon', scene, (newMeshes, particleSystems, skeletons) => {
    const heroDude = newMeshes[0];
    heroDude.position = new BABYLON.Vector3(0, 0, 5); // The original dude
    // make it smaller
    heroDude.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
    // heroDude.speed = 0.1;

    // give it a name so that we can query the scene to get it by name
    heroDude.name = 'heroDude';

    // there might be more than one skeleton in an imported animated model. Try console.log(skeletons.length)
    // here we've got only 1.
    // animation parameters are skeleton, starting frame, ending frame,  a boolean that indicate if we're gonna
    // loop the animation, speed,
    const a = scene.beginAnimation(skeletons[0], 0, 120, true, 1); // eslint-disable-line no-unused-vars

    const hero = new Dude(heroDude, 0.1, scene); // eslint-disable-line no-unused-vars

    // make clones
    scene.dudes = [];
    for (let i = 0; i < 10; i++) {
      scene.dudes[i] = doClone(heroDude, skeletons, i);
      scene.beginAnimation(scene.dudes[i].skeleton, 0, 120, true, 1);

      // Create instance with move method etc.
      const temp = new Dude(scene.dudes[i], 0.3); // eslint-disable-line no-unused-vars
      // remember that the instances are attached to the meshes
      // and the meshes have a property "Dude" that IS the instance
      // see render loop then....
    }
  });
}

function doClone (originalMesh, skeletons, id) {
  const xrand = Math.floor(Math.random() * 500 - 250);
  const zrand = Math.floor(Math.random() * 500 - 250);

  const myClone = originalMesh.clone('clone_' + id);
  myClone.position = new BABYLON.Vector3(xrand, 0, zrand);

  if (!skeletons) return myClone;

  // The mesh has at least one skeleton
  if (!originalMesh.getChildren()) {
    myClone.skeleton = skeletons[0].clone('clone_' + id + '_skeleton');
    return myClone;
  } else {
    if (skeletons.length === 1) {
      // the skeleton controls/animates all children, like in the Dude model
      const clonedSkeleton = skeletons[0].clone('clone_' + id + '_skeleton');
      myClone.skeleton = clonedSkeleton;
      const nbChildren = myClone.getChildren().length;

      for (let i = 0; i < nbChildren; i++) {
        myClone.getChildren()[i].skeleton = clonedSkeleton;
      }
      return myClone;
    } else if (skeletons.length === originalMesh.getChildren().length) {
      // each child has its own skeleton
      for (let i = 0; i < myClone.getChildren().length; i++) {
        myClone.getChildren()[i].skeleton = skeletons[i].clone('clone_' + id + '_skeleton_' + i);
      }
      return myClone;
    }
  }

  return myClone;
}

window.addEventListener('resize', () => {
  engine.resize();
});

function modifySettings () {
  // as soon as we click on the game window, the mouse pointer is "locked"
  // you will have to press ESC to unlock it
  scene.onPointerDown = () => {
    if (!scene.alreadyLocked) {
      console.log('requesting pointer lock');
      canvas.requestPointerLock();
    } else {
      console.log('Pointer already locked');
    }
  };

  document.addEventListener('pointerlockchange', () => {
    const element = document.pointerLockElement || null;
    if (element) {
      // lets create a custom attribute
      scene.alreadyLocked = true;
    } else {
      scene.alreadyLocked = false;
    }
  });

  // key listeners for the tank
  inputStates.left = false;
  inputStates.right = false;
  inputStates.up = false;
  inputStates.down = false;
  inputStates.space = false;

  // add the listener to the main, window object, and update the states
  window.addEventListener('keydown', (event) => {
    if ((event.key === 'q') || (event.key === 'Q')) { // (event.key === 'ArrowLeft')
      inputStates.left = true;
    } else if ((event.key === 'z') || (event.key === 'Z')) { // (event.key === 'ArrowUp')
      inputStates.up = true;
    } else if ((event.key === 'd') || (event.key === 'D')) { // (event.key === 'ArrowRight')
      inputStates.right = true;
    } else if ((event.key === 's') || (event.key === 'S')) { // (event.key === 'ArrowDown')
      inputStates.down = true;
    } else if (event.key === ' ') {
      inputStates.space = true;
    } else if (event.key === 'ArrowRight') {
      inputStates.rightTurret = true;
    } else if (event.key === 'ArrowLeft') {
      inputStates.leftTurret = true;
    } else if (event.key === 'ArrowUp') {
      inputStates.upTurret = true;
    } else if (event.key === 'ArrowDown') {
      inputStates.downTurret = true;
    }
  }, false);

  // if the key will be released, change the states object
  window.addEventListener('keyup', (event) => {
    if ((event.key === 'q') || (event.key === 'Q')) {
      inputStates.left = false;
    } else if ((event.key === 'z') || (event.key === 'Z')) {
      inputStates.up = false;
    } else if ((event.key === 'd') || (event.key === 'D')) {
      inputStates.right = false;
    } else if ((event.key === 's') || (event.key === 'S')) {
      inputStates.down = false;
    } else if (event.key === ' ') {
      inputStates.space = false;
    } else if (event.key === 'ArrowRight') {
      inputStates.rightTurret = false;
    } else if (event.key === 'ArrowLeft') {
      inputStates.leftTurret = false;
    } else if (event.key === 'ArrowUp') {
      inputStates.upTurret = false;
    } else if (event.key === 'ArrowDown') {
      inputStates.downTurret = false;
    }
  }, false);
}
