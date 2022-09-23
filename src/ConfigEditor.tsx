import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DataSourceHttpSettings } from '@grafana/ui';
import React from 'react';
import { MyDataSourceOptions } from './types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export const ConfigEditor: React.FC<Props> = ({ onOptionsChange, options }) => {
  return (
    <DataSourceHttpSettings
      defaultUrl="https://console.redhat.com"
      dataSourceConfig={options}
      onChange={onOptionsChange}
    />
  );
};
