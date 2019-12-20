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
import axios, { AxiosInstance, AxiosError } from 'axios';
import { URL } from 'url';
import {
  CircleServerError,
  CirclePipeline,
  CircleWorkflow,
  CircleResponse,
  CircleJob,
} from './circle-ci.interface';

/** Abstract class that should be implemented by a CI provider */
export abstract class ContinuosIntegrationApi {
  /**
   * Returns an url where an artefact can be downloaded for a branch
   * @param branchName The branch where the artefact should be downloaded
   * @param stage The stage where it was created
   */
  abstract getArtefactUrlForBranch(commitSha: string): Promise<string>;
}

const CIRCLE_API_V2 = 'https://circleci.com/api/v2/';
const CIRCLE_PROJECT_SLUG = 'github/dynatrace-oss/barista';
const CIRCLE_STAGE = 'unit-test';
const CIRCLE_WORKFLOW_NAME = 'pr_check';

const NO_PIPELINE_FOUND_ERROR = (sha: string) =>
  `There is no pipeline for the provided commit SHA: ${sha}`;
const WORKFLOW_NOT_FOUND_ERROR = (name: string) =>
  `The workflow with the name: ${name} could not be found!`;
const JOB_NOT_FOUND_ERROR = (name: string) =>
  `The job with the name: ${name} could not be found!`;
const SERVER_ERROR = (message: string) =>
  `The server responded with an error: \n${message}`;

export class CircleCiApi extends ContinuosIntegrationApi {
  _apiClient: AxiosInstance;

  constructor(authToken: string) {
    super();
    this._apiClient = axios.create({
      baseURL: CIRCLE_API_V2,
      auth: {
        username: authToken,
        password: '', // password has to be empty
      },
      responseType: 'json',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getArtefactUrlForBranch(commitSha: string): Promise<string> {
    const pipelines = await this._getAllPipelines();
    const branchPipeline = pipelines.find(
      pipeline => pipeline.vcs.revision === commitSha,
    );

    if (!branchPipeline) {
      throw Error(NO_PIPELINE_FOUND_ERROR(commitSha));
    }

    const workflow = await this._getWorkflow(
      branchPipeline.id,
      CIRCLE_WORKFLOW_NAME,
    );
    const job = await this._getJob(workflow.id, CIRCLE_STAGE);

    console.log(JSON.stringify(job, undefined, 2));
    return 'asdf';
  }

  /** Retrieves all the pipelines in the project */
  private async _getAllPipelines(): Promise<CirclePipeline[]> {
    try {
      const response = await this._apiClient.get<
        CircleResponse<CirclePipeline>
      >(`project/${CIRCLE_PROJECT_SLUG}/pipeline`);
      return response.data.items;
    } catch (err) {
      checkServerError(err);
    }
  }

  /** Retrieves a workflow from a pipeline with a provided name */
  private async _getWorkflow(
    pipelineId: string,
    workflowName: string,
  ): Promise<CircleWorkflow> {
    try {
      const response = await this._apiClient.get<
        CircleResponse<CircleWorkflow>
      >(`pipeline/${pipelineId}/workflow`);

      const item = response.data.items.find(
        workflow => workflow.name === workflowName,
      );

      if (!item) {
        throw new Error(WORKFLOW_NOT_FOUND_ERROR(workflowName));
      }

      return item;
    } catch (err) {
      checkServerError(err);
    }
  }

  /** Retrieves a Job by a workflow id and a jobname */
  private async _getJob(
    workflowId: string,
    jobName: string,
  ): Promise<CircleJob> {
    try {
      const response = await this._apiClient.get<CircleResponse<CircleJob>>(
        `workflow/${workflowId}/job`,
      );

      const item = response.data.items.find(job => job.name === jobName);

      if (!item) {
        throw new Error(JOB_NOT_FOUND_ERROR(jobName));
      }

      return item;
    } catch (err) {
      checkServerError(err);
    }
  }
}

/** Check if the error is an axios server error otherwise throw the error */
function checkServerError(err: any): void {
  if (err && err.response) {
    const axiosError = err as AxiosError<CircleServerError>;
    throw new Error(SERVER_ERROR(axiosError.message));
  }

  throw err;
}
