
# Azure Pipelines Kubernetes UI

## Overview

This repo contains React based UI view of a kubernetes cluster and will be used in azure devops pipelines. This UI is hostable outside of azure pipelines product and does not require the UI web server to be running inside the kubernetes cluster.

This repo consists of
1. Contracts: The `IKubeService` provides the interface that needs to be implemented inorder to fetch data needed for the UI
2. Service: It contains `AzureDevOpsKubeService` - the ServiceEndpoint based implementation of `IKubeService` that is used in Azure Pipelines
3. WebUI: It contains the components that make up the UI

## Host the Kubernetes UI within your Web Application

You can refer to the [azpipelines-kubernetesUI-WebApp](https://github.com/Microsoft/azpipelines-kubernetesUI-WebApp) repository as a working reference on how to host the Kubernetes UI in a stand-alone web app. It also has a custom implementation of `IKubeService` to fetch the required Kubernets objects.

## Dependencies

This repository depends on the following packages:

- [azure-devops-extension-sdk](https://github.com/Microsoft/azure-devops-extension-sdk): Required module for Azure DevOps extensions which allows communication between the host page and the extension iframe.
- [azure-devops-extension-api](https://github.com/Microsoft/azure-devops-extension-api): Contains REST client libraries for the various Azure DevOps feature areas.
- [azure-devops-ui](https://www.npmjs.com/package/azure-devops-ui): UI library containing the React components used in the Azure DevOps web UI.

Some external dependencies:
- `React` - Is used to render the UI in the samples, and is a dependency of `azure-devops-ui`.
- `TypeScript` - Samples are written in TypeScript and complied to JavaScript
- `SASS` - Extension samples are styled using SASS (which is compiled to CSS and delivered in webpack js bundles).
- `webpack` - Is used to gather dependencies into a single javascript bundle for each sample.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
