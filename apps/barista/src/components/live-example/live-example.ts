/**
 * @license
 * Copyright 2019 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Component,
  Input,
  ComponentFactoryResolver,
  Injector,
  ViewChild,
  ElementRef,
  ViewContainerRef,
  ComponentRef,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { EXAMPLES_MAP } from '@dynatrace/barista-components/examples';
import * as hljs from 'highlight.js';
import { BehaviorSubject, timer, Subscription } from 'rxjs';
import { createComponent } from '../../utils/create-component';

@Component({
  selector: 'ba-live-example',
  templateUrl: 'live-example.html',
  styleUrls: ['live-example.scss'],
  host: {
    class: 'ba-live-example',
    '[class.ba-live-example-dark]': 'themedark',
    '[class.ba-live-example-full-width]': 'fullwidth',
  },
  encapsulation: ViewEncapsulation.None,
})
export class BaLiveExample implements OnDestroy {
  /** The name of the example (class name) that will be instantiated. */
  @Input()
  get name(): string {
    return this._name;
  }
  set name(value: string) {
    this._name = value;
    this._initExample();
  }
  private _name: string;

  /** Whether the example should run in the dark theme. */
  @Input()
  get themedark(): boolean {
    return this._hasThemeDark;
  }
  set themedark(value: boolean) {
    this._hasThemeDark = coerceBooleanProperty(value);
  }
  private _hasThemeDark = false;

  /** Whether the example needs the full width of barista. */
  @Input()
  get fullwidth(): boolean {
    return this._isFullWidth;
  }
  set fullwidth(value: boolean) {
    this._isFullWidth = coerceBooleanProperty(value);
  }
  private _isFullWidth = false;

  /** The encoded html template source of the given example. */
  @Input()
  get templateSource(): string {
    return this._templateSource;
  }
  set templateSource(value: string) {
    this._templateSource = value;
    if (!this._activeTabChanged) {
      this._activeTab = 'html';
    }
    this._enhancedTemplateSource = this._enhanceCode(value, 'html');
  }
  private _templateSource: string;

  /** The encoded typescript class (component) source of the given example. */
  @Input()
  get classSource(): string {
    return this._classSource;
  }
  set classSource(value: string) {
    this._classSource = value;
    if (!this._activeTabChanged && !this._activeTab) {
      this._activeTab = 'ts';
    }
    this._enhancedClassSource = this._enhanceCode(value, 'typescript');
  }
  private _classSource: string;

  /**
   * @internal
   * The placeholder element that will be replaced with
   * the example element once it is instantiated.
   */
  @ViewChild('demoPlaceholder', { read: ElementRef, static: true })
  _placeholder: ElementRef;

  /** @internal The component-ref of the instantiated class. */
  _componentRef: ComponentRef<unknown>;

  /**
   * @internal
   * The currently active tab for displaying a source (html, ts or scss).
   */
  _activeTab: 'html' | 'ts' | 'scss';

  /** @internal Whether the source code is hidden. */
  _sourceHidden = false;

  /** @internal Whether the source code is expanded to its max height. */
  _isExpanded = false;

  /** Whether the user has changed the active tab. */
  private _activeTabChanged = false;

  /** @internal Whether the source code has been copied. */
  _copied$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private _timerSubscription = Subscription.EMPTY;

  /** @internal Enhanced template source with line wrappers and code highlighting. */
  _enhancedTemplateSource: string;

  /** @internal Enhanced class source with line wrappers and code highlighting. */
  _enhancedClassSource: string;

  constructor(
    private _componentFactoryResolver: ComponentFactoryResolver,
    private _injector: Injector,
    private _viewContainerRef: ViewContainerRef,
  ) {}

  ngOnDestroy(): void {
    if (this._componentRef) {
      this._componentRef.destroy();
    }
    this._timerSubscription.unsubscribe();
  }

  /** @internal Whether one of the three sources has been set. */
  _hasSources(): boolean {
    return Boolean(this.classSource || this.templateSource);
  }

  /** @internal Sets the active tab. */
  _setActiveTab(tab: 'html' | 'ts' | 'scss'): void {
    this._activeTab = tab;
    this._activeTabChanged = true;
  }

  /** @internal Copies content of currently active tab to clipboard. */
  _copyToClipboard(): void {
    if (document) {
      let copyText;
      switch (this._activeTab) {
        case 'html':
          copyText = this._templateSource;
          break;
        case 'ts':
          copyText = this._classSource;
          break;
        case 'scss':
          // TODO: copyText = this._scssSource;
          break;
      }

      if (copyText) {
        const textarea = this._createTextArea(copyText);
        textarea.select();
        const copyResult = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (copyResult) {
          this._copySuccess();
        }
      }
    }
  }

  private _initExample(): void {
    const exampleType = EXAMPLES_MAP.get(this._name);
    if (exampleType) {
      const factory = this._componentFactoryResolver.resolveComponentFactory(
        exampleType,
      );
      this._componentRef = createComponent(
        factory,
        this._viewContainerRef,
        this._injector,
        this._placeholder.nativeElement,
        true,
      );
    }
  }

  /**
   * Creates a non-visible textarea with the given string as value.
   */
  private _createTextArea(value: string): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.style.position = 'absolute';
    textarea.style.right = '0';
    textarea.style.left = '0';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.background = 'transparent';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.value = value;
    document.body.append(textarea);
    return textarea;
  }

  /**
   * Updates value of behavior subject after
   * successful copy to clipboard action.
   */
  private _copySuccess(): void {
    this._copied$.next(true);
    this._timerSubscription = timer(1000).subscribe(() =>
      this._copied$.next(false),
    );
  }

  /**
   * Transforms given code by replacing empty lines,
   * and wrapping each line in a span element.
   */
  private _enhanceCode(code: string, type: 'html' | 'typescript'): string {
    // Remove empty lines at the start of the source
    let transformedCode = code.replace(/^(\s*\r?\n)*/g, '');
    // Remove empty lines at the end of the source
    transformedCode = transformedCode.replace(/(\r?\n\s*)*$/g, '');
    // Add syntax highlighting using highlight.js
    transformedCode = hljs.highlight(type, transformedCode).value;

    return this._wrapCodeLines(transformedCode);
  }

  /**
   * Wraps each line of the given code string in a span tag.
   */
  private _wrapCodeLines(code: string): string {
    const wrappedLines = code.replace(
      /\n+/g,
      '</span>\n<span class="ba-live-example-code-line">',
    );
    return `<span class="ba-live-example-code-line">${wrappedLines}</span>`;
  }
}
