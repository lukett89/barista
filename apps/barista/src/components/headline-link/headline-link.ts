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

import { Component, Input } from '@angular/core';
import { DtToastRef } from 'components/toast/src/toast-ref';
import { DtToast } from 'components/toast/src/toast';

@Component({
  selector: 'ba-headline-link',
  templateUrl: 'headline-link.html',
  // styleUrls: ['./icon-color-wheel.scss'],
})
export class BaHeadlineLink {
  @Input() id: string;

  /** Message which is displayed when the link to the headline is successfully copied */
  private _toastMessage = 'Copied to clipboard';
  toastRef: DtToastRef | null = null;

  constructor(private _toast: DtToast) {}

  /** copy the headline to the clipboard */
  _copyHeadline(): void {
    if (window) {
      const link = `${window.location.origin}${window.location.pathname}#${this.id}`;

      if (document) {
        const textarea = this._createTextArea(link);
        textarea.select();
        const copyResult = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (copyResult) {
          this._createToast();
        }
      }
    }
  }

  /**
   * Creates a non-visible inputfield with the given string as value.
   */
  private _createTextArea(value: string): HTMLInputElement {
    const inputElement = document.createElement('input');
    inputElement.style.position = 'absolute';
    inputElement.style.right = '0';
    inputElement.style.left = '0';
    inputElement.style.padding = '0';
    inputElement.style.border = 'none';
    inputElement.style.background = 'transparent';
    inputElement.style.width = '1px';
    inputElement.style.height = '1px';
    inputElement.value = value;
    document.body.append(inputElement);
    return inputElement;
  }

  /**
   * Creates Toast after successfully copying the link to the clipboard
   */
  private _createToast(): void {
    this.toastRef = this._toast.create(this._toastMessage);
  }
}
