/// <reference path="babylon.max.js" />
/// <reference path="cannon.js" />

var canvas;
var engine;
var scene;
var isWPressed = false;
var isSPressed = false;
var isAPressed = false;
var isDPressed = false;
var isBPressed = false;
document.addEventListener("DOMContentLoaded", startGame);

function startGame() {
    canvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);
    engine.enableOfflineSupport = false;
    scene = createScene();
    modifySettings();
    var tank = scene.getMeshByName("heroTank");
    var toRender = function () {
        tank.move();
        tank.fire();
        moveHeroDude();
        moveOtherDudes();
        scene.render();
    }
    engine.runRenderLoop(toRender);
}

var createScene = function () {

    var scene = new BABYLON.Scene(engine);
    scene.enablePhysics();
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogDensity = 0.01;
    var ground = CreateGround(scene);
    var freeCamera = createFreeCamera(scene);
    var tank = createTank(scene);
    var followCamera = createFollowCamera(scene, tank);
    scene.activeCamera = followCamera;
    createLights(scene);
    createHeroDude(scene);
    return scene;
};

function CreateGround(scene) {
    var ground = new BABYLON.Mesh.CreateGroundFromHeightMap("ground", "images/hmap1.png", 2000, 2000, 20, 0, 1000, scene, false, OnGroundCreated);
    console.log(ground);
    function OnGroundCreated() {
        var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("images/grass.jpg", scene);
        ground.material = groundMaterial;
        ground.checkCollisions = true;
        ground.physicsImposter = new BABYLON.PhysicsImposter(ground, 
            BABYLON.PhysicsImposter.HeightmapImposter, { mass : 0}, scene);
    }
    return ground;
}

function createLights(scene) {
    var light0 = new BABYLON.DirectionalLight("dir0", new BABYLON.Vector3(-.1, -1, 0), scene);
    var light1 = new BABYLON.DirectionalLight("dir1", new BABYLON.Vector3(-1, -1, 0), scene);

}
function createFreeCamera(scene) {
    var camera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas);
    camera.position.y = 50;
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.keysUp.push('w'.charCodeAt(0));
    camera.keysUp.push('W'.charCodeAt(0));
    camera.keysDown.push('s'.charCodeAt(0));
    camera.keysDown.push('S'.charCodeAt(0));
    camera.keysRight.push('d'.charCodeAt(0));
    camera.keysRight.push('D'.charCodeAt(0));
    camera.keysLeft.push('a'.charCodeAt(0));
    camera.keysLeft.push('A'.charCodeAt(0));

    return camera;
}

function createFollowCamera(scene, target) {
    var camera = new BABYLON.FollowCamera("tankFollowCamera", target.position, scene, target);
    camera.radius = 20; // how far from the object to follow
    camera.heightOffset = 4; // how high above the object to place the camera
    camera.rotationOffset = 180; // the viewing angle
    camera.cameraAcceleration = .1; // how fast to move
    camera.maxCameraSpeed = 5; // speed limit
    return camera;
}
function createTank(scene) {

    var sphere = BABYLON.MeshBuilder.CreateSphere("mySphere", {diameter: 3, diameterX: 4}, scene);
    sphereMaterial = new BABYLON.StandardMaterial("sphareMaterial", scene);
    sphereMaterial.diffuseTexture = new BABYLON.Texture("images/tank.jpg", scene);
    sphere.material = sphereMaterial;
    sphere.position.y +=2.5;

    var tank = new BABYLON.MeshBuilder.CreateBox("heroTank", { height: 1.4, depth: 8, width: 4 }, scene);
    var tankMaterial = new BABYLON.StandardMaterial("tankMaterial", scene);
    tankMaterial.diffuseTexture = new BABYLON.Texture("images/tank.jpg", scene);
    tank.material = tankMaterial;
    tank.position.y += 2;

    sphere.position = tank.position;

    tank.speed = 1;
    tank.frontVector = new BABYLON.Vector3(0, 0, 1);
    tank.move = function () {
        var yMovement = 0;
        if (tank.position.y > 2) {
            tank.moveWithCollisions(new BABYLON.Vector3(0, -2, 0));
        }
        if (isWPressed) {
            tank.moveWithCollisions(tank.frontVector.multiplyByFloats(tank.speed, tank.speed, tank.speed));
        }
        if (isSPressed) {
            tank.moveWithCollisions(tank.frontVector.multiplyByFloats(-1 * tank.speed, -1 * tank.speed, -1 * tank.speed));
        }
        if (isAPressed) {
            tank.rotation.y -= .1;
            tank.frontVector = new BABYLON.Vector3(Math.sin(tank.rotation.y), 0, Math.cos(tank.rotation.y))
        }
        if (isDPressed) {
            tank.rotation.y += .1;
            tank.frontVector = new BABYLON.Vector3(Math.sin(tank.rotation.y), 0, Math.cos(tank.rotation.y))
        }
    }

    tank.canFire = true;
    tank.fire = function()
    {
        var tank = this;
        if (!isBPressed) return;
        if (!tank.canFire) return;
        tank.canFire = false;

        setTimeout(function () {
            tank.canFire = true;
        }, 300);

        var cannonBall = new BABYLON.Mesh.CreateSphere("cannonBall", 32, 2, scene);
        cannonBall.material = new BABYLON.StandardMaterial("Fire", scene);
        cannonBall.material.diffuseTexture = new BABYLON.Texture("images/Fire.jpg", scene);


        var pos = tank.position;

        cannonBall.position = new BABYLON.Vector3(pos.x, pos.y + 1, pos.z);
        cannonBall.position.addInPlace(tank.frontVector.multiplyByFloats(5, 5, 5));

        cannonBall.physicsImpostor = new BABYLON.PhysicsImpostor(cannonBall,
        BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1 }, scene);
        var fVector = tank.frontVector;
        var force = new BABYLON.Vector3(fVector.x * 100 , (fVector.y+ .1) * 100 , fVector.z * 100);
        cannonBall.physicsImpostor.applyImpulse(force, cannonBall.getAbsolutePosition());
        
        cannonBall.actionManager = new BABYLON.ActionManager(scene);
        scene.dudes.forEach(function (dude) {
            cannonBall.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                {trigger : BABYLON.ActionManager.OnIntersectionEnterTrigger,
                parameter : dude.Dude.bounder },
                function () {
                    dude.Dude.bounder.dispose();
                    dude.dispose();
                }
            ));
            
        });

        setTimeout(function () {
            cannonBall.dispose();
        }, 3000);
    }

    return tank;
}

function createHeroDude(scene)
{

    BABYLON.SceneLoader.ImportMesh("him", "models/Dude/", "Dude.babylon", scene, onDudeImported);
    function onDudeImported(newMeshes, particleSystems, skeletons) {
        newMeshes[0].position = new BABYLON.Vector3(0, 0, 5);  // The original dude
        newMeshes[0].name = "heroDude";
        var heroDude = newMeshes[0];
        
        scene.beginAnimation(skeletons[0], 0, 120, true, 1.0);
        var hero = new Dude(heroDude, .1, -1, scene, .08);

        scene.dudes = [];
        scene.dudes[0] = heroDude;
        for (var q = 1 ; q <= 20 ; q++) {
            scene.dudes[q] = DoClone(heroDude, skeletons, q);
            scene.beginAnimation(scene.dudes[q].skeleton, 0, 120, true, 1.0);
            var temp = new Dude(scene.dudes[q], .1, q, scene, .08);
        }
    }
}

function DoClone(original, skeletons, id)
{
    var myClone;
    var xrand = Math.floor(Math.random() * 1000) - 250;
    var zrand = Math.floor(Math.random() * 1000) - 250;

    myClone = original.clone("clone_" + id);
    myClone.position = new BABYLON.Vector3(xrand, 0, zrand);
    if (!skeletons)
    {
        return myClone;
    }
    else
    {
        if(!original.getChildren())
        {
            myClone.skeleton = skeletons[0].clone("clone_" + id + "_skeleton");
            return myClone;
        }
        else
        {
            if(skeletons.length == 1)// this means one skeleton controlling/animating all the children
            {
                var clonedSkeleton = skeletons[0].clone("clone_" + id + "_skeleton");
                myClone.skeleton = clonedSkeleton;
                var numChildren = myClone.getChildren().length;
                for(var i = 0 ; i < numChildren ; i++)
                {
                    myClone.getChildren()[i].skeleton = clonedSkeleton;
                }
                return myClone;
            }
            else if(skeletons.length == original.getChildren().length)
            { // Most probably each child has its own skeleton
                for( var i = 0 ; i < myClone.getChildren().length; i++)
                {
                    myClone.getChildren()[i].skeleton = skeletons[i].clone("clone_" + id +"_skeleton_"+i);
                }
                return myClone;
            }
        }
    }

    return myClone;
}
function moveHeroDude()
{
    var heroDude = scene.getMeshByName("heroDude");
    if (heroDude)
        heroDude.Dude.move();
}

function moveOtherDudes()
{
    if (scene.dudes) {
        for (var q = 0 ; q < scene.dudes.length ; q++) {
            scene.dudes[q].Dude.move();
        }
    }
}

window.addEventListener("resize", function () {
    engine.resize();
});

///// Handeling Mouse and Keyboard //////

function modifySettings() {
    scene.onPointerDown = function () {
        if (!scene.alreadyLocked) {
            console.log("Requesting pointer lock");
            canvas.requestPointerLock = canvas.requestPointerLock ||
                canvas.msRequestPointerLock || canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock;
            canvas.requestPointerLock();
        }
        else {
            console.log("Not requesting because we are already locked");
        }
    }

    document.addEventListener("pointerlockchange", pointerLockListener);
    document.addEventListener("mspointerlockchange", pointerLockListener);
    document.addEventListener("mozpointerlockchange", pointerLockListener);
    document.addEventListener("webkitpointerlockchange", pointerLockListener);

    function pointerLockListener() {
        var element = document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement || document.pointerLockElement || null;

        if (element) {
            scene.alreadyLocked = true;
        }
        else {
            scene.alreadyLocked = false;
        }
    }
}

document.addEventListener("keydown", function (event) {
    if (event.key == 'w' || event.key == 'W') {
        isWPressed = true;
    }
    if (event.key == 's' || event.key == 'S') {
        isSPressed = true;
    }
    if (event.key == 'a' || event.key == 'A') {
        isAPressed = true;
    }
    if (event.key == 'd' || event.key == 'D') {
        isDPressed = true;
    }
    if (event.key == 'b' || event.key == 'B') {
        isBPressed = true;
    }
});

document.addEventListener("keyup", function (event) {
    if (event.key == 'w' || event.key == 'W') {
        isWPressed = false;
    }
    if (event.key == 's' || event.key == 'S') {
        isSPressed = false;
    }
    if (event.key == 'a' || event.key == 'A') {
        isAPressed = false;
    }
    if (event.key == 'd' || event.key == 'D') {
        isDPressed = false;
    }
    if (event.key == 'b' || event.key == 'B') {
        isBPressed = false;
    }
});
