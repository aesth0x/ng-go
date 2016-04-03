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

import {Component, Input, SimpleChange, OnInit, OnDestroy} from 'angular2/core';
import {GoService} from './go.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
    selector: 'ng-core',
    template: ''
})

export class CoreComponent implements OnInit, OnDestroy {
    
    dim: number = 19;                       // dimension
    grid: number[][] = this.createGrid(19); // grid
    handicaps: number = 0;                  // handicaps
    mode: number = 0;                       // 1: play; 2: record; 3: testPlay
    
    steps: number = 0;                      // step count
    turn: number = 0;                       // 1: black; -1: white
    history: {add;remove;turn}[] = [];      // move history
    testHistory: {add;remove;turn}[] = [];  // move history for test play
    
    black: string = "";                     // TODO
    white: string = "";                     // TODO

    configSubscription: Subscription;       // listen to data from <config>
    controlSubscription: Subscription;      // listen to data from <control>
    boardSubscription: Subscription;        // listen to data from <board>

    constructor(private goService: GoService) {}
    
    ngOnInit():void {
        this.configSubscription = this.goService.config2core$.subscribe(data => {
            console.log("config2core data: " + JSON.stringify(data));
            this.processData(data);
        });  
        this.boardSubscription = this.goService.control2core$.subscribe(data=> {
            console.log("control2core data: " + JSON.stringify(data));
            this.processData(data);
        });
        this.boardSubscription = this.goService.board2core$.subscribe(data => {
            console.log("board2core data: " + JSON.stringify(data));
            this.processData(data);
        });
    }
    
    ngOnDestroy() {
        this.configSubscription.unsubscribe();
        this.controlSubscription.unsubscribe();
        this.boardSubscription.unsubscribe();
    }

    /**
     * Rest core to default.
     */      
    resetCore(): void {
        this.mode = 0;
        this.black = "";
        this.white = "";
        this.steps = 0;
        this.handicaps = 0;
        this.turn = 0;
        this.history = [];
        this.grid = this.createGrid(this.dim);
    }
    
    /**
     * Check if a position is playable by a color.
     * @param x: x coordinate
     * @param y: y coordinate
     * @param c: color
     */      
    isPlayable(x: number, y: number, c: number): boolean {
        if (this.grid[x][y] != 0) {
            return false;
        }
        this.grid[x][y] = c;
        if (this.countLiberties(x, y) > 0) {
            this.grid[x][y] = 0;
            return true;
        }
        let neighborGroups = this.getNeighbors(x, y);
        for (let i = 0; i < neighborGroups.length; i++) {
            if (this.countGroupLiberties(neighborGroups[i]) == 0) {
                this.grid[x][y] = 0;
                return true;               
            }
        }     
        this.grid[x][y] = 0;
        return false;
    }
    
    /**
     * Count the liberties of a group where the input position resides.
     * @param x: x coordinate
     * @param y: y coordinate
     */      
    countLiberties(x: number, y: number): number {
        let group = this.getSelfGroup(x, y);
        return this.countGroupLiberties(group);
    }
    
    /**
     * Count the liberties of a group.
     * @param group: a group of stones
     */      
    countGroupLiberties(group): number {
        let explore = {};
        for(let prop in group) {
            if(group.hasOwnProperty(prop)) {
                explore[prop] = true;
            }
        }
        let liberties = {};
        while (!this.isEmpty(explore)) {
            let str = this.getFirst(explore);
            let pos = this.str2pos(str);
            let adjacent = [{x: pos.x - 1, y: pos.y}, {x: pos.x + 1, y: pos.y},
                {x: pos.x, y: pos.y + 1}, {x: pos.x, y: pos.y - 1}];
            delete explore[str];
            for (let i = 0; i < 4; i++) {
                let currStr = this.pos2str(adjacent[i]);
                let currX = adjacent[i].x;
                let currY = adjacent[i].y;
                if (this.isOnBoard(currX, currY) && this.grid[currX][currY] == 0
                    && !liberties[currStr]) {
                        liberties[currStr] = true;
                    }
            }
        }
        return this.getLength(liberties);
    }

    /**
     * Get an array of groups which are input position's group's neighbors.
     * @param x: x coordinate
     * @param y: y coordinate
     */     
    getNeighbors(x: number, y: number): {[strName: string]: boolean}[] {
        let color = this.grid[x][y];       
        let group = this.getSelfGroup(x, y);
        let neighborStones = {};
        let neighborGroups = [];
        while (!this.isEmpty(group)) {
            let str = this.getFirst(group);
            let pos = this.str2pos(str);
            let adjacent = [{x: pos.x - 1, y: pos.y}, {x: pos.x + 1, y: pos.y},
                {x: pos.x, y: pos.y + 1}, {x: pos.x, y: pos.y - 1}];
            delete group[str];
            for (let i = 0; i < 4; i++) {
                let currStr = this.pos2str(adjacent[i]);
                let currX = adjacent[i].x;
                let currY = adjacent[i].y;
                if (this.isOnBoard(currX, currY) && this.grid[currX][currY] == -color
                    && !neighborStones[currStr]) {
                        neighborStones[currStr] = true;
                    }
            }
        }
        while (!this.isEmpty(neighborStones)) {
            let str = this.getFirst(neighborStones);
            let pos = this.str2pos(str);
            let neighborGroup = this.getSelfGroup(pos.x, pos.y);
            for(let prop in neighborGroup) {
                if(neighborGroup.hasOwnProperty(prop)) {
                    delete neighborStones[prop];
                }
            }      
            neighborGroups.push(neighborGroup);      
        }    
        return neighborGroups;
    }
    
    /**
     * Get the group where the input position resides.
     * @param x: x coordinate
     * @param y: y coordinate
     */     
    getSelfGroup(x: number, y: number): {[strName: string]: boolean} {
        let color = this.grid[x][y];
        let explore = {};
        let visited: {[strName: string]: boolean} = {};
        explore[this.xy2str(x, y)] = true;
        while (!this.isEmpty(explore)) {
            let str = this.getFirst(explore);
            let pos = this.str2pos(str);
            let adjacent = [{x: pos.x - 1, y: pos.y}, {x: pos.x + 1, y: pos.y},
                {x: pos.x, y: pos.y + 1}, {x: pos.x, y: pos.y - 1}];
            visited[str] = true;
            delete explore[str];
            for (let i = 0; i < 4; i++) {
                let currStr = this.pos2str(adjacent[i]);
                let currX = adjacent[i].x;
                let currY = adjacent[i].y;
                if (this.isOnBoard(currX, currY) && this.grid[currX][currY] == color
                    && !visited[currStr] && !explore[currStr]) {
                        explore[currStr] = true;
                    }
            }
        }
        return visited;
    }
    
    /**
     * Remove all stones in the input group.
     * @param group: a group of stones
     */   
    removeGroup(group): void {
        for(let prop in group) {
            if(group.hasOwnProperty(prop)) {
                let pos = this.str2pos(prop);
                this.grid[pos.x][pos.y] = 0;
            }
        }         
    }
 
    /**
     * Check if a position is on the board.
     * @param x: x coordinate
     * @param y: y coordinate
     */   
    isOnBoard(x: number, y: number): boolean {
        if (x >= this.dim || y >= this.dim || x < 0 || y < 0) return false;
        return true;
    }
    
    /**
     * Helper to get the first key of an object, return null if empty.
     * @param obj: object
     */    
    getFirst(obj): string {
        for(let prop in obj) {
            if(obj.hasOwnProperty(prop)) {
                return prop;
            }
        }
        return null;
    }

    /**
     * Helper to check if an object is empty.
     * @param obj: object
     */
    isEmpty(obj): boolean {
        for(let prop in obj) {
            if(obj.hasOwnProperty(prop)) return false;
        }
        return true && JSON.stringify(obj) === JSON.stringify({});
    }
    
    /**
     * Helper to get the length of an object.
     * @param obj: object
     */
    getLength(obj): number {
        let length = 0;
        for(let prop in obj) {
            if(obj.hasOwnProperty(prop)) length++;
        }
        return length;
    }

    /**
     * Helper to stringify an x, y position (<e.g.> x = 1, y = 2) to a string (<e.g.> "1,2").
     * @param x: x coordinate
     * @param y: y coordinate
     */
    xy2str(x: number, y: number): string {
        return x + "," + y; 
    }
        
    /**
     * Helper to stringify a poisition object (<e.g.> {x: 1, y: 2}) to a string (<e.g.> "1,2").
     * @param pos: a position object
     */
    pos2str(pos): string {
        return pos.x + "," + pos.y; 
    }
    
    /**
     * Helper to de-stringify a string (<e.g.> "1,2") to a poisition object (<e.g.> {x: 1, y: 2}).
     * @param str: string representation of a position object
     */
    str2pos(str: string): {x: number; y: number;} {
        let res = str.split(",");
        return {x: parseInt(res[0]), y: parseInt(res[1])};
    }
    
    /**
     * Helper to generate a dim*dim 2D array.
     * @param dim: dimension
     */
    createGrid(dim: number): number[][] {
        let board = [];
        for (let i = 0; i < dim; i++) {
            board[i] = [];
            for (let j = 0; j < dim; j++) {
                board[i][j] = 0;
            }
        }
        return board;
    }
    
    /**
     * Add a stone to DOM and update core if playable, a MOVERESP is sent.
     * @param x: x coordinate
     * @param y: y coordinate
     */
    move(x: number, y: number): void {
        if(this.isPlayable(x, y, this.turn)) {
            let data = {
                method: "MOVERESP",
                body: {
                    add: [{x: x, y: y, c: this.turn}],
                    remove: [],
                    turn: null
                }
            };               
            this.grid[x][y] = this.turn;
            let neighborGroups = this.getNeighbors(x, y);
            for (let i = 0; i < neighborGroups.length; i++) {
                if (this.countGroupLiberties(neighborGroups[i]) == 0) {
                    for(let prop in neighborGroups[i]) {
                        if(neighborGroups[i].hasOwnProperty(prop)) {
                            let pos = this.str2pos(prop);
                            this.grid[pos.x][pos.y] = 0;
                            data.body.remove.push({x: pos.x, y:pos.y, c: -this.turn});
                        }
                    } 
                }
            }
            this.steps += 1;          
            this.turn = this.steps >= this.handicaps ? -this.turn : this.turn;    
            data.body.turn = this.turn;
            if(this.mode == 1 || this.mode == 2) {
                this.history.push(data.body);
            } else if(this.mode == 3) {
                this.testHistory.push(data.body);
            }
            this.goService.core2board(data);
        }
    }
    
    /**
     * Remove the last stone from DOM and update core if playable, a MOVERESP is sent.
     * @param x: x coordinate
     * @param y: y coordinate
     */    
    regret() {
        let last;
        if(this.mode == 1) {
            last = this.history.pop();
        } else if(this.mode == 3) {
            last = this.testHistory.pop();
        }
        for (let i = 0; i < last.add.length; i++) {
            this.grid[last.add[i].x][last.add[i].y] = 0;
        }
        for (let i = 0; i < last.remove.length; i++) {
            this.grid[last.remove[i].x][last.remove[i].y] = last.remove[i].c;
        }
        let data = {
            method: "MOVERESP",
            body: {
                add: last.remove,
                remove: last.add,
                turn: this.steps >= this.handicaps ? -last.turn : last.turn
            }
        };
        this.turn = this.steps >= this.handicaps ? -last.turn : last.turn;
        this.steps -= 1;
        this.goService.core2board(data); 
    }
    
    /**
     * Process data from subscription.
     * @param data: {mothod; body}
     */    
    processData(data) {
        switch(data.method) {
            case "INIT":
                this.dim = data.body.dim;
                this.grid = this.createGrid(data.body.dim);
                this.mode = data.body.mode;
                this.handicaps = data.body.handicaps;
                this.black = data.body.black;
                this.white = data.body.white;
                this.turn = 1;
                data = {
                    method: "INIT",
                    body: {
                        dim: this.dim,
                        turn: 1
                    }
                };
                this.goService.core2board(data);
                break;
            case "RESET":
                this.resetCore();
                data = {
                    method: "RESET",
                    body: {}
                }
                this.goService.core2board(data);
                break;
            case "MOVE":
                if(this.mode == 1 || this.mode == 3) {
                    this.move(data.body.x, data.body.y);
                }
                break;
            case "MOVE2":
                if(this.mode == 2) {
                    this.move(data.body.x, data.body.y);
                }
                break;
            case "FORWARD":
                if(this.mode == 2 && this.steps < this.history.length) {
                    let next = this.history[this.steps];
                    for(let i = 0; i < next.add.length; i++) {
                        this.grid[next.add[i].x][next.add[i].y] = next.add[i].c;
                    }
                    for(let i = 0; i < next.remove.length; i++) {
                        this.grid[next.remove[i].x][next.remove[i].y] = 0;
                    }
                    let data = {
                        method: "MOVERESP",
                        body: next
                    };
                    this.steps += 1;
                    this.turn = this.steps >= this.handicaps ? -this.turn : this.turn;
                    this.goService.core2board(data);  
                }
                break;
            case "BACKWARD":
                if(this.mode == 2 && this.steps > 0) {
                    let prev = this.history[this.steps - 1];
                    for (let i = 0; i < prev.add.length; i++) {
                        this.grid[prev.add[i].x][prev.add[i].y] = 0;
                    }
                    for (let i = 0; i < prev.remove.length; i++) {
                        this.grid[prev.remove[i].x][prev.remove[i].y] = prev.remove[i].c;
                    }
                    let data = {
                        method: "MOVERESP",
                        body: {
                            add: prev.remove,
                            remove: prev.add,
                            turn: this.steps >= this.handicaps ? -prev.turn : prev.turn
                        }
                    };
                    this.turn = this.steps >= this.handicaps ? -prev.turn : prev.turn;
                    this.steps -= 1;
                    this.goService.core2board(data);
                }
                break;
            case "REGRET":
                if(this.mode == 1 && this.steps > 0) {
                    this.regret();
                }
                break;
            case "STARTTEST":
                if(this.mode == 2) {
                    this.testHistory = [];
                    this.mode = 3;
                }
                break;
            case "ENDTEST":
                if(this.mode == 3) {
                    while(this.testHistory.length > 0) {
                        this.regret();
                    }
                    this.mode = 2;
                }
                break;
                
        }
    }  
}