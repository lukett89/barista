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

export interface CircleServerError {
  message: string;
}

export interface CircleResponse<T> {
  items: T[];
  /** A token to pass as a page-token query parameter to return the next page of results. */
  next_page_token: string;
}

export type CirclePipelineState = 'errored' | 'created';

export interface CirclePipeline {
  id: string;
  errors: any[];
  project_slug: string;
  updated_at: string;
  number: number;
  state: 'errored' | 'created';
  created_at: string;
  trigger: CirclePipelineTrigger;
  vcs: CirclePipelineVCS;
}

export interface CirclePipelineVCS {
  origin_repository_url: string;
  target_repository_url: string;
  revision: string;
  provider_name: 'GitHub';
  commit: any;
  branch: string;
}

export interface CirclePipelineTrigger {
  received_at: string;
  type: 'webhook';
  actor: any;
}

export interface CircleWorkflow {
  /** The unique ID of the workflow. */
  id: string;
  /** The name of the workflow. */
  name: string;
  /** The current status of the workflow. */
  status: string;
  /** The date and time the workflow was created. */
  created_at: string;
  /** The date and time the workflow stopped. */
  stopped_at: string;
  /** The ID of the pipeline this workflow belongs to. */
  pipeline_id: string;
  /** The number of the pipeline this workflow belongs to. */
  pipeline_number: number;
  /** The project-slug for the pipeline this workflow belongs to. */
  project_slug: string;
  /** A token to pass as a page-token query parameter to return the next page of results. */
}

export interface CircleJob {
  /** The unique ID of the user. */
  canceled_by: string;
  /** A sequence of the unique job IDs for the jobs that this job depends upon in the workflow. */
  dependencies: string[];
  /** The number of the job. */
  job_number: number;
  /** The unique ID of the job. */
  id: string;
  /** The date and time the job started. */
  started_at: string;
  /** The name of the job. */
  name: string;
  /** The unique ID of the user. */
  approved_by: string;
  /** The project-slug for the job. */
  project_slug: string;
  /* The type of job. */
  type: string;
  /** The current status of the job. */
  status: any;
  /** The time when the job stopped. */
  stopped_at: string;
}
