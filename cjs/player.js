import * as THREE from 'three';

class Player {
    constructor() {
        this.balance = this.loadBalance();
        this.currentBet = 10;
        this.mesh = null;
        this.body = null;
    }

    loadBalance() {
        const saved = localStorage.getItem('maya_balance');
        return saved ? parseInt(saved) : 100;
    }

    saveBalance() {
        localStorage.setItem('maya_balance', this.balance.toString());
    }

    addBalance(amount) {
        this.balance += amount;
        this.saveBalance();
        this.updateDisplay();
    }

    subtractBalance(amount) {
        if (this.balance >= amount) {
            this.balance -= amount;
            this.saveBalance();
            this.updateDisplay();
            return true;
        }
        return false;
    }

    updateDisplay() {
        const bal = document.getElementById('balance');
        const gameBal = document.getElementById('hudBalance');
        const uiBal = document.getElementById('uiBalance');
        if (bal) bal.textContent = this.balance + ' Ꚛ';
        if (gameBal) gameBal.textContent = this.balance;
        if (uiBal) uiBal.textContent = this.balance;
    }

    setBet(amount) {
        if (amount >= 10 && amount <= this.balance) {
            this.currentBet = amount;
        }
    }

    getBet() {
        return this.currentBet;
    }

    createMesh() {
        const group = new THREE.Group();

        const bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3e });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.35;
        body.castShadow = true;
        group.add(body);

        const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.82;
        head.castShadow = true;
        group.add(head);

        const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.08, 0.85, 0.18);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.08, 0.85, 0.18);
        group.add(rightEye);

        const armGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3e });
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.35, 0.35, 0);
        leftArm.castShadow = true;
        group.add(leftArm);
        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.35, 0.35, 0);
        rightArm.castShadow = true;
        group.add(rightArm);

        const legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.13, -0.15, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.13, -0.15, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);

        this.mesh = group;
        return group;
    }
}

export const player = new Player();