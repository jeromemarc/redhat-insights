import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { getBackendSrv, isFetchError } from '@grafana/runtime';
import _ from 'lodash';
import defaults from 'lodash/defaults';
import { DataSourceResponse, defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { lastValueFrom } from 'rxjs';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  baseUrl: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.baseUrl = instanceSettings.url!;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const promises = options.targets.map(async (target) => {
      const query = defaults(target, defaultQuery);
      /* Removing use of query as it causes failure with CORS 403 Forbidden */
      const response = await this.request('/api/insights/v1/export/hits/', ``);

      const hits = JSON.parse(JSON.stringify(response.data));

      const frame = new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'Hostname', type: FieldType.string },
          { name: 'Hit', type: FieldType.string },
        ],
      });

      for (let i = 0; i < hits.length; i++) {
        frame.appendRow([hits[i].hostname, hits[i].title]);
      }

      return frame;
    });

    return Promise.all(promises).then((data) => ({ data }));
  }

  async doRequest(query: MyQuery) {
    const result = await getBackendSrv().datasourceRequest({
      method: 'GET',
      url: 'https://console.redhat.com/api/insights/v1/export/hits',
      params: query,
    });

    return result;
  }

  async request(url: string, params?: string) {
    const response = getBackendSrv().fetch<DataSourceResponse>({
      url: `${this.baseUrl}${url}${params?.length ? `?${params}` : ''}`,
    });
    return lastValueFrom(response);
  }

  /**
   * Checks whether we can connect to the API.
   */
  async testDatasource() {
    const defaultErrorMessage = 'Cannot connect to API';

    try {
      /* Using /api/insights/v1/ to test the authentication as well */
      const response = await this.request('/api/insights/v1/');
      if (response.status === 200) {
        return {
          status: 'success',
          message: 'Success',
        };
      } else {
        return {
          status: 'error',
          message: response.statusText ? response.statusText : defaultErrorMessage,
        };
      }
    } catch (err) {
      let message = '';
      if (_.isString(err)) {
        message = err;
      } else if (isFetchError(err)) {
        message += err.statusText ? err.statusText : defaultErrorMessage;
        if (err.data && err.data.error && err.data.error.code) {
          message += ': ' + err.data.error.code + '. ' + err.data.error.message;
        }
      }
      return {
        status: 'error',
        message,
      };
    }
  }
}
