"use strict";
/// <reference path="camera-rotation.ts" />
/// <reference path="client-settings.ts" />
class WorkSpace {
    constructor(renderCanvas, layerCanvas) {
        this._isBoundingBox = true;
        this._isCaptureBox = false;
        this._countPendingImages = 0;
        this._countCompletedImages = 0;
        this._xboxMesh = null;
        // Create canvas and engine.
        this._renderCanvas = document.getElementById(renderCanvas);
        this._layerCanvas = document.getElementById(layerCanvas);
        let boundingCheckBox = document.getElementById("boundingCheckBox");
        if (boundingCheckBox) {
            boundingCheckBox.onclick = (ev) => {
                this._isBoundingBox = boundingCheckBox.checked;
            };
        }
        let captureCheckBox = document.getElementById("captureCheckBox");
        if (captureCheckBox) {
            captureCheckBox.onclick = (ev) => {
                this._isCaptureBox = boundingCheckBox.checked;
            };
        }
        this._engine = new BABYLON.Engine(this._renderCanvas, true, { preserveDrawingBuffer: true });
        this._engine.enableOfflineSupport = false;
        // Create a basic Babylon Scene object.
        this._scene = new BABYLON.Scene(this._engine);
        // Define a general environment texture
        this._hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./environment.dds", this._scene);
        this._hdrTexture.gammaSpace = false;
    }
    initCameraAndLight(meshes) {
        this._scene.createDefaultCameraOrLight(true, true, true);
        if (this._scene.activeCamera) {
            let camera = this._scene.activeCamera;
            // We want framing to move the camera at the best spot
            //camera.useAutoRotationBehavior = true;
            camera.addBehavior(new CustomCameraRotation());
            camera.useFramingBehavior = true;
            // Get the bounding vectors of the mesh hierarchy (meshes[0] = root node in gltf)
            meshes[0].rotation.y += Math.PI;
            var bounding = meshes[0].getHierarchyBoundingVectors();
            let framingBehavior = this._scene.activeCamera.getBehaviorByName("Framing");
            ;
            if (framingBehavior) {
                framingBehavior.framingTime = 0;
                framingBehavior.elevationReturnTime = -1;
                var worldExtends = this._scene.getWorldExtends();
                framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
            }
            // Remove default light and create a new one                          
            this._scene.lights[0].dispose();
            let light = new BABYLON.DirectionalLight('light', new BABYLON.Vector3(-0.2, -1, 0), this._scene);
            light.position = new BABYLON.Vector3(bounding.max.x * 0.2, bounding.max.y * 2, 0);
            light.intensity = 4.5;
            // Create the shadows
            var shadowGenerator = new BABYLON.ShadowGenerator(512, light);
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.useKernelBlur = true;
            shadowGenerator.blurKernel = 64;
            shadowGenerator.blurScale = 4;
            shadowGenerator.setDarkness(0.2);
            for (var index = 0; index < meshes.length; index++) {
                let shadowMap = shadowGenerator.getShadowMap();
                if (shadowMap && shadowMap.renderList) {
                    shadowMap.renderList.push(meshes[index]);
                }
            }
            // Create a ground to host the shadows
            var ground = BABYLON.Mesh.CreatePlane('ground', 100, this._scene);
            ground.rotation.x = Math.PI / 2;
            ground.material = new BABYLON.ShadowOnlyMaterial('mat', this._scene);
            ground.material.alpha = 0.3;
            ground.receiveShadows = true;
            ground.position.y = bounding.min.y;
            let box = this._scene.createDefaultSkybox(this._hdrTexture, true, (this._scene.activeCamera.maxZ - this._scene.activeCamera.minZ) / 2, 0.7);
            if (box && box.material) {
                // Let's create a color curve to play with background color
                var curve = new BABYLON.ColorCurves();
                curve.globalHue = 200;
                curve.globalDensity = 80;
                box.infiniteDistance = false;
                let material = box.material;
                material.imageProcessingConfiguration = new BABYLON.ImageProcessingConfiguration();
                material.cameraColorCurvesEnabled = true;
                material.cameraColorCurves = curve;
            }
            camera.pinchPrecision = 200 / camera.radius;
            camera.upperRadiusLimit = 5 * camera.radius;
            camera.wheelDeltaPercentage = 0.01;
            camera.pinchDeltaPercentage = 0.01;
            camera.attachControl(this._renderCanvas);
        }
    }
    triggerTraining() {
        console.log('triggered');
    }
    uploadScreenshot(bbox) {
        console.log(ClientSettings.MAX_IMAGES);
        if (this._scene.activeCamera && (this._countPendingImages < ClientSettings.MAX_IMAGES)) {
            this._countPendingImages += 1;
            BABYLON.Tools.CreateScreenshot(this._engine, this._scene.activeCamera, { precision: 1 }, (data) => {
                fetch('http://localhost:8081/image', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: "POST",
                    body: JSON.stringify({
                        'data': data,
                        'bboxes': bbox.toString(),
                        'labels': 'xbox controller'
                    })
                }).then((data) => {
                    this._countCompletedImages += 1;
                    console.log('upload succeded', data);
                    if (this._countCompletedImages == ClientSettings.MAX_IMAGES) {
                        this.triggerTraining();
                    }
                })
                    .catch((error) => {
                    console.log('upload failed', error);
                });
            });
        }
    }
    getBoundingBox(mesh) {
        if (mesh) {
            let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            if (this._scene.activeCamera && this._scene.activeCamera.viewport && positions) {
                let worlMatrix = mesh.getWorldMatrix();
                let transformMatrix = this._scene.getTransformMatrix();
                let viewPort = this._scene.activeCamera.viewport;
                let xCoordinates = [];
                let yCoordinates = [];
                // Transform and Project all vertex in the Camera View 
                for (let i = 0; i < positions.length; i += 3) {
                    let coordinates = BABYLON.Vector3.Project(BABYLON.Vector3.FromArray(positions, i), worlMatrix, transformMatrix, viewPort);
                    xCoordinates.push(coordinates.x);
                    yCoordinates.push(coordinates.y);
                }
                // Get the width and height of the render canvas
                let width = this._layerCanvas.width = this._renderCanvas.width;
                let height = this._layerCanvas.height = this._renderCanvas.height;
                const MARGIN = 4;
                // Find min/max values
                let x1 = Math.min.apply(null, xCoordinates) * width;
                let y1 = Math.min.apply(null, yCoordinates) * height;
                if (x1 > 2)
                    x1 -= MARGIN;
                if (y1 > 2)
                    y1 -= MARGIN;
                let x2 = Math.max.apply(null, xCoordinates) * width;
                let y2 = Math.max.apply(null, yCoordinates) * height;
                if (x2 < width - MARGIN)
                    x2 += MARGIN;
                if (y2 < height - MARGIN)
                    y2 += MARGIN;
                return new BoundingBox(x1, y1, x2, y2);
            }
        }
        return undefined;
    }
    drawAIBoundingBox() {
        if (this._xboxMesh) {
            let xCoordinates = [];
            let yCoordinates = [];
            let bbox = this.getBoundingBox(this._xboxMesh);
            if (bbox) {
                xCoordinates.push(bbox.x1);
                xCoordinates.push(bbox.x2);
                yCoordinates.push(bbox.y1);
                yCoordinates.push(bbox.y2);
            }
            let childrens = this._xboxMesh.getChildMeshes(false);
            for (let child of childrens) {
                let bbox = this.getBoundingBox(child);
                if (bbox) {
                    //console.log(bbox);
                    xCoordinates.push(bbox.x1);
                    xCoordinates.push(bbox.x2);
                    yCoordinates.push(bbox.y1);
                    yCoordinates.push(bbox.y2);
                }
            }
            // Find min/max values
            let x1 = Math.min.apply(null, xCoordinates);
            let y1 = Math.min.apply(null, yCoordinates);
            let x2 = Math.max.apply(null, xCoordinates);
            let y2 = Math.max.apply(null, yCoordinates);
            // Draw the 2D bounding box on the layer canvas
            let context = this._layerCanvas.getContext('2d');
            if (context) {
                if (this._isBoundingBox) {
                    context.beginPath();
                    context.rect(x1, y1, x2 - x1, y2 - y1);
                    context.lineWidth = 1;
                    context.strokeStyle = 'yellow';
                    context.stroke();
                }
                else {
                    context.clearRect(0, 0, this._layerCanvas.width, this._layerCanvas.height);
                }
                return new BoundingBox(x1, y1, x2, y2);
            }
        }
        return undefined;
    }
    sceneLoaded(scene) {
        this._scene = scene;
        //this._xboxMesh = <BABYLON.Mesh>this._scene.getMeshByName('node_id29');
        this._xboxMesh = this._scene.meshes[0];
        this.initCameraAndLight(scene.meshes);
    }
    createScene() {
        BABYLON.SceneLoader.LoadAsync("./", "xbox_one_controller.glb", this._engine).then((scene) => {
            this.sceneLoaded(scene);
            scene.whenReadyAsync().then(() => {
                this._engine.runRenderLoop(() => {
                    this._scene.render();
                    let bbox = this.drawAIBoundingBox();
                    if (bbox && this._isCaptureBox) {
                        this.uploadScreenshot(bbox);
                    }
                });
            });
        }).catch((reason) => { console.log(reason.message); });
    }
    addListeners() {
        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
}
window.addEventListener('DOMContentLoaded', () => {
    // Create the workspace
    let workspace = new WorkSpace('renderCanvas', 'layerCanvas');
    workspace.addListeners();
    workspace.createScene();
});
class BoundingBox {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1,
            this.y1 = y1,
            this.x2 = x2,
            this.y2 = y2;
    }
    toString() {
        return `${this.x1}\t${this.y1}\t${this.x2}\t${this.y2}`;
    }
}
//# sourceMappingURL=index.js.map