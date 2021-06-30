# Salesforce WebViewer Docgen

WebViewer document generation sample in Salesforce

## Setup

1. Clone project
```
git clone git@github.com:tommywintersr/salesforce-webviewer-docgen.git
cd salesforce-webviewer-docgen
```

2. Authenticate project to your org from SFDX CLI or VS Code UI. 
* [SFDX CLI Authorize an Org](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_web_flow.htm)
* [VS Code Authentication steps](https://salesforcediaries.com/2019/03/15/salesforce-cli-and-visual-studio-code-command-palette/)

3. Deploy to your Org
* [Non-tracking org (Sandbox, Production, Dev Org etc) - `force:source:deploy`](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_force_source.htm)
* [Tracking org (Scratch Org) - `force:source:push`](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_force_source.htm)
* VS Code: right click on your `force-app/main/default` folder and select `SFDX: Deploy Source to Org`

4. Once deployed, navigate to any Lightning Page (for example your Home page) in your org. Select the setup gear wheel, and click on `Edit Page`.

You need to drag and drop the following components onto the page:
* `pdftronWvFileBrowserComponent` - used for browsing files, filling documents, file upload and file search
* `pdftronWvInstance` - LWC that inserts WebViewer into your DOM

## Configure Your Salesforce DX Project

The `sfdx-project.json` file contains useful configuration information for your project. See [Salesforce DX Project Configuration](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_ws_config.htm) in the _Salesforce DX Developer Guide_ for details about this file.

## Read All About It

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
