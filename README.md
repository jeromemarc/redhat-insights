# Grafana Data Source Plugin for Red Hat Insights

This template is a starting point for building a Grafana Data Source Plugin for Red Hat Insights. The content is based on the article ["Integrate Grafana and Red Hat Insights through APIs"](https://www.redhat.com/en/blog/integrate-grafana-and-red-hat-insights-through-apis) published on the Red Hat Blog.

## Learn more

- [Build a data source plugin tutorial](https://grafana.com/tutorials/build-a-data-source-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System

## Overview

Plugin import:

![alt text](/images/image4.png "Plugin import")

Plugin configuration:

![alt text](/images/image2.png "Plugin configuration")

Sample query on Insights APIs (method passed as query parameter e.g. advisor):

![alt text](/images/image5.png "Host list")

Dashboard overview:

![alt text](/images/image1.png "Recommendations and vulnerabilities overview")

## Build and install redhat-insights plugin

The code provided must be compiled before it can be recognized by Grafana. The following commands may be adapted for your particular Grafana environment:
```
# nvm install
# mkdir /var/lib/grafana/plugins/
# cd /var/lib/grafana/plugins/
Extract the redhat-insights github files into redhat-insights
# cd /var/lib/grafana/plugins/redhat-insights
# nvm install --global yarn
# yarn install --ignore-engines
# yarn build
```
In order to allow unsigned plugin in your Grafana environment, `/etc/grafana/grafana.ini` configuration file must be modified:
```
app_mode = development
enable_alpha = true
allow_loading_unsigned_plugins = "redhat-insights"
```
Make sure your start or restart your Grafana environment after these changes:
```
# sudo systemctl restart grafana-server
```
You can then login in your Grafana environment and configure the `redhat-insights` plugin by adding a datasource under `Home > Administration > Plugins and data > Plugins`.

The provided sample dashboard can also be imported manually under Dashboards using [`/provisioning/dashboard/dashboard.json`]([https://github.com/jeromemarc/redhat-insights/tree/main/provisioning/dashboards](https://github.com/jeromemarc/redhat-insights/blob/main/provisioning/dashboards/dashboard.json)) file.
