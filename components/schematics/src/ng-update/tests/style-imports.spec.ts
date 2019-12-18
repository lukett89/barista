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
import { createTestCaseSetup } from '../../testing';
import { write } from 'fs';

export const migrationCollection = require.resolve('../../migration.json');

describe('v5 dynatrace angular components imports', () => {
  it('should migrate root imports correctly', async () => {
    const {
      runFixers,
      appTree,
      writeFile,
      removeTempDir,
    } = await createTestCaseSetup('update-5.0.0', migrationCollection, []);

    writeFile(
      'projects/lib-testing/src/global.scss',
      `@import 'normalize';
    @import 'component-toolkit';
    @import 'utils/animations';
    @import 'utils/mixin-helpers';
    @import 'utils/page-layout';

    $fonts-path: '/ruxit/cache/fonts';
    $fonts-dir: '/ruxit/cache/fonts';

    @import '~@dynatrace/angular-components/style/main';
    @import '~@dynatrace/angular-components/style/font-styles';

    html {
      /* APM-13030 */
      scroll-behavior: smooth;
    }

    body {
      /* APM-13030 */
      background-color: $BACKGROUND_COLOR_LIGHT;
    }`,
    );

    if (runFixers) {
      await runFixers();
    }

    expect(
      appTree.readContent('projects/lib-testing/src/global.scss'),
    ).toMatchSnapshot();

    removeTempDir();
  });
});
