/// <reference path="camera-rotation.ts" />
/// <reference path="client-settings.ts" />
class WorkSpace {
    constructor(renderCanvas, layerCanvas) {
        this._isBoundingBox = true;
        this._isCaptureInProgress = false;
        this._countPendingImages = 0;
        this._countCompletedImages = 0;
        this._meshes = [];
        this._skyboxPath = "https://assets.babylonjs.com/environments/environmentSpecular.env";
        // Create canvas and engine.
        this._renderCanvas = document.getElementById(renderCanvas);
        this._layerCanvas = document.getElementById(layerCanvas);
        let boundingCheckBox = document.getElementById("boundingCheckBox");
        if (boundingCheckBox) {
            boundingCheckBox.onclick = (ev) => {
                this._isBoundingBox = boundingCheckBox.checked;
            };
        }
        let captureButton = document.getElementById("captureButton");
        if (captureButton) {
            captureButton.onclick = (ev) => {
                this._isCaptureInProgress = true;
            };
        }
        this._engine = new BABYLON.Engine(this._renderCanvas, true, { preserveDrawingBuffer: true });
        this._engine.enableOfflineSupport = false;
        BABYLON.Engine.ShadersRepository = "/src/Shaders/";
        // This is really important to tell Babylon.js to use decomposeLerp and matrix interpolation
        BABYLON.Animation.AllowMatricesInterpolation = true;
    }
    /**
    * Helper - Get 3D bounding information from a set of meshes.
    * @return {BABYLON.BoundingInfo} A BoundingInfo object.
    */
    totalBoundingInfo(meshes) {
        var boundingInfo = meshes[0].getBoundingInfo();
        var min = boundingInfo.minimum.add(meshes[0].position);
        var max = boundingInfo.maximum.add(meshes[0].position);
        for (var i = 1; i < meshes.length; i++) {
            boundingInfo = meshes[i].getBoundingInfo();
            min = BABYLON.Vector3.Minimize(min, boundingInfo.minimum.add(meshes[i].position));
            max = BABYLON.Vector3.Maximize(max, boundingInfo.maximum.add(meshes[i].position));
        }
        return new BABYLON.BoundingInfo(min, max);
    }
    /**
    * Initialize Camera and Light. Applying also shadows for more realistics pictures.
    * @param {BABYLON.AbstractMesh[]} nameOfCameraTarget - Mesh name, used as target by the camera.
    * @param {BABYLON.AbstractMesh[]} nameOfShadowsReceiver - Mesh name, used to receive shadows (ex. ground).
    */
    initCameraAndLight(nameOfCameraTarget, nameOfShadowsReceiver) {
        if (!this._scene.activeCamera || this._scene.lights.length === 0) {
            this._scene.createDefaultCamera(true);
            let camera = this._scene.activeCamera;
            camera.addBehavior(new CustomCameraRotation());
            // Enable camera's behaviors
            camera.useFramingBehavior = true;
            let framingBehavior = this._scene.activeCamera.getBehaviorByName("Framing");
            framingBehavior.framingTime = 0;
            framingBehavior.elevationReturnTime = -1;
            // Define camera position and target
            camera.setTarget(this._scene.getMeshByName(nameOfCameraTarget));
            camera.beta -= Math.PI;
            camera.alpha += Math.PI;
            camera.radius = 0.8;
            // Attach camera to canvas inputs
            camera.attachControl(this._renderCanvas);
            if (!this._scene.environmentTexture) {
                this._scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(this._skyboxPath, this._scene);
            }
            this._scene.createDefaultSkybox(this._scene.environmentTexture, true, (camera.maxZ - camera.minZ) / 2, 0.3, false);
            let light = new BABYLON.DirectionalLight("defaultlight", new BABYLON.Vector3(0, -2, -1), this._scene);
            light.intensity = 0.9;
            // Create shadows
            let shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
            shadowGenerator.useBlurExponentialShadowMap = true;
            let fond = this._scene.getMeshByName(nameOfShadowsReceiver);
            fond.receiveShadows = true;
            for (let mesh of this._meshes) {
                let childMeshes = mesh.getChildMeshes(false);
                for (let child of childMeshes) {
                    if (child.getBoundingInfo().diagonalLength > 0) {
                        let shadowMap = shadowGenerator.getShadowMap();
                        if (shadowMap && shadowMap.renderList) {
                            shadowMap.renderList.push(child);
                        }
                    }
                }
            }
        }
    }
    /**
    * Initialize Physics environment. Adding hidden boxes around the main area to contain meshes.
    * @param {boolean} isVisible - If true, all hidden boxes are visible.
    */
    initPhysicsEnvironment(isVisible = false) {
        this._scene.enablePhysics();
        let topSide = BABYLON.Mesh.CreateBox("topSide", 0.6, this._scene);
        topSide.position.z = 0.48;
        topSide.physicsImpostor = new BABYLON.PhysicsImpostor(topSide, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, this._scene);
        topSide.isVisible = isVisible;
        let bottomSide = BABYLON.Mesh.CreateBox("bottomSide", 0.6, this._scene);
        bottomSide.position.z = -0.48;
        bottomSide.physicsImpostor = new BABYLON.PhysicsImpostor(bottomSide, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, this._scene);
        bottomSide.isVisible = isVisible;
        let rightSide = BABYLON.Mesh.CreateBox("rightSide", 0.6, this._scene);
        rightSide.position.x = -0.6;
        rightSide.physicsImpostor = new BABYLON.PhysicsImpostor(rightSide, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, this._scene);
        rightSide.isVisible = isVisible;
        let leftSide = BABYLON.Mesh.CreateBox("leftSide", 0.6, this._scene);
        leftSide.position.x = 0.6;
        leftSide.physicsImpostor = new BABYLON.PhysicsImpostor(leftSide, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, this._scene);
        leftSide.isVisible = isVisible;
        var ground = BABYLON.Mesh.CreateGround("ground", 1, 1, 6, this._scene);
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.PlaneImpostor, { mass: 0, restitution: 0 }, this._scene);
    }
    /**
    * Not used at the moment.
    */
    triggerTraining() {
        console.log('triggered');
    }
    /**
    * Get exact bounding box (2D) information of a specific mesh (used to label data).
    * @param {BABYLON.Mesh} mesh - Mesh object.
    * @return {BoundingBox} BoundingBox object.
    */
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
                const MARGIN = 5;
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
    /**
    * Extract all bounding boxes (2D) and draw them on a 2DCanvas.
    * @return {BoundingBox} BoundingBox array.
    */
    drawAIBoundingBox() {
        let bboxes = [];
        for (let mesh of this._meshes) {
            let xCoordinates = [];
            let yCoordinates = [];
            let bbox = this.getBoundingBox(mesh);
            if (bbox) {
                xCoordinates.push(bbox.x1);
                xCoordinates.push(bbox.x2);
                yCoordinates.push(bbox.y1);
                yCoordinates.push(bbox.y2);
            }
            let childrens = mesh.getChildMeshes(false);
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
            let x1 = Math.floor(Math.min.apply(null, xCoordinates));
            let y1 = Math.floor(Math.min.apply(null, yCoordinates));
            let x2 = Math.floor(Math.max.apply(null, xCoordinates));
            let y2 = Math.floor(Math.max.apply(null, yCoordinates));
            // Find width/height of the canvas
            let width = this._renderCanvas.width;
            let height = this._renderCanvas.height;
            //console.log(`${x1},${y1},${x2},${y2}`);
            bboxes.push(new BoundingBox(x1, y1, x2, y2, width, height, mesh.name));
        }
        if (this._isBoundingBox) {
            // Draw the 2D bounding box on the layer canvas
            let context = this._layerCanvas.getContext('2d');
            context.beginPath();
            context.lineWidth = .5;
            context.strokeStyle = 'green';
            for (let bbox of bboxes) {
                context.strokeRect(bbox.x1, bbox.y1, bbox.x2 - bbox.x1, bbox.y2 - bbox.y1);
            }
            context.closePath();
        }
        return bboxes;
    }
    /**
    * Capture screenshot and upload it with labeled data.
    * @return {BoundingBox[]} BoundingBox array.
    */
    uploadScreenshot(bboxes) {
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
                        'bboxes': JSON.stringify(bboxes)
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
    /**
    * Create a parent mesh (box) used as a Physics Impostor for a specific mesh.
    * @return {BABYLON.Mesh} Parent Mesh.
    */
    createImpostor(name, meshPosition, parentPosition, mass = 1, restitution = 0) {
        let mesh = this._scene.getMeshByName(name);
        // Find the bounding information of the mesh
        let bInfo = this.totalBoundingInfo(mesh.getChildMeshes());
        // Extract dimensions for the 3D bounding box
        let width = (bInfo.boundingBox.maximum.x - bInfo.boundingBox.minimum.x) * mesh.scaling.x;
        let height = (bInfo.boundingBox.maximum.y - bInfo.boundingBox.minimum.y) * mesh.scaling.y;
        let depth = (bInfo.boundingBox.maximum.z - bInfo.boundingBox.minimum.z) * mesh.scaling.z;
        // TODO - CHECK HOW TO CALCULATE THIS VALUE (RELATED PROBABLY TO QUATERNION) - DON'T UNDERSTAND.
        //mesh.setAbsolutePosition(new BABYLON.Vector3(mesh.getAbsolutePosition().x * -2.18, mesh.getAbsolutePosition().y * -2.18, mesh.getAbsolutePosition().z * -2.18));
        mesh.setAbsolutePosition(meshPosition);
        mesh.setPivotPoint(new BABYLON.Vector3(0, 0, 0));
        // Create parent mesh
        let parent = BABYLON.MeshBuilder.CreateBox(`${mesh.name}_parent`, { width: width, height: height, depth: depth }, this._scene);
        parent.position = parentPosition;
        mesh.parent = parent;
        // Assign physics impostor
        parent.physicsImpostor = new BABYLON.PhysicsImpostor(parent, BABYLON.PhysicsImpostor.BoxImpostor, { mass: mass, restitution: restitution }, this._scene);
        parent.isVisible = false;
        // Adding this assets to the meshes
        this._meshes.push(mesh);
        return parent;
    }
    /**
    * Create Scene - main entry point to load all assets.
    */
    createScene() {
        // Create a new scene and init physics
        this._scene = new BABYLON.Scene(this._engine);
        this.initPhysicsEnvironment();
        // ****** ADDING MESHES TO THE SCENE ******
        let assetsManager = new BABYLON.AssetsManager(this._scene);
        var meshTask0 = assetsManager.addMeshTask("bac", "", "./", "bac.glb");
        meshTask0.onSuccess = (task) => {
            // NOTHING
        };
        // let meshTask1 = assetsManager.addMeshTask("tuyau flexible", "", "./", "tuyau flexible.glb");
        // meshTask1.onSuccess = (task) => {
        //     this.createImpostor(task.name, new BABYLON.Vector3(0.44,-0.4,-0.35), new BABYLON.Vector3(0.1, 8, -0.1));
        // }
        var meshTask2 = assetsManager.addMeshTask("boitier papillon", "", "./", "papillon.glb");
        meshTask2.onSuccess = (task) => {
            this.createImpostor(task.name, new BABYLON.Vector3(-0.06, 0, 0.052), new BABYLON.Vector3(0.22, 2, 0.1));
        };
        var meshTask3 = assetsManager.addMeshTask("capteur", "", "./", "capteur.glb");
        meshTask3.onSuccess = (task) => {
            this.createImpostor(task.name, new BABYLON.Vector3(0.065, 0.02, 0), new BABYLON.Vector3(-0.2, 3, -0.1));
        };
        var meshTask4 = assetsManager.addMeshTask("tube", "", "./", "tube.glb");
        meshTask4.onSuccess = (task) => {
            this.createImpostor(task.name, new BABYLON.Vector3(0.81, -0.44, -0.36), new BABYLON.Vector3(-0.15, 4, 0.1));
        };
        assetsManager.onFinish = (tasks) => {
            this.initCameraAndLight("Bac", "bac_bas_fond_sans_collision_polySurface6");
            this._scene.whenReadyAsync().then(() => {
                this._engine.runRenderLoop(() => {
                    this._scene.render();
                    let bboxes = this.drawAIBoundingBox();
                    if (bboxes && this._isCaptureInProgress) {
                        this.uploadScreenshot(bboxes);
                    }
                });
            });
        };
        assetsManager.load();
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
    constructor(x1, y1, x2, y2, width, height, name) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.width = width;
        this.height = height;
        this.name = name;
    }
    toString() {
        return `${this.x1}\t${this.y1}\t${this.x2}\t${this.y2}`;
    }
}
//# sourceMappingURL=index.js.map