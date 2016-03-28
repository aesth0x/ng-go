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

import {Component, Input, SimpleChange, OnChanges, AfterViewChecked} from 'angular2/core';

@Component({
    selector: 'ago-game',
    templateUrl: 'app/game.template.html'
})


export class GameComponent implements OnChanges, AfterViewChecked{
    
    @Input() dim: number = 19;                  // board dimension
    @Input() active: boolean = true;            // freeze the board if inactive
    @Input() coordinate: boolean = true;        // show coordinate if true
    ready: boolean = true;                      // diable mouse actions if not ready (help to make mouse actions atomic)
    calcPos: number[][] = this.createBoard(19); // position for calculation
    dispPos: number[][] = this.createBoard(19); // position for display only, binded to svg
    turn: number = 1;                           // 1: black; -1: white; 0: empty
    lines = this.getLines(19);                  // lines for board grids
    stars = this.getStars(19);                  // circles for board stars
 
    /**
     * AfterViewChecked interface function; keep the mouseclick atomic.
     */       
    ngAfterViewChecked(): void {
        this.ready = true;
    }
    
    /**
     * OnChanges interface function.
     */       
    ngOnChanges(changes: {[propertyName: string]: SimpleChange}): void {
        for (let propName in changes) {
            if (propName === "dim") this.onDimChange();
            if (propName === "coordinate") this.onCoordinateChange();
        }
    }
    
    /**
     * Called when dim property is changed; reinitialize the game.
     */      
    onDimChange(): void {
        if (this.dim < 1 || this.dim > 26) this.dim = 19; // TODO
        this.ready = true;
        this.dispPos = this.createBoard(this.dim);
        this.calcPos = this.createBoard(this.dim);
        this.turn = 1;
        this.lines = this.getLines(this.dim);
        this.stars = this.getStars(this.dim);
    }
    
    /**
     * Called when coordinate property is changed; reinitialize the game.
     */      
    onCoordinateChange(): void {

    }

    /**
     * Check if a position is playable by a color.
     * @param x: x coordinate
     * @param y: y coordinate
     * @param c: color
     */      
    isPlayable(x: number, y: number, c: number): boolean {
        if (this.calcPos[x][y] != 0) {
            return false;
        }
        this.calcPos[x][y] = c;
        if (this.countLiberties(x, y) > 0) {
            this.calcPos[x][y] = 0;
            return true;
        }
        var neighborGroups = this.getNeighbors(x, y);
        for (var i = 0; i < neighborGroups.length; i++) {
            if (this.countGroupLiberties(neighborGroups[i]) == 0) {
                this.calcPos[x][y] = 0;
                return true;               
            }
        }     
        this.calcPos[x][y] = 0;
        return false;
    }
    
    /**
     * Count the liberties of a group where the input position resides.
     * @param x: x coordinate
     * @param y: y coordinate
     */      
    countLiberties(x: number, y: number): number {
        var group = this.getSelfGroup(x, y);
        return this.countGroupLiberties(group);
    }
    
    /**
     * Count the liberties of a group.
     * @param group: a group of stones
     */      
    countGroupLiberties(group): number {
        var explore = {};
        for(var prop in group) {
            if(group.hasOwnProperty(prop)) {
                explore[prop] = true;
            }
        }
        var liberties = {};
        while (!this.isEmpty(explore)) {
            var str = this.getFirst(explore);
            var pos = this.str2pos(str);
            var adjacent = [{x: pos.x - 1, y: pos.y}, {x: pos.x + 1, y: pos.y},
                {x: pos.x, y: pos.y + 1}, {x: pos.x, y: pos.y - 1}];
            delete explore[str];
            for (var i = 0; i < 4; i++) {
                var currStr = this.pos2str(adjacent[i]);
                var currX = adjacent[i].x;
                var currY = adjacent[i].y;
                if (this.isOnBoard(currX, currY) && this.calcPos[currX][currY] == 0
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
        var color = this.calcPos[x][y];       
        var group = this.getSelfGroup(x, y);
        var neighborStones = {};
        var neighborGroups = [];
        while (!this.isEmpty(group)) {
            var str = this.getFirst(group);
            var pos = this.str2pos(str);
            var adjacent = [{x: pos.x - 1, y: pos.y}, {x: pos.x + 1, y: pos.y},
                {x: pos.x, y: pos.y + 1}, {x: pos.x, y: pos.y - 1}];
            delete group[str];
            for (var i = 0; i < 4; i++) {
                var currStr = this.pos2str(adjacent[i]);
                var currX = adjacent[i].x;
                var currY = adjacent[i].y;
                if (this.isOnBoard(currX, currY) && this.calcPos[currX][currY] == -color
                    && !neighborStones[currStr]) {
                        neighborStones[currStr] = true;
                    }
            }
        }
        while (!this.isEmpty(neighborStones)) {
            var str = this.getFirst(neighborStones);
            var pos = this.str2pos(str);
            var neighborGroup = this.getSelfGroup(pos.x, pos.y);
            for(var prop in neighborGroup) {
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
        var color = this.calcPos[x][y];
        var explore = {};
        var visited: {[strName: string]: boolean} = {};
        explore[this.xy2str(x, y)] = true;
        while (!this.isEmpty(explore)) {
            var str = this.getFirst(explore);
            var pos = this.str2pos(str);
            var adjacent = [{x: pos.x - 1, y: pos.y}, {x: pos.x + 1, y: pos.y},
                {x: pos.x, y: pos.y + 1}, {x: pos.x, y: pos.y - 1}];
            visited[str] = true;
            delete explore[str];
            for (var i = 0; i < 4; i++) {
                var currStr = this.pos2str(adjacent[i]);
                var currX = adjacent[i].x;
                var currY = adjacent[i].y;
                if (this.isOnBoard(currX, currY) && this.calcPos[currX][currY] == color
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
        for(var prop in group) {
            if(group.hasOwnProperty(prop)) {
                var pos = this.str2pos(prop);
                this.calcPos[pos.x][pos.y] = 0;
                this.dispPos[pos.x][pos.y] = 0;

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
        for(var prop in obj) {
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
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop)) return false;
        }
        return true && JSON.stringify(obj) === JSON.stringify({});
    }
    
    /**
     * Helper to get the length of an object.
     * @param obj: object
     */
    getLength(obj): number {
        var length = 0;
        for(var prop in obj) {
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
        var res = str.split(",");
        return {x: parseInt(res[0]), y: parseInt(res[1])};
    }
    
    /**
     * Helper to convert a number to a letter.
     * @param num: a number >= 1 && <= 26
     */    
    num2letter(num: number): string {
        if(num >= 1 && num <= 26){
            return String.fromCharCode(64 + num);
        }
        return "";
    }
    
    /**
     * Helper to generate a dim*dim 2D array.
     * @param dim: dimension
     */
    createBoard(dim: number): number[][] {
        var board = [];
        for (var i = 0; i < dim; i++) {
            board[i] = [];
            for (var j = 0; j < dim; j++) {
                board[i][j] = 0;
            }
        }
        return board;
    }
    
    /**
     * Helper to get lines of the board grid for svg drawing.
     * @param dim: dimension
     */    
    getLines(dim: number): {a: number; b: number;}[] {
        var lines = [];
        var end = 500 * dim -240;
        for (var i = 0; i < dim; i++) {
            lines.push({a: 500 * i + 250, b: end});
        }
        return lines;
    }
    
    /**
     * Helper to get circles of the board stars for svg drawing.
     * @param dim: dimension
     */        
    getStars(dim: number): {x: number; y: number;}[] {
        var stars = [];
        if (dim == 19) {
            stars.push(
                {x: 250 + 500 * 3, y: 250 + 500 * 3},
                {x: 250 + 500 * 9, y: 250 + 500 * 3},
                {x: 250 + 500 * 15, y: 250 + 500 * 3},
                {x: 250 + 500 * 3, y: 250 + 500 * 9},
                {x: 250 + 500 * 9, y: 250 + 500 * 9},
                {x: 250 + 500 * 15, y: 250 + 500 * 9},
                {x: 250 + 500 * 3, y: 250 + 500 * 15},
                {x: 250 + 500 * 9, y: 250 + 500 * 15},
                {x: 250 + 500 * 15, y: 250 + 500 * 15});
        } else if (dim == 13) {
            stars.push(
                {x: 250 + 500 * 3, y: 250 + 500 * 3},
                {x: 250 + 500 * 3, y: 250 + 500 * 9},
                {x: 250 + 500 * 9, y: 250 + 500 * 3},
                {x: 250 + 500 * 9, y: 250 + 500 * 9});
        } else if (dim == 9) {
            stars.push(
                {x: 250 + 500 * 4, y: 250 + 500 * 4});
        }
        return stars;
    }
    
    /**
     * When the game is ready, add a stone to DOM if playable.
     * @param x: x coordinate
     * @param y: y coordinate
     */
    onClick(x: number, y: number): void {
        console.log("click: " + x + "," + y);
        if (!this.active || !this.ready) return;
        if(this.isPlayable(x, y, this.turn)) {
            this.ready = false; // TODO
            this.calcPos[x][y] = this.turn;
            this.dispPos[x][y] = this.turn;
            var neighborGroups = this.getNeighbors(x, y);
            for (var i = 0; i < neighborGroups.length; i++) {
                if (this.countGroupLiberties(neighborGroups[i]) == 0) {
                    this.removeGroup(neighborGroups[i]);
                }
            }
            this.turn = -this.turn;
        }
    }  
}
