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

import {Injectable} from 'angular2/core';
import {Subject}    from 'rxjs/Subject';

@Injectable()
export class GoService {
    
    /* channel between each pair of components */
    private _config2coreSource  = new Subject<{method: string; body: any}>();    // config  -> core    
    private _control2coreSource = new Subject<{method: string; body: any}>();    // control -> core
    private _export2coreSource  = new Subject<{method: string; body: any}>();    // export  -> core
    private _core2exportSource  = new Subject<{method: string; body: any}>();    // core    -> export
    private _board2coreSource   = new Subject<{method: string; body: any}>();    // board   -> core
    private _core2boardSource   = new Subject<{method: string; body: any}>();    // core    -> board
    
    config2core$  = this._config2coreSource.asObservable();
    control2core$ = this._control2coreSource.asObservable();
    export2core$  = this._export2coreSource.asObservable();
    core2export$  = this._core2exportSource.asObservable();
    board2core$   = this._board2coreSource.asObservable();
    core2board$   = this._core2boardSource.asObservable();
    
    config2core(data) {
        this._config2coreSource.next(data);
    }
    
    control2core(data) {
        this._control2coreSource.next(data);
    }
    
    export2core(data) {
        this._export2coreSource.next(data);
    }
    
    core2export(data) {
        this._core2exportSource.next(data);
    }
    
    board2core(data) {
        this._board2coreSource.next(data);
    }
    
    core2board(data) {
        this._core2boardSource.next(data);
    }
    
    
}