class Gallery {
    constructor() {
        this.audioTracks = [
            new Audio('music/music1.mp3'),
            new Audio('music/music2.mp3'),
            new Audio('music/music3.mp3')
        ];
        this.currentTrackIndex = 0;
        this.audioTracks.forEach(track => {
            track.loop = true; 
            track.volume = 0.5; 
        });
        this.audioTracks[this.currentTrackIndex].play(); 

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 10);
        this.spawnPoint = new THREE.Vector3(0, 2, 10);
        this.camera.position.copy(this.spawnPoint);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById("gallery-container").appendChild(this.renderer.domElement);

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        this.pointLight = new THREE.PointLight(0xffffff, 1, 100);
        this.pointLight.position.set(0, 5, 5);
        this.scene.add(this.pointLight);

        this.wallMaterial = new THREE.MeshStandardMaterial({ color: 0xcda174, side: THREE.DoubleSide });
        this.gallerySize = { width: 50, height: 10, depth: 50 };

        this.artworks = [
            { file: "artworks/art1.jpg", position: [-3, 2, -9] },
            { file: "artworks/art2.jpg", position: [3, 2, -9] },
            { file: "artworks/art3.jpg", position: [-4, 2, 9] },
            { file: "artworks/art4.jpg", position: [4, 2, 9] },
            { file: "artworks/art5.jpg", position: [-7, 2, -9] },
            { file: "artworks/art6.jpg", position: [7, 2, -9] },
            { file: "artworks/art7.jpg", position: [-8, 2, 9] },
            { file: "artworks/art8.jpg", position: [8, 2, 9] },
            { file: "artworks/art9.jpg", position: [0, 2, -12] },
            { file: "artworks/art10.jpg", position: [0, 2, 12] } 
        ];

        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.isPointerLocked = false;
        this.blockerActive = true; // Flag to track blocker visibility

        this.pitch = 0; 
        this.yaw = 0;  

        this.isJumping = false;
        this.verticalVelocity = 0;
        this.gravity = -0.01;
        this.jumpStrength = 0.2;
        this.groundLevel = 2;

        this.joystickActive = false;
        this.joystickCenter = new THREE.Vector2();
        this.joystickDirection = new THREE.Vector2();
        this.useJoystick = false; // Flag to track control mode

        this.setupJoystick();
        this.setupEventListeners();
        this.animate();
        this.init();
    }

    init() {
        this.createWalls();
        this.loadArtworks();
        this.setupEventListeners();
        this.animate();
    }

    createWalls() {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(this.gallerySize.width, this.gallerySize.depth), this.wallMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        this.scene.add(floor);
    
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(this.gallerySize.width, this.gallerySize.height), this.wallMaterial);
        backWall.position.z = -this.gallerySize.depth / 2;
        backWall.position.y = this.gallerySize.height / 2;
        this.scene.add(backWall);
    
        const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(this.gallerySize.width, this.gallerySize.height), this.wallMaterial);
        frontWall.position.z = this.gallerySize.depth / 2;
        frontWall.position.y = this .gallerySize.height / 2;
        this.scene.add(frontWall);
    
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(this.gallerySize.depth, this.gallerySize.height), this.wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.x = -this.gallerySize.width / 2;
        leftWall.position.y = this.gallerySize.height / 2;
        this.scene.add(leftWall);
    
        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(this.gallerySize.depth, this.gallerySize.height), this.wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.x = this.gallerySize.width / 2;
        rightWall.position.y = this.gallerySize.height / 2;
        this.scene.add(rightWall);

        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(this.gallerySize.width, this.gallerySize.depth), this.wallMaterial);
        ceiling.rotation.x = Math.PI / 2; 
        ceiling.position.y = this.gallerySize.height; 
        this.scene.add(ceiling);
    }

    loadArtworks() {
        const loader = new THREE.TextureLoader();
    
        this.artworks.forEach(art => {
            loader.load(art.file, (texture) => {
                const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
                const plane = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), material);
                plane.position.set(...art.position);
    
                if (art.position[2] === -this.gallerySize.depth / 2) {
                    plane.rotation.y = Math.PI;
                }
    
                this.scene.add(plane);
            });
        });
    }

    setupEventListeners() {
        window.addEventListener("keydown", (e) => {
            if (!this.blockerActive) {
                this.keys[e.key] = true;
            }
        });
        window.addEventListener("keyup", (e) => {
            if (!this.blockerActive) {
                this.keys[e.key] = false;
            }
        });
        window.addEventListener("resize", () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        document.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.enterPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
            if (this.isPointerLocked) {
                document.addEventListener('mousemove', this.onMouseMove.bind(this));
                document.getElementById('instructions').style.display = 'none';
                this.blockerActive = false; // Hide blocker
                document.getElementById('blocker').style.display = 'none';
            } else {
                document.removeEventListener('mousemove', this.onMouseMove.bind(this));
                this.blockerActive = true; // Show blocker
                document.getElementById('blocker').style.display = 'block';
                document.getElementById('instructions').style.display = '';
            }
        });

        window.addEventListener("keydown", (e) => {
            if (e.key === 'n') {
                this.nextTrack();
            } else if (e.key === 'p') {
                this.previousTrack();
            }
        });

        const toggleButton = document.getElementById('control-toggle');
        toggleButton.addEventListener('click', () => {
            this.useJoystick = !this.useJoystick; // Toggle control mode
            toggleButton.textContent = this.useJoystick ? 'Switch to Keyboard Controls' : 'Switch to Joystick Controls';
            this.joystickDirection.set(0, 0); // Reset joystick direction
            document.getElementById('joystick').style.transform = 'translate(0, 0)'; // Reset joystick position
        });

        const instructions = document.getElementById('instructions');
        instructions.addEventListener('click', () => {
            this.enterPointerLock();
        });
    }

    nextTrack() {
        this.audioTracks[this.currentTrackIndex].pause();
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.audioTracks.length;
        this.audioTracks[this.currentTrackIndex].play();
    }

    previousTrack() {
        this.audioTracks[this.currentTrackIndex].pause();
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.audioTracks.length) % this.audioTracks.length;
        this.audioTracks[this.currentTrackIndex].play();
    }

    enterPointerLock() {
        this.renderer.domElement.requestPointerLock();
    }

    onMouseMove(event) {
        if (!this.isPointerLocked) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        this.yaw -= movementX * 0.001; 
        this.pitch -= movementY * 0.001; 

        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

        const yawQuaternion = new THREE.Quaternion();
        yawQuaternion .setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        const pitchQuaternion = new THREE.Quaternion();
        pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);

        const combinedQuaternion = new THREE.Quaternion();
        combinedQuaternion.multiplyQuaternions(yawQuaternion, pitchQuaternion);
        this.camera.quaternion.copy(combinedQuaternion);
    }

    setupJoystick() {
        const joystick = document.getElementById('joystick');
        joystick.addEventListener('touchstart', (e) => {
            if (this.useJoystick) {
                this.joystickActive = true;
                this.joystickCenter.set(e.touches[0].clientX, e.touches[0].clientY);
                joystick.style.transition = 'none'; // Disable transition for smooth movement
            }
        });

        joystick.addEventListener('touchmove', (e) => {
            if (this.joystickActive) {
                const touch = e.touches[0];
                const dx = touch.clientX - this.joystickCenter.x;
                const dy = touch.clientY - this.joystickCenter.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 40; // Max joystick distance

                if (distance > maxDistance) {
                    const angle = Math.atan2(dy, dx);
                    this.joystickDirection.set(Math.cos(angle), Math.sin(angle)).multiplyScalar(maxDistance);
                } else {
                    this.joystickDirection.set(dx, dy);
                }

                joystick.style.transform = `translate(${this.joystickDirection.x}px, ${this.joystickDirection.y}px)`;
            }
        });

        joystick.addEventListener('touchend', () => {
            this.joystickActive = false;
            this.joystickDirection.set(0, 0);
            joystick.style.transform = 'translate(0, 0)';
        });
    }

    handleControls() {
        if (this.blockerActive) return; // Prevent controls if blocker is active

        const speed = this.keys["Shift"] ? 0.2 : 0.1; 
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0; 
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // Keyboard controls
        if (!this.useJoystick) {
            if (this.keys["w"]) this.camera.position.add(forward.clone().multiplyScalar(speed));
            if (this.keys["s"]) this.camera.position.add(forward.clone().negate().multiplyScalar(speed));
            if (this.keys["a"]) this.camera.position.add(right.clone().negate().multiplyScalar(speed));
            if (this.keys["d"]) this.camera.position.add(right.clone().multiplyScalar(speed));
            if (this.keys[" "] && !this.isJumping) {
                this.isJumping = true;
                this.verticalVelocity = this.jumpStrength; 
            }
        } else {
            // Joystick controls
            if (this.joystickActive) {
                const joystickForward = new THREE.Vector3(this.joystickDirection.x, 0, this.joystickDirection.y).normalize();
                this.camera.position.add(joystickForward.multiplyScalar(speed * 0.5)); // Adjust speed for joystick
            }
        }

        if (this.isJumping) {
            this.verticalVelocity += this.gravity;
            this.camera.position.y += this.verticalVelocity;

            if (this.camera.position.y <= this.groundLevel) {
                this.camera.position.y = this.groundLevel;
                this.isJumping = false;
                this.verticalVelocity = 0; 
            }
        }

        this.checkCollision();
    }
    
    checkCollision() {
        const halfWidth = this.gallerySize.width / 2;
        const halfDepth = this.gallerySize.depth / 2;

        if (this.camera.position.x < -halfWidth || this.camera.position.x > halfWidth ||
            this.camera.position.z < -halfDepth || this.camera.position.z > halfDepth) {
            
            this.camera.position.copy(this.spawnPoint);
        }
    }

    animate() {
        this.handleControls();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}

const gallery = new Gallery();