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

import {Component} from 'angular2/core';
import {NgForm} from 'angular2/common';
import {GameComponent} from './game.component';

@Component({
    selector: 'my-app',
    templateUrl: 'app/app.template.html',
    directives: [GameComponent],
    styles: [`
        .ng-valid[required] {
        border-left: 5px solid #42A948; /* green */
        }

        .ng-invalid {
        border-left: 5px solid #a94442; /* red */
        }
    `]
})
export class AppComponent {
    
    dim = "19";
    coordinate = true;
    black = "";
    white = "";

    submitted = false;     
        
    config = {
        dim: "19",
        coordinate: "on",
        black: "Player 1",
        white: "Player 2",
    };
    
    coordinates = ["on", "off"];


    onStart() {
        this.dim = this.config.dim;
        this.coordinate = this.config.coordinate === "on" ? true : false;
        this.black = this.config.black;
        this.white = this.config.white;
        
        this.submitted = !this.submitted;
    }
    
    onReset() {
        this.config.dim = "";
        this.config.coordinate = "";
        this.config.black = "";
        this.config.white = "";
    }
}
