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

import {Component, Input, OnInit, OnDestroy} from 'angular2/core';
import {GoService} from './go.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
    selector: 'ng-board',
    templateUrl: 'app/board.template.html'
})


export class BoardComponent implements OnInit, OnDestroy {
    
    @Input() showSequence: string = "false";
    dim: number = 19;                           // board dimension
    grid: number[][] = this.createGrid(19);     // position for display, binded to svg
    sequence: number[][] = this.createGrid(19); // sequence number for sisplay, binded to svg
    lines = this.getLines(19);                  // lines for board grids
    stars = this.getStars(19);                  // circles for board stars
    turn: number = 0;                           // 1: black; -1: white; 0: empty
    active: boolean = false;                    // freeze the board if inactive
    
    coreSubscription: Subscription;             // listen to data from <core>
    
    constructor(private goService: GoService) {}
    
    ngOnInit():void {
        this.coreSubscription = this.goService.core2board$.subscribe(data => {
            console.log("core2board data: " + JSON.stringify(data));
            this.processData(data);
        });
    }
    
    ngOnDestroy() {
        this.coreSubscription.unsubscribe();
    }
    
    /**
     * Reset board to default parameters.
     */
    resetBoard(): void {
        this.turn = 0;
        this.active = false;
        this.grid = this.createGrid(this.dim);
        this.sequence = this.createGrid(this.dim);
    }
    
    /**
     * Helper to generate a dim*dim 2D array.
     * @param dim: dimension
     */
    createGrid(dim: number): number[][] {
        let grid = [];
        for (let i = 0; i < dim; i++) {
            grid[i] = [];
            for (let j = 0; j < dim; j++) {
                grid[i][j] = 0;
            }
        }
        return grid;
    }
    
    /**
     * Helper to get lines of the board grid for svg drawing.
     * @param dim: dimension
     */    
    getLines(dim: number): {a: number; b: number;}[] {
        let lines = [];
        let end = 500 * dim -240;
        for (let i = 0; i < dim; i++) {
            lines.push({a: 500 * i + 250, b: end});
        }
        return lines;
    }
    
    /**
     * Helper to get circles of the board stars for svg drawing.
     * @param dim: dimension
     */        
    getStars(dim: number): {x: number; y: number;}[] {
        let stars = [];
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
     * Helper to convert a number to a letter.
     * @param num: a number >= 1 && <= 26
     */    
    num2letter(num: number): string {
        if(num >= 1 && num <= 26) {
            return String.fromCharCode(64 + num);
        }
        return "";
    }

    /**
     * When the game is ready, add a stone to DOM if playable.
     * @param x: x coordinate
     * @param y: y coordinate
     */
    onClick(x: number, y: number): void {
        let data = {
            method: "MOVE",
            body :{
                x: x,
                y: y
            }
        };
        this.goService.board2core(data);
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
                this.sequence = this.createGrid(data.body.dim);
                this.lines = this.getLines(data.body.dim);
                this.stars = this.getStars(data.body.dim);
                this.turn = data.body.turn;
                this.active = true; 
                break;
            case "RESET":
                this.resetBoard();
                break;
            case "MOVERESP":
                for(let i = 0; i < data.body.add.length; i++) {
                    this.grid[data.body.add[i].x][data.body.add[i].y] = data.body.add[i].c;
                    this.sequence[data.body.add[i].x][data.body.add[i].y] = data.body.add[i].s;
                }
                for(let i = 0; i < data.body.remove.length; i++) {
                    this.grid[data.body.remove[i].x][data.body.remove[i].y] = 0;
                    this.sequence[data.body.remove[i].x][data.body.remove[i].y] = 0;
                }
                this.turn = data.body.turn;
                break;
        }
    }
}