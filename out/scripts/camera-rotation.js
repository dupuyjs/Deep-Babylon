"use strict";
class CustomCameraRotation {
    constructor() {
        this._zoomStopsAnimation = false;
        this._idleRotationAlphaSpeed = 0.05;
        this._idleRotationBetaSpeed = 0.01;
        this._idleRotationWaitTime = 2000;
        this._idleRotationSpinupTime = 2000;
        // Default behavior functions
        this._onPrePointerObservableObserver = null;
        this._onAfterCheckInputsObserver = null;
        this._attachedCamera = null;
        this._isPointerDown = false;
        this._lastFrameTime = null;
        this._lastInteractionTime = -Infinity;
        this._cameraRotationAlphaSpeed = 0;
        this._cameraRotationBetaSpeed = 0;
        this._isBetaDirectionUp = true;
        this._lastFrameRadius = 0;
    }
    get name() {
        return "CustomRotation";
    }
    /**
    * Sets the flag that indicates if user zooming should stop animation.
    */
    set zoomStopsAnimation(flag) {
        this._zoomStopsAnimation = flag;
    }
    /**
    * Gets the flag that indicates if user zooming should stop animation.
    */
    get zoomStopsAnimation() {
        return this._zoomStopsAnimation;
    }
    /**
    * Sets the default speed at which the camera rotates around the model.
    */
    set idleRotationSpeed(speed) {
        this._idleRotationAlphaSpeed = speed;
    }
    /**
    * Gets the default speed at which the camera rotates around the model.
    */
    get idleRotationSpeed() {
        return this._idleRotationAlphaSpeed;
    }
    /**
    * Sets the time (in milliseconds) to wait after user interaction before the camera starts rotating.
    */
    set idleRotationWaitTime(time) {
        this._idleRotationWaitTime = time;
    }
    /**
    * Gets the time (milliseconds) to wait after user interaction before the camera starts rotating.
    */
    get idleRotationWaitTime() {
        return this._idleRotationWaitTime;
    }
    /**
    * Sets the time (milliseconds) to take to spin up to the full idle rotation speed.
    */
    set idleRotationSpinupTime(time) {
        this._idleRotationSpinupTime = time;
    }
    /**
    * Gets the time (milliseconds) to take to spin up to the full idle rotation speed.
    */
    get idleRotationSpinupTime() {
        return this._idleRotationSpinupTime;
    }
    /**
     * Gets a value indicating if the camera is currently rotating because of this behavior
     */
    get rotationInProgress() {
        return Math.abs(this._cameraRotationAlphaSpeed) > 0;
    }
    init() {
        // Do nothing
    }
    attach(camera) {
        this._attachedCamera = camera;
        let scene = this._attachedCamera.getScene();
        this._onPrePointerObservableObserver = scene.onPrePointerObservable.add((pointerInfoPre) => {
            if (pointerInfoPre.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                this._isPointerDown = true;
                return;
            }
            if (pointerInfoPre.type === BABYLON.PointerEventTypes.POINTERUP) {
                this._isPointerDown = false;
            }
        });
        this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(() => {
            let now = BABYLON.Tools.Now;
            let dt = 0;
            if (this._lastFrameTime != null) {
                dt = now - this._lastFrameTime;
            }
            this._lastFrameTime = now;
            // Stop the animation if there is user interaction and the animation should stop for this interaction
            this._applyUserInteraction();
            let timeToRotation = now - this._lastInteractionTime - this._idleRotationWaitTime;
            let scale = Math.max(Math.min(timeToRotation / (this._idleRotationSpinupTime), 1), 0);
            this._cameraRotationAlphaSpeed = this._idleRotationAlphaSpeed * scale;
            this._cameraRotationBetaSpeed = this._idleRotationBetaSpeed * scale;
            // Step camera rotation by rotation speed
            if (this._attachedCamera) {
                this._attachedCamera.alpha -= this._cameraRotationAlphaSpeed * (dt / 1000);
                if (this._isBetaDirectionUp) {
                    this._attachedCamera.beta -= this._cameraRotationBetaSpeed * (dt / 1000);
                    if (this._attachedCamera.beta < 0.1) {
                        console.log('Down');
                        this._isBetaDirectionUp = false;
                    }
                }
                else {
                    this._attachedCamera.beta += this._cameraRotationBetaSpeed * (dt / 1000);
                    if (this._attachedCamera.beta > (Math.PI - 0.1)) {
                        console.log('Up');
                        this._isBetaDirectionUp = true;
                    }
                    console.log(this._attachedCamera.beta);
                }
            }
        });
    }
    detach() {
        if (!this._attachedCamera) {
            return;
        }
        let scene = this._attachedCamera.getScene();
        if (this._onPrePointerObservableObserver) {
            scene.onPrePointerObservable.remove(this._onPrePointerObservableObserver);
        }
        this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
        this._attachedCamera = null;
    }
    /**
     * Returns true if user is scrolling.
     * @return true if user is scrolling.
     */
    _userIsZooming() {
        if (!this._attachedCamera) {
            return false;
        }
        return this._attachedCamera.inertialRadiusOffset !== 0;
    }
    _shouldAnimationStopForInteraction() {
        if (!this._attachedCamera) {
            return false;
        }
        var zoomHasHitLimit = false;
        if (this._lastFrameRadius === this._attachedCamera.radius && this._attachedCamera.inertialRadiusOffset !== 0) {
            zoomHasHitLimit = true;
        }
        // Update the record of previous radius - works as an approx. indicator of hitting radius limits
        this._lastFrameRadius = this._attachedCamera.radius;
        return this._zoomStopsAnimation ? zoomHasHitLimit : this._userIsZooming();
    }
    /**
     *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
     */
    _applyUserInteraction() {
        if (this._userIsMoving() && !this._shouldAnimationStopForInteraction()) {
            this._lastInteractionTime = BABYLON.Tools.Now;
        }
    }
    // Tools
    _userIsMoving() {
        if (!this._attachedCamera) {
            return false;
        }
        return this._attachedCamera.inertialAlphaOffset !== 0 ||
            this._attachedCamera.inertialBetaOffset !== 0 ||
            this._attachedCamera.inertialRadiusOffset !== 0 ||
            this._attachedCamera.inertialPanningX !== 0 ||
            this._attachedCamera.inertialPanningY !== 0 ||
            this._isPointerDown;
    }
}
//# sourceMappingURL=camera-rotation.js.map