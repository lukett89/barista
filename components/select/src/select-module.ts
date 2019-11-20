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

import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import {
  DtOptionModule,
  DTUITESTCONFIG,
  DT_DEFAULT_UI_TEST_CONFIG,
} from '@dynatrace/barista-components/core';
import { DtFormFieldModule } from '@dynatrace/barista-components/form-field';
import { DtIconModule } from '@dynatrace/barista-components/icon';

import { DtSelect } from './select';

@NgModule({
  imports: [CommonModule, OverlayModule, DtIconModule, DtOptionModule],
  exports: [DtFormFieldModule, DtOptionModule, DtSelect],
  declarations: [DtSelect],
  providers: [
    {
      provide: DTUITESTCONFIG,
      useValue: DT_DEFAULT_UI_TEST_CONFIG,
    },
  ],
})
export class DtSelectModule {}
