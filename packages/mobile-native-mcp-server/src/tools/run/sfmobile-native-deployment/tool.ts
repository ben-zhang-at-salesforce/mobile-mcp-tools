/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dedent from 'dedent';
import { Logger } from '../../../logging/logger.js';
import { DEPLOYMENT_TOOL, DeploymentWorkflowInput } from './metadata.js';
import { AbstractWorkflowTool } from '../../base/abstractWorkflowTool.js';

export class SFMobileNativeDeploymentTool extends AbstractWorkflowTool<typeof DEPLOYMENT_TOOL> {
  constructor(server: McpServer, logger?: Logger) {
    super(server, DEPLOYMENT_TOOL, 'DeploymentTool', logger);
  }

  protected async handleRequest(input: DeploymentWorkflowInput) {
    try {
      // Parsing here is about setting defaults from the input schema (e.g. buildType default).
      const validatedInput = this.toolMetadata.inputSchema.parse(input);
      const guidance = this.generateDeploymentGuidance(validatedInput);

      return {
        content: [
          {
            type: 'text' as const,
            text: guidance,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          },
        ],
      };
    }
  }

  private generateDeploymentGuidance(input: DeploymentWorkflowInput): string {
    return dedent`
      You are a technology-adept agent working on behalf of a user who has less familiarity with the technical details of application deployment than you do, and needs your assistance to deploy the app to the target device.
      Please execute the instructions of the following plan on behalf of the user, providing them information on the outcomes that they may need to know.

      # Mobile Native App Deployment Guidance for ${input.platform}

      First make sure \`sfmobile-native-build\` mcp tool is executed successfully. If not, run the \`sfmobile-native-build\` tool first.

      You MUST follow the steps in this guide in order. Do not execute any commands that are not part of the steps in this guide.

      ${this.generateTargetDeviceReadyStep(1, input)}

      ${this.generateDeploymentStep(2, input)}

      ${this.generateNextStep(input)}
    `;
  }

  private generateTargetDeviceReadyStep(
    stepNumber: number,
    input: DeploymentWorkflowInput
  ): string {
    return dedent`
      ## Step ${stepNumber}: ${input.platform === 'iOS' ? 'iOS Simulator' : 'Android Emulator'} must be ready
      
      ${
        input.platform === 'iOS'
          ? this.generateTargetDeviceReadyStepIOS(input)
          : this.generateTargetDeviceReadyStepAndroid(input)
      }
    `;
  }

  private generateTargetDeviceReadyStepIOS(input: DeploymentWorkflowInput): string {
    return dedent`
      Navigate to the ${input.projectPath} directory and run the following command to check if the simulator is running:

      \`\`\`bash
      xcrun simctl list devices | grep "${input.targetDevice}"
      \`\`\`

      If (Shutdown) is shown as the output, the simulator is not running. Start it by running the following command:

      \`\`\`bash
      xcrun simctl boot ${input.targetDevice}
      \`\`\`
    `;
  }

  private generateTargetDeviceReadyStepAndroid(input: DeploymentWorkflowInput): string {
    return dedent`
      Navigate to the ${input.projectPath} directory and run the following commands to make sure 
      an emulator with an API level equal to or higher than the app's minimum SDK version is active.

      First, make sure an emulator is configured. If not, run the following command to create a new emulator:
      \`\`\`bash
      sf force lightning local device list -p android
      \`\`\`

      If an emulator hasn't been set up yet, use the following command to create one:
      \`\`\`bash
      sf force lightning local device create -p android -n pixel-<api-level> -d pixel -l <api-level>
      \`\`\`

      Replace <api-level> with the value of minSdk from the application's build gradle file.

      Second, get the emulator to use by running the following command:
      \`\`\`bash
      sf force lightning local device list -p android
      \`\`\`
      
      Third, start the emulator by running the following command:
      \`\`\`bash
      sf force lightning local device start -p android -t <emulator-name>
      \`\`\`
    `;
  }

  private generateDeploymentStep(stepNumber: number, input: DeploymentWorkflowInput): string {
    return dedent`
      ## Step ${stepNumber}: Deploy application to ${input.platform === 'iOS' ? 'iOS Simulator' : 'Android Emulator'}

      Deploy the application to the target device using:

      \`\`\`bash
      ${this.generateDeploymentCommand(input)}
      \`\`\`
    `;
  }

  private generateDeploymentCommand(input: DeploymentWorkflowInput): string {
    return input.platform === 'iOS'
      ? dedent`
        \`\`\`bash
        xcrun simctl install ${input.targetDevice} <your-app>.app
        \`\`\`

        Replace <your-app>.app with app name built in \`sfmobile-native-build\` tool call.
      `
      : dedent`
        \`\`\`bash
        ./gradlew install${input.buildType === 'release' ? 'Release' : 'Debug'}
        \`\`\`
      `;
  }

  private generateNextStep(input: DeploymentWorkflowInput): string {
    return dedent`
      ## Next Steps

      Once the app is deployed successfully, you can launch the app on the target device by running the following command:
      ${this.generateLaunchCommand(input)}
    `;
  }

  private generateLaunchCommand(input: DeploymentWorkflowInput): string {
    return input.platform === 'iOS'
      ? dedent`
        \`\`\`bash
        xcrun simctl launch ${input.targetDevice} <app-bundle-id>
        \`\`\`
        Replace <app-bundle-id> with the bundle id of the app.
      `
      : dedent`
        \`\`\`bash
        adb shell monkey -p <application-id> -c android.intent.category.LAUNCHER 1
        \`\`\`
        Replace <application-id> with the value of applicationId from the application's build gradle file.
      `;
  }
}
