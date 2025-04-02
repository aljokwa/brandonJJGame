// Game constants
const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
const PLAYER_SPEED = 0.1;
const BULLET_SPEED = 0.5;
const EGG_SPEED = 0.3;
const CHICKEN_SPEED = 0.05;

// Initialize Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Darker background

const camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Darker ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Stronger directional light
directionalLight.position.set(5, 8, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Add ground plane
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x2a2a2a, // Darker ground
    side: THREE.DoubleSide,
    shininess: 0
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2;
ground.receiveShadow = true;
scene.add(ground);

// Add fog for depth
scene.fog = new THREE.Fog(0x1a1a1a, 20, 50);

// Game objects
class Player {
    constructor(x, z, name) {
        this.name = name;
        this.health = 100;
        this.score = 0;
        this.position = new THREE.Vector3(x, 1, z);
        this.bullets = [];
        this.reloadTime = 0;
        this.reloadDelay = 500;
        
        // Create player mesh with darker colors
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshPhongMaterial({
            color: name === "Brandon" ? 0x000066 : 0x006600, // Darker blue and green
            shininess: 30
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }

    move(direction) {
        this.position.add(direction.multiplyScalar(PLAYER_SPEED));
        this.mesh.position.copy(this.position);
    }

    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.reloadTime > this.reloadDelay) {
            const bullet = new Bullet(
                this.position.x,
                this.position.y + 1,
                this.position.z,
                this.name
            );
            this.bullets.push(bullet);
            this.reloadTime = currentTime;
        }
    }

    update() {
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update();
            if (bullet.position.y > 10) {
                scene.remove(bullet.mesh);
                this.bullets.splice(i, 1);
            }
        }
    }
}

class Bullet {
    constructor(x, y, z, playerName) {
        this.position = new THREE.Vector3(x, y, z);
        this.playerName = playerName;
        
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshPhongMaterial({
            color: playerName === "Brandon" ? 0x0000ff : 0x00ff00,
            shininess: 100,
            emissive: playerName === "Brandon" ? 0x000066 : 0x006600,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        scene.add(this.mesh);
    }

    update() {
        this.position.y += BULLET_SPEED;
        this.mesh.position.copy(this.position);
    }
}

class GiantChicken {
    constructor() {
        this.position = new THREE.Vector3(0, 5, 0);
        this.health = 200;
        this.attackPattern = 0;
        this.attackTimer = 0;
        this.eggs = [];
        
        // Create chicken body with darker colors
        const bodyGeometry = new THREE.SphereGeometry(2, 16, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcc9900, // Darker yellow
            shininess: 30
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.copy(this.position);
        this.body.castShadow = true;
        this.body.receiveShadow = true;
        scene.add(this.body);
        
        // Create beak with darker color
        const beakGeometry = new THREE.ConeGeometry(0.3, 1, 8);
        const beakMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcc6600, // Darker orange
            shininess: 30
        });
        this.beak = new THREE.Mesh(beakGeometry, beakMaterial);
        this.beak.position.set(this.position.x + 2, this.position.y, this.position.z);
        this.beak.rotation.y = Math.PI / 2;
        this.beak.castShadow = true;
        scene.add(this.beak);
    }

    move() {
        this.position.x = Math.sin(Date.now() / 1000) * 5;
        this.body.position.copy(this.position);
        this.beak.position.x = this.position.x + 2;
    }

    attack() {
        if (Date.now() - this.attackTimer > 2000) {
            this.attackPattern = (this.attackPattern + 1) % 3;
            this.attackTimer = Date.now();
            
            if (this.attackPattern === 0) {
                this.eggs.push(new Egg(this.position.x, this.position.y - 2, this.position.z));
            } else if (this.attackPattern === 1) {
                this.health = Math.min(200, this.health + 5);
            } else {
                this.eggs.push(new Egg(this.position.x - 2, this.position.y - 2, this.position.z));
                this.eggs.push(new Egg(this.position.x + 2, this.position.y - 2, this.position.z));
            }
        }
    }

    update() {
        this.move();
        this.attack();
        
        // Update eggs
        for (let i = this.eggs.length - 1; i >= 0; i--) {
            const egg = this.eggs[i];
            egg.update();
            if (egg.position.y < -10) {
                scene.remove(egg.mesh);
                this.eggs.splice(i, 1);
            }
        }
    }
}

class Egg {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, // Darker white
            shininess: 30
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        scene.add(this.mesh);
    }

    update() {
        this.position.y -= EGG_SPEED;
        this.mesh.position.copy(this.position);
    }
}

// Create game objects
const brandon = new Player(-5, 0, "Brandon");
const jj = new Player(5, 0, "JJ");
const alec = new GiantChicken();

// Set up camera
camera.position.set(0, 20, 25);
camera.lookAt(0, 0, 0);

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Game loop
function animate() {
    requestAnimationFrame(animate);

    // Player movement
    const moveDirection = new THREE.Vector3();
    if (keys['w']) moveDirection.z -= 1;
    if (keys['s']) moveDirection.z += 1;
    if (keys['a']) moveDirection.x -= 1;
    if (keys['d']) moveDirection.x += 1;
    if (keys[' ']) brandon.shoot();
    if (keys['Enter']) jj.shoot();

    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        brandon.move(moveDirection);
        jj.move(moveDirection);
    }

    // Update game objects
    brandon.update();
    jj.update();
    alec.update();

    // Check collisions
    checkCollisions();

    // Update UI
    updateUI();

    renderer.render(scene, camera);
}

function checkCollisions() {
    // Check bullet collisions with chicken
    [brandon, jj].forEach(player => {
        player.bullets.forEach(bullet => {
            const distance = bullet.position.distanceTo(alec.position);
            if (distance < 3) {
                alec.health -= 10;
                player.score += 10;
                scene.remove(bullet.mesh);
                player.bullets = player.bullets.filter(b => b !== bullet);
            }
        });
    });

    // Check egg collisions with players
    alec.eggs.forEach(egg => {
        [brandon, jj].forEach(player => {
            const distance = egg.position.distanceTo(player.position);
            if (distance < 1.5) {
                player.health -= 20;
                scene.remove(egg.mesh);
                alec.eggs = alec.eggs.filter(e => e !== egg);
            }
        });
    });
}

function updateUI() {
    document.getElementById('score').textContent = 
        `Brandon: ${brandon.score} | JJ: ${jj.score}`;
    document.getElementById('health').textContent = 
        `Health: ${brandon.health} | ${jj.health}`;
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game
animate(); 