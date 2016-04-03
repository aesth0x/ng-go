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
import {GoService} from './go.service';


@Component({
    selector: 'ng-control',
    templateUrl: 'app/control.template.html',
    styles: []
})
export class ControlComponent {
    
    @Input() type = "new";                           // specify if it is a new game config UI or import sgf config UI
    forwardData = {method: "FORWARD", body: {}};     // FORWARD request data
    backwardData = {method: "BACKWARD", body: {}};   // BACKWARD request data
    regretData = {method: "REGRET", body: {}};       // REGRET request data
    startTestData = {method: "STARTTEST", body: {}}; // STARTTEST request data
    endTestData = {method: "ENDTEST", body: {}};     // ENDTEST request data
    
    constructor(private goService: GoService){};
    
    /**
     * Send a FORWARD request to step forward.
     */     
    onStepForward() {
        this.goService.control2core(this.forwardData);
    }
    
    /**
     * Send a BACKWARD request to step backward.
     */     
    onStepBackward() {
        this.goService.control2core(this.backwardData);
    }
    
    /**
     * Send 5 FORWARD request to step forward*5.
     */     
    onFastForward() {
        for(let i = 0; i < 5; i++) {
            this.goService.control2core(this.forwardData);
        }
    }
    
    /**
     * Send 5 BACKWARD request to step backward*5.
     */     
    onFastBackward() {
        for(let i = 0; i < 5; i++) {
            this.goService.control2core(this.backwardData);
        }
    }
 
    /**
     * Send a REGRET request to step backward if in new game mode.
     */    
    onRegret() {
        this.goService.control2core(this.regretData);
    }
    
    onStartTest() {
        this.goService.control2core(this.startTestData);
    }
    
    onEndTest() {
        this.goService.control2core(this.endTestData);
    }
}
