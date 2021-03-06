
class CustomCameraRotation implements BABYLON.Behavior<BABYLON.ArcRotateCamera> {
    public get name(): string {
        return "CustomRotation";
    }

    private _zoomStopsAnimation = false;
    private _idleRotationAlphaSpeed = 0.3;
    private _idleRotationBetaSpeed = 0.05;
    private _idleRotationWaitTime = 2000;
    private _idleRotationSpinupTime = 2000;

    // Default behavior functions
    private _onPrePointerObservableObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.PointerInfoPre>> = null;
    private _onAfterCheckInputsObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.Camera>> = null;
    private _attachedCamera: BABYLON.Nullable<BABYLON.ArcRotateCamera> = null;
    private _isPointerDown = false;
    private _lastFrameTime: BABYLON.Nullable<number> = null;
    private _lastInteractionTime = -Infinity;
    private _cameraRotationAlphaSpeed: number = 0;
    private _cameraRotationBetaSpeed: number = 0;
    private _cameraRotationInitialRadius: number = 0;
    private _isBetaDirectionUp = true;

    /**
	* Sets the flag that indicates if user zooming should stop animation.
	*/
    public set zoomStopsAnimation(flag: boolean) {
        this._zoomStopsAnimation = flag;
    }

    /**
    * Gets the flag that indicates if user zooming should stop animation.
    */
    public get zoomStopsAnimation(): boolean {
        return this._zoomStopsAnimation;
    }

    /**
    * Sets the default speed at which the camera rotates around the model.
    */
    public set idleRotationSpeed(speed: number) {
        this._idleRotationAlphaSpeed = speed;
    }

    /**
    * Gets the default speed at which the camera rotates around the model.
    */
    public get idleRotationSpeed() {
        return this._idleRotationAlphaSpeed;
    }

    /**
    * Sets the time (in milliseconds) to wait after user interaction before the camera starts rotating.
    */
    public set idleRotationWaitTime(time: number) {
        this._idleRotationWaitTime = time;
    }

    /**
    * Gets the time (milliseconds) to wait after user interaction before the camera starts rotating.
    */
    public get idleRotationWaitTime() {
        return this._idleRotationWaitTime;
    }

    /**
    * Sets the time (milliseconds) to take to spin up to the full idle rotation speed.
    */
    public set idleRotationSpinupTime(time: number) {
        this._idleRotationSpinupTime = time;
    }

    /**
    * Gets the time (milliseconds) to take to spin up to the full idle rotation speed.
    */
    public get idleRotationSpinupTime() {
        return this._idleRotationSpinupTime;
    }

    /**
     * Gets a value indicating if the camera is currently rotating because of this behavior
     */
    public get rotationInProgress(): boolean {
        return Math.abs(this._cameraRotationAlphaSpeed) > 0;
    }

    public init(): void {
        // Do nothing
    }

    public attach(camera: BABYLON.ArcRotateCamera): void {
        this._attachedCamera = camera;
        let scene = this._attachedCamera.getScene();
        this._cameraRotationInitialRadius = this._attachedCamera.radius;

        this._onPrePointerObservableObserver = scene.onPrePointerObservable.add((pointerInfoPre) => {
            if (pointerInfoPre.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                this._isPointerDown = true;
                return
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
                //this._attachedCamera.alpha -= this._cameraRotationAlphaSpeed * (dt / 1000);

                if (this._isBetaDirectionUp) {

                    this._attachedCamera.beta -= this._cameraRotationBetaSpeed * (dt / 1000);

                    if (this._attachedCamera.beta < 0.1) {
                        this._isBetaDirectionUp = false;
                    }
                }

                else {
                    this._attachedCamera.beta += this._cameraRotationBetaSpeed * (dt / 1000);

                    if (this._attachedCamera.beta > (Math.PI/4 - 0.1)) {
                        this._isBetaDirectionUp = true;
                    }
                }
                
                // if (this._isBetaDirectionUp) {
                //     this._attachedCamera.beta -= this._cameraRotationBetaSpeed * (dt / 1000);
                //     //this._attachedCamera.radius += 0.01;

                //     if (this._attachedCamera.beta < 0.1) {
                //         this._isBetaDirectionUp = false;
                //     }
                // }
                // else {
                //     this._attachedCamera.beta += this._cameraRotationBetaSpeed * (dt / 1000);

                //     if (this._attachedCamera.radius > this._cameraRotationInitialRadius) {
                //         //this._attachedCamera.radius -= 0.01;
                //     }

                //     if (this._attachedCamera.beta > (Math.PI -0.1)) {
                //         this._isBetaDirectionUp = true;
                //     }
                //     console.log(this._attachedCamera.beta);
                // }

            }
        });
    }

    public detach(): void {
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
    private _userIsZooming(): boolean {
        if (!this._attachedCamera) {
            return false;
        }
        return this._attachedCamera.inertialRadiusOffset !== 0;
    }

    private _lastFrameRadius = 0;
    private _shouldAnimationStopForInteraction(): boolean {
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
    private _applyUserInteraction(): void {
        if (this._userIsMoving() && !this._shouldAnimationStopForInteraction()) {
            this._lastInteractionTime = BABYLON.Tools.Now;
        }
    }

    // Tools
    private _userIsMoving(): boolean {
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