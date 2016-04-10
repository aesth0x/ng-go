/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Yongsheng Li
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {Component, OnInit, OnDestroy, ElementRef} from 'angular2/core';
import {GoService} from './go.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
    selector: 'ng-board3d',
    template: '',
    host: {'(mousedown)': 'onMousedown($event)',
           '(mouseup)': 'onMouseup($event)',
           '(mousemove)': 'onMousemove($event)'}
})
export class Board3dComponent implements OnInit, OnDestroy {
    
    dim = 19;                       // board dimension
    radius = 1.5 * (19 + 1);        // distance from camera to center (0, 0, 0)
    size = 600;                     // canvas size
    turn: number = 0;               // 1: black; -1: white; 0: empty
    active: boolean = false;        // freeze the board if inactive
    
    meshes;                         // all meshes
    raycasterForClick;              // raycaster for mousedown and mouseup
    raycasterForMove;               // raycaster for mousemove
    mouseForClick;                  // mouse for mousedown and mouseup
    mouseForMove;                   // mouse for mousemove
    camera;                         // camera
    scene;                          // scene
    renderer;                       // renderer
    orbit;                          // controls
    ambientLight;                   // ambientLight
    lights;                         // lights
    stoneGeometry;                  // stone geometry
    gobanMaterial;                  // goban material
    blackMaterial;                  // black materal, for lines and stars
    starGeometry;                   // star geometry
    
    intersectTemp;                  // record the last intersected stone
    
    el;                             // native element
   
    coreSubscription: Subscription; // listen to data from <core>

    constructor(private elementRef: ElementRef, private goService: GoService) {
        this.el = elementRef.nativeElement;
        this.prep();
        this.init();
        this.render();    
    }

    ngOnInit() {
        this.coreSubscription = this.goService.core2board$.subscribe(data => {
            console.log("core2board data: " + JSON.stringify(data));
            this.processData(data);
        });
    }

    ngOnDestroy() {
        this.coreSubscription.unsubscribe();
    }
    
    /**
     * Prepare for objects that will not be recreated upon rerendering.
     */
    prep() {
        // renderer
        this.renderer = new THREE.WebGLRenderer({antialiasing: true, alpha: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.size, this.size);
        this.el.appendChild(this.renderer.domElement);
        // camera 
        this.camera = new THREE.PerspectiveCamera(50, 1, 1, 10000);
        // conrols
        this.orbit = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.orbit.enableZoom = true;
        this.orbit.minDistance = this.radius / 3;
        this.orbit.maxDistance = this.radius * 3;
        this.orbit.enablePan = false;
        this.orbit.enableDamping = true;
        this.orbit.rotateSpeed = 0.2;
        this.orbit.dampingFactor = 0.15;
        // raycast and mouse
        this.raycasterForClick = new THREE.Raycaster();
        this.raycasterForMove = new THREE.Raycaster();
        this.mouseForClick = new THREE.Vector2();
        this.mouseForMove = new THREE.Vector2();
        // lights
        this.ambientLight = new THREE.AmbientLight(0x404040);
        this.lights = [];
        this.lights[0] = new THREE.PointLight(0xffffff, 1, 0);
        this.lights[1] = new THREE.PointLight(0xffffff, 1, 0);
        this.lights[0].position.set(150, 200, 100);
        this.lights[1].position.set(-150, -200, 100);
        // geometry and material
        this.stoneGeometry = new THREE.SphereGeometry(0.48, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        let textureLoader = new THREE.TextureLoader();
        this.gobanMaterial = new THREE.MeshPhongMaterial({
            map: textureLoader.load('images/wood-min.jpg'),
            emissive: 0x000000,
            side: THREE.DoubleSide,
            shading: THREE.SmoothShading
        });
        this.blackMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, 
            side: THREE.DoubleSide,
            shading: THREE.SmoothShading
        });
        this.starGeometry = new THREE.CircleGeometry(0.12, 32);
    }
    
    /**
     * Initialize the scene.
     */
    init() {
        this.active = false;
        this.turn = 0;
        // camera and orbit
        this.camera.position.set(this.radius / 1.732, -this.radius / 1.732, this.radius / 1.732);
        this.orbit.minDistance = this.radius / 3;
        this.orbit.maxDistance = this.radius * 3;
        this.orbit.update();
        // scene
        this.scene = new THREE.Scene();
        // add lights to scene
        this.scene.add(this.ambientLight);
        for (let i = 0; i < this.lights.length; i++) {
            this.scene.add(this.lights[i]);
        }
        // clear meshes
        this.meshes = [];
        // create & add stone meshes to scene
        for (let i = 0; i < this.dim; i++) {
            for (let j = 0; j < this.dim; j++) {
                let stoneMaterial = new THREE.MeshPhongMaterial({
					color: 0xffffff,
					emissive: 0x000000,
                    specular: 0x808080,
                    shininess: 10,
					side: THREE.DoubleSide,
					shading: THREE.SmoothShading,
                    transparent: true,
                    opacity: 0
				});
                let stoneMesh = new THREE.Mesh(this.stoneGeometry, stoneMaterial);
                stoneMesh.rotation.x = Math.PI / 2;
                stoneMesh.position.x = i - (this.dim - 1) / 2;
                stoneMesh.position.y = - j + (this.dim - 1) / 2;
                stoneMesh.position.z = 0;
                stoneMesh.index = [i, j];
                this.meshes.push(stoneMesh);
                this.scene.add(stoneMesh);          
            }
        }
        // create & add goban mesh to scene
        let gobanGeometry = new THREE.BoxGeometry(this.dim + 1, this.dim + 1, (this.dim + 1) / 10);   
        let gobanMesh = new THREE.Mesh(gobanGeometry, this.gobanMaterial);
        gobanMesh.position.z = -(this.dim + 1) / 20;
        this.meshes.push(gobanMesh);
        this.scene.add(gobanMesh);
        // create & add line meshes to scene
        let lineGeometryHorizontal = new THREE.PlaneGeometry(this.dim - 1 + 0.05, 0.05);        
        let lineGeometryVertical = new THREE.PlaneGeometry(0.05, this.dim - 1 + 0.05);
        for (let i = 0; i < this.dim; i++) {
            let lineMeshHorizontal = new THREE.Mesh(lineGeometryHorizontal, this.blackMaterial);
            lineMeshHorizontal.position.y = i - (this.dim - 1) / 2;
            lineMeshHorizontal.position.z = 0.01;
            let lineMeshVertical = new THREE.Mesh(lineGeometryVertical, this.blackMaterial);
            lineMeshVertical.position.x = i - (this.dim - 1) / 2;
            lineMeshVertical.position.z = 0.01;            
            this.scene.add(lineMeshHorizontal);
            this.scene.add(lineMeshVertical);
        }
        // create & add star meshes to scene
        let starMeshes = this.getStars(this.dim);
        for (let i = 0; i < starMeshes.length; i++) {
            this.scene.add(starMeshes[i]);
        }
    }

    /**
     * Render the scene.
     */
    render() {
        requestAnimationFrame(this.render.bind(this));
        this.orbit.update();
        this.renderer.render(this.scene, this.camera);  
    }

    /**
     * Helper to get circles of the board stars.
     * @param dim: dimension
     */        
    getStars(dim: number) {
        let starMeshes = [];
        if (dim == 9) {
            let starMesh = new THREE.Mesh(this.starGeometry, this.blackMaterial);
            starMesh.position.x = 0;
            starMesh.position.y = 0;                    
            starMesh.position.z = 0.01;
            starMeshes.push(starMesh);    
        } else if (dim == 13) {
            let coordinates = [-3, 3];
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    let starMesh = new THREE.Mesh(this.starGeometry, this.blackMaterial);
                    starMesh.position.x = coordinates[i];
                    starMesh.position.y = coordinates[j];                    
                    starMesh.position.z = 0.01;
                    starMeshes.push(starMesh);
                }
            }            
        } else if (dim == 19) {
            let coordinates = [-6, 0, 6];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    let starMesh = new THREE.Mesh(this.starGeometry, this.blackMaterial);
                    starMesh.position.x = coordinates[i];
                    starMesh.position.y = coordinates[j];                    
                    starMesh.position.z = 0.01;
                    starMeshes.push(starMesh);
                }
            }
        }
        return starMeshes;
    }
    
    /**
     * Record the mouse coordinates on mouse down.
     * @param $event: DOM event
     */
    onMousedown($event) {
        if (!this.active) return;
        this.mouseForClick.x = ($event.offsetX / this.size) * 2 - 1;
        this.mouseForClick.y = - ($event.offsetY / this.size) * 2 + 1;
    }
    
    /**
     * If the mouse doesn't move during the click, add a stone to DOM if playable; a request will be sent.
     * @param $event: dom event
     */
    onMouseup($event) {
        if (!this.active) return;
        if (!this.mouseForClick.x || !this.mouseForClick.y 
            || this.mouseForClick.x != ($event.offsetX / this.size) * 2 - 1
            || this.mouseForClick.y != -($event.offsetY / this.size) * 2 + 1) return;
        this.raycasterForClick.setFromCamera(this.mouseForClick, this.camera);
        let intersects = this.raycasterForClick.intersectObjects(this.meshes);
        if (intersects.length > 0 && intersects[0].object.index) {
            console.log(intersects[0].object.index);
            let data = {
                method: "MOVE",
                body :{
                    x: intersects[0].object.index[0],
                    y: intersects[0].object.index[1]
                }
            };
            this.goService.board2core(data);
            
        }
    }
    
    /**
     * On mouse over, showcast the next move.
     * @param $event: DOM event
     */
    onMousemove($event) {
        if (!this.active) return;
        this.mouseForMove.x = ($event.offsetX / this.size) * 2 - 1;
        this.mouseForMove.y = - ($event.offsetY / this.size) * 2 + 1;
        this.raycasterForMove.setFromCamera(this.mouseForMove, this.camera);
        let intersects = this.raycasterForMove.intersectObjects(this.meshes);
        if (!intersects.length || !intersects[0].object.index) {
            if (this.intersectTemp && this.intersectTemp.material.opacity != 1) {
                this.intersectTemp.material.opacity = 0;
                this.intersectTemp = null;
            }
        }
        else if (intersects[0].object.material.opacity != 1) {
            if (this.intersectTemp && this.intersectTemp != intersects[0].object && this.intersectTemp.material.opacity != 1) {
                this.intersectTemp.material.opacity = 0;
            }
            this.intersectTemp = intersects[0].object;
            this.intersectTemp.material.color.setHex(this.turn == 1 ? 0x000000 : 0xffffff);
            this.intersectTemp.material.opacity = 0.3;
        }
    }
    
    /**
     * Process data from subscription.
     * @param data: {mothod; body}
     */ 
    processData(data) {
        switch(data.method) {
            case "INIT":
                this.dim = data.body.dim;
                this.radius = 1.5 * (this.dim + 1);
                this.init();
                this.turn = data.body.turn;
                this.active = true;
                break;
            case "RESET":
                this.init();
                break;
            case "MOVERESP":
                for(let i = 0; i < data.body.add.length; i++) {
                    if (data.body.add[i].c == 1) {
                        this.meshes[this.dim * data.body.add[i].x + data.body.add[i].y].material.color.setHex(0x000000);
                    } else {
                        this.meshes[this.dim * data.body.add[i].x + data.body.add[i].y].material.color.setHex(0xffffff);
                    }
                    this.meshes[this.dim * data.body.add[i].x + data.body.add[i].y].material.opacity = 1;
                }
                for(let i = 0; i < data.body.remove.length; i++) {
                    this.meshes[this.dim * data.body.remove[i].x + data.body.remove[i].y].material.opacity = 0;
                }
                this.turn = data.body.turn;
                break;
        }
    }
}

