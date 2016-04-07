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
import {GoService} from './go.service';
import {BoardComponent} from './board.component';
import {Board3dComponent} from './board3d.component';
import {ConfigComponent} from './config.component';
import {ControlComponent} from'./control.component';
import {CoreComponent} from './core.component';

@Component({
    selector: 'ng-go',
    templateUrl: 'app/go.template.html',
    directives: [BoardComponent, Board3dComponent, ConfigComponent, ControlComponent, CoreComponent],
    providers: [GoService]
})
export class GoComponent {
    
    newTabActive = true; // if new game config and control is shown
    twodTabActive = true; //
    
    constructor(private goService: GoService) {}
    
    /**
     * Show new game config and control.
     */
    onNewTabClick() {
        this.newTabActive = true;
    }

    /**
     * Show import sgf config and control.
     */    
    onImportTabClick() {
        this.newTabActive = false;
    }
    
    onTwodTabClick() {
        this.twodTabActive = true;
    }
    
    onThreedTabClick() {
        this.twodTabActive = false;
    }
    
}
