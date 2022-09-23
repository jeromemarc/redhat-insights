import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  queryText?: string;
}

export const defaultQuery: Partial<MyQuery> = {};

export interface Hit {
  hostname: string;
  title: string;
  rhel_version: string;
  uuid: string;
  results_url: string;
  total_risk: number;
  likelihood: number; 
}
export interface DataSourceResponse {
  data: Hit[];
}

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  path?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}
