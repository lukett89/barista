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

import { GitClient } from './git/git-client';
import { Version } from './parse-version';
import { prompt } from 'inquirer';
import * as OctokitApi from '@octokit/rest';

/**
 * Base release task class that contains shared methods that are commonly used across
 * the staging and publish script.
 */
export class BaseReleaseTask {
  /** Path to the project package JSON. */
  packageJsonPath: string;

  /** Serialized package.json of the specified project. */
  packageJson: any;

  /** Parsed current version of the project. */
  currentVersion: Version;

  /** Octokit API instance that can be used to make Github API calls. */
  githubApi: OctokitApi = new OctokitApi();

  constructor(public git: GitClient) {}

  /** Prompts the user with a confirmation question and a specified message. */
  protected async promptConfirm(message: string): Promise<boolean> {
    return (await prompt<{ result: boolean }>({
      type: 'confirm',
      name: 'result',
      message: message,
    })).result;
  }
}
