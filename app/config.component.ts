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

import {Component, Input} from 'angular2/core';
import {NgForm} from 'angular2/common';
import {GoService} from './go.service';
import {Samples} from './samples';


@Component({
    selector: 'ng-config',
    templateUrl: 'app/config.template.html',
    styles: [`
        .ng-valid[required] {
        border-left: 5px solid #42A948;
        }

        .ng-invalid {
        border-left: 5px solid #a94442;
        }
    `]
})
export class ConfigComponent {
    
    @Input() type = "new";         // specify if it is a new game config UI or import sgf config UI
        
    submitted = false;             // if a new game is submitted
    config = Samples.sampleConfig; // default text of config
    sgf = Samples.sampleSgf;       // default text of sgf
   
    constructor(private goService: GoService){};

    /**
     * Send a INIT request to start a new game.
     */ 
    onSubmit() {
        let data = {
            method: "INIT",
            body: {
                dim: parseInt(this.config.dim),
                handicaps: parseInt(this.config.handicaps),
                black: this.config.black,
                white: this.config.white,
                mode: 1
            }
        };
        this.goService.config2core(data);
        this.submitted = true;
    }
    
    /**
     * Clear the config field.
     */ 
    onClear() {
        this.config = {
            dim: "",
            handicaps: "",
            black: "",
            white: "",
        };
    }
    
    
    /**
     * Send a RESET request to core to reset the game.
     */ 
    onRestart() {
        let data = {
            method: "RESET",
            body: {}
        };
        this.goService.config2core(data);
        this.submitted = false; 
    }

    /**
     * Send a IMPORT request to core to import sgf record.
     */  
    onImport() {
        let data = {
            method: "INIT",
            body: {
                dim: 19,
                handicaps: 0,
                black: "",
                white: "",
                mode: 2
            }
        };
        this.goService.config2core(data);
        let temp = this.sgf2json(this.sgf);
        let moves = [];
        for(let i = 0; i < temp.length; i++) {
            moves.push({
                x: this.letter2num(temp[i].charAt(0)),
                y: this.letter2num(temp[i].charAt(1))
            });
        }
        for (let i = 0; i < moves.length; i++) {
            let curr = {
                method: "MOVE2",
                body: {
                    x: moves[i].x,
                    y: moves[i].y
                }
            };
        this.goService.config2core(curr);
        }
    }
    
    /**
     * Helper to convert a sgf string to a json.
     * @param data: sgf string
     */  
    sgf2json(data) {
        var sgf = data.split(';');
        var initial = '{"'
            + sgf[1].replace( /\[/g, '":"' )
                .replace( /\](\n)?/g, '","' )
            + 'TR":"goban.fr"}';
        var turns = '['
            + sgf.slice(2)
                .join( ', ' )
                .replace( /[A-Z\n\)]/g, '' )
                .replace( /[\[\]]/g, '"' )
            + ']';
        return JSON.parse(turns);
    } 
    
    /**
     * Helper to convert a letter to a number.
     * @param str: a letter from a to s
     */    
    letter2num(str: string): number {
        return str.charCodeAt(0) - 97;
    }   

}
