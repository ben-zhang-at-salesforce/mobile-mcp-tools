/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';
import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SFMobileNativeDeploymentTool } from '../../../../src/tools/run/sfmobile-native-deployment/tool.js';
import { MockLogger } from '../../../utils/MockLogger.js';
import {
  DEPLOYMENT_WORKFLOW_INPUT_SCHEMA,
  DeploymentWorkflowInput,
} from '../../../../src/tools/run/sfmobile-native-deployment/metadata.js';

describe('SFMobileNativeDeploymentTool', () => {
  let tool: SFMobileNativeDeploymentTool;
  let mockServer: McpServer;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockServer = new McpServer({ name: 'test-server', version: '1.0.0' });
    mockLogger = new MockLogger();
    tool = new SFMobileNativeDeploymentTool(mockServer, mockLogger);
  });

  describe('Tool Metadata', () => {
    it('should have correct tool properties', () => {
      expect(tool.toolMetadata.toolId).toBe('sfmobile-native-deployment');
      expect(tool.toolMetadata.title).toBe('Salesforce Mobile Native Deployment');
      expect(tool.toolMetadata.description).toBe(
        'Guides LLM through deploying Salesforce mobile native apps to devices or simulators'
      );
    });

    it('should have input schema with required fields', () => {
      const schema = tool.toolMetadata.inputSchema;
      expect(schema).toBeDefined();
      expect(schema.shape).toBeDefined();
      expect(schema.shape.platform).toBeDefined();
      expect(schema.shape.projectPath).toBeDefined();
      expect(schema.shape.workflowStateData).toBeDefined();
    });

    it('should register without throwing errors', () => {
      const mockAnnotations = {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      };

      expect(() => tool.register(mockAnnotations)).not.toThrow();
    });
  });

  describe('iOS Deployment Guidance', () => {
    it('should generate guidance for iOS with debug build', async () => {
      const input = {
        platform: 'iOS' as const,
        projectPath: '/path/to/project',
        buildType: 'debug' as const,
        targetDevice: 'iPhone-15-Pro',
        workflowStateData: { thread_id: 'test-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Mobile Native App Deployment Guidance for iOS');
      expect(result.content[0].text).toContain('Step 1: iOS Simulator must be ready');
      expect(result.content[0].text).toContain('Step 2: Deploy application to iOS Simulator');
      expect(result.content[0].text).toContain('xcrun simctl list devices | grep "iPhone-15-Pro"');
      expect(result.content[0].text).toContain('xcrun simctl boot iPhone-15-Pro');
      expect(result.content[0].text).toContain('xcrun simctl install iPhone-15-Pro <your-app>.app');
      expect(result.content[0].text).toContain('xcrun simctl launch iPhone-15-Pro <app-bundle-id>');
    });

    it('should generate guidance for iOS with release build', async () => {
      const input = {
        platform: 'iOS' as const,
        projectPath: '/path/to/project',
        buildType: 'release' as const,
        targetDevice: 'iPhone-15-Pro',
        workflowStateData: { thread_id: 'test-456' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Mobile Native App Deployment Guidance for iOS');
      expect(result.content[0].text).toContain('iPhone-15-Pro');
    });

    it('should generate guidance for iOS without target device', async () => {
      const input = {
        platform: 'iOS' as const,
        projectPath: '/path/to/project',
        buildType: 'debug' as const,
        workflowStateData: { thread_id: 'test-789' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Mobile Native App Deployment Guidance for iOS');
    });
  });

  describe('Android Deployment Guidance', () => {
    it('should generate guidance for Android with debug build', async () => {
      const input = {
        platform: 'Android' as const,
        projectPath: '/path/to/project',
        buildType: 'debug' as const,
        targetDevice: 'pixel-34',
        workflowStateData: { thread_id: 'test-android-123' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Mobile Native App Deployment Guidance for Android');
      expect(result.content[0].text).toContain('Step 1: Android Emulator must be ready');
      expect(result.content[0].text).toContain('Step 2: Deploy application to Android Emulator');
      expect(result.content[0].text).toContain('sf force lightning local device list -p android');
      expect(result.content[0].text).toContain('sf force lightning local device create -p android');
      expect(result.content[0].text).toContain('sf force lightning local device start -p android');
      expect(result.content[0].text).toContain('./gradlew installDebug');
      expect(result.content[0].text).toContain('adb shell monkey -p <application-id>');
    });

    it('should generate guidance for Android with release build', async () => {
      const input = {
        platform: 'Android' as const,
        projectPath: '/path/to/project',
        buildType: 'release' as const,
        targetDevice: 'pixel-34',
        workflowStateData: { thread_id: 'test-android-456' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Mobile Native App Deployment Guidance for Android');
      expect(result.content[0].text).toContain('./gradlew installRelease');
    });

    it('should generate guidance for Android without target device', async () => {
      const input = {
        platform: 'Android' as const,
        projectPath: '/path/to/project',
        buildType: 'debug' as const,
        workflowStateData: { thread_id: 'test-android-789' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Mobile Native App Deployment Guidance for Android');
    });
  });

  describe('Input Validation and Defaults', () => {
    it('should apply default buildType when not provided', async () => {
      const input = {
        platform: 'iOS' as const,
        projectPath: '/path/to/project',
        workflowStateData: { thread_id: 'test-default' },
      } satisfies z.input<typeof DEPLOYMENT_WORKFLOW_INPUT_SCHEMA>;

      const result = await tool.handleRequest(input as DeploymentWorkflowInput);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Mobile Native App Deployment Guidance for iOS');
      // iOS guidance doesn't explicitly mention build type, but should work
      expect(result.content[0].text).toContain('xcrun simctl');
    });

    it('should handle optional targetDevice parameter', async () => {
      const input = {
        platform: 'iOS' as const,
        projectPath: '/path/to/project',
        buildType: 'debug' as const,
        targetDevice: 'iPhone-14-Pro',
        workflowStateData: { thread_id: 'test-optional-device' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('iPhone-14-Pro');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid platform gracefully', async () => {
      const input = {
        platform: 'InvalidPlatform' as any, // Intentionally invalid
        projectPath: '/path/to/project',
        buildType: 'debug' as const,
        workflowStateData: { thread_id: 'test-invalid-platform' },
      };

      const result = await tool.handleRequest(input);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle missing required fields', async () => {
      const input = {
        platform: 'iOS' as const,
        // Missing projectPath and workflowStateData
      } as any; // Intentionally incomplete

      const result = await tool.handleRequest(input);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle invalid build type', async () => {
      const input = {
        platform: 'Android' as const,
        projectPath: '/path/to/project',
        buildType: 'invalid-build-type' as any, // Intentionally invalid
        workflowStateData: { thread_id: 'test-invalid-build' },
      };

      const result = await tool.handleRequest(input);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle malformed workflow state data', async () => {
      const input = {
        platform: 'iOS' as const,
        projectPath: '/path/to/project',
        workflowStateData: null as any, // Intentionally invalid
      };

      const result = await tool.handleRequest(input);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });
  });

  describe('Build Type Handling', () => {
    it('should include correct gradle command for Android debug build', async () => {
      const input = {
        platform: 'Android' as const,
        projectPath: '/path/to/project',
        buildType: 'debug' as const,
        workflowStateData: { thread_id: 'test-android-debug' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('./gradlew installDebug');
    });

    it('should include correct gradle command for Android release build', async () => {
      const input = {
        platform: 'Android' as const,
        projectPath: '/path/to/project',
        buildType: 'release' as const,
        workflowStateData: { thread_id: 'test-android-release' },
      };

      const result = await tool.handleRequest(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('./gradlew installRelease');
    });
  });
});
