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
      let api_url = '/api/insights/v1/export/hits/';
      switch (query.queryText) {
        case 'inventory':
          api_url = '/api/inventory/v1/hosts';
          break;
        case 'vulnerability':
	  api_url = '/api/vulnerability/v1/vulnerabilities/cves?affecting=true';
          break;
        case 'compliance':
          api_url = '/api/compliance/v1/profiles';
          break;
        case 'patch':
          api_url = '/api/patch/v1/advisories/';
          break;
	case 'advisor':
          api_url = '/api/insights/v1/export/hits/';
          break;
        default:
          api_url = '/api/insights/v1/export/hits/';
      }

      /* Removing use of query as it causes failure with CORS 403 Forbidden */
      /* const response = await this.request('/api/insights/v1/export/hits/', ``); */
      const response = await this.request(api_url, ``);

      let responses = JSON.parse(JSON.stringify(response.data));

      let frame = new MutableDataFrame();

      switch (query.queryText) {
        case 'inventory':
          responses = JSON.parse(JSON.stringify(response.data.results));
          frame = new MutableDataFrame({
            refId: query.refId,
            fields: [
              { name: 'fqdn', type: FieldType.string },
              { name: 'insights_id', type: FieldType.string },
              { name: 'id', type: FieldType.string },
              { name: 'display_name', type: FieldType.string },
              { name: 'reporter', type: FieldType.string },
            ],
          });
          for (let i = 0; i < responses.length; i++) {
            frame.appendRow([responses[i].fqdn, responses[i].insights_id, responses[i].id, responses[i].display_name, responses[i].reporter]);
          }
          break;
        case 'vulnerability':
          responses = JSON.parse(JSON.stringify(response.data.data));
          frame = new MutableDataFrame({
            refId: query.refId,
            fields: [
              { name: 'id', type: FieldType.string },
              { name: 'type', type: FieldType.string },
              { name: 'description', type: FieldType.string },
              { name: 'impact', type: FieldType.string },
              { name: 'systems_affected', type: FieldType.number },
            ],
          });
          for (let i = 0; i < responses.length; i++) {
            frame.appendRow([responses[i].id, responses[i].type, responses[i].attributes.description, responses[i].attributes.impact, responses[i].attributes.systems_affected]); 
          }
          break;
        case 'compliance':
          responses = JSON.parse(JSON.stringify(response.data.data));
          frame = new MutableDataFrame({
            refId: query.refId,
            fields: [
              { name: 'id', type: FieldType.string },
              { name: 'type', type: FieldType.string },
              { name: 'name', type: FieldType.string },
              { name: 'description', type: FieldType.string },
              { name: 'policy_profile_id', type: FieldType.string },
              { name: 'total_host_count', type: FieldType.number },
              { name: 'compliant_host_count', type: FieldType.number },
            ],
          });
          for (let i = 0; i < responses.length; i++) {
            frame.appendRow([responses[i].id, responses[i].type, responses[i].attributes.name, responses[i].attributes.description, responses[i].attributes.policy_profile_id, responses[i].attributes.total_host_count, responses[i].attributes.compliant_host_count]);
          }
          break;
        case 'patch':
          responses = JSON.parse(JSON.stringify(response.data.data));
          frame = new MutableDataFrame({
            refId: query.refId,
            fields: [
              { name: 'id', type: FieldType.string },
              { name: 'type', type: FieldType.string },
              { name: 'synopsis', type: FieldType.string },
              { name: 'description', type: FieldType.string },
              { name: 'advisory_type_name', type: FieldType.string },
              { name: 'cve_count', type: FieldType.number },
              { name: 'applicable_systems', type: FieldType.number },
            ],
          });
          for (let i = 0; i < responses.length; i++) {
            frame.appendRow([responses[i].id, responses[i].type, responses[i].attributes.synopsis, responses[i].attributes.description, responses[i].attributes.advisory_type_name, responses[i].attributes.cve_count, responses[i].attributes.applicable_systems]);
          }
          break;

        default:
          frame = new MutableDataFrame({
            refId: query.refId,
            fields: [
              { name: 'hostname', type: FieldType.string },
              { name: 'recommendation', type: FieldType.string },
              { name: 'rhel_version', type: FieldType.string },
              { name: 'total_risk', type: FieldType.number },
              { name: 'likelihood', type: FieldType.number },
              { name: 'uuid', type: FieldType.string },
              { name: 'results_url', type: FieldType.string },
            ],
          });
          for (let i = 0; i < responses.length; i++) {
            frame.appendRow([responses[i].hostname, responses[i].title, responses[i].rhel_version, responses[i].total_risk, responses[i].likelihood, responses[i].uuid, responses[i].results_url]);
          }
      }

      return frame;
    });

    return Promise.all(promises).then((data) => ({ data }));
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
