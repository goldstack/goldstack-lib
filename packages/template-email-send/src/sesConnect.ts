import { getAWSUser } from '@goldstack/infra-aws';
import SES from 'aws-sdk/clients/ses';

import {
  EmailSendPackage,
  EmailSendDeployment,
} from './types/EmailSendPackage';
import assert from 'assert';

import { PackageConfig } from '@goldstack/utils-package-config';

import { MockedSES } from './mockedSES';

let mockedSES: MockedSES | undefined;

export const getMockedSES = (): MockedSES => {
  if (!mockedSES) {
    mockedSES = new MockedSES();
  }
  return mockedSES;
};

export const connect = async (
  goldstackConfig: any,
  packageSchema: any,
  deploymentName?: string
): Promise<SES> => {
  const packageConfig = new PackageConfig<
    EmailSendPackage,
    EmailSendDeployment
  >({
    goldstackJson: goldstackConfig,
    packageSchema,
  });
  if (!deploymentName) {
    assert(
      process.env.GOLDSTACK_DEPLOYMENT,
      `Cannot connect to SES for package ${goldstackConfig.name}. Either specify a deploymentName or ensure environment variable GOLDSTACK_DEPLOYMENT is defined.`
    );
    deploymentName = process.env.GOLDSTACK_DEPLOYMENT;
  }

  if (deploymentName === 'local') {
    if (!mockedSES) {
      mockedSES = new MockedSES();
    }
    return mockedSES as any;
  }

  const config = packageConfig.getConfigFromPackageConfig(goldstackConfig);
  const deployment = packageConfig.getDeployment(config, deploymentName);

  const awsUser = await getAWSUser(deployment.awsUser);

  const ses = new SES({
    apiVersion: '2010-12-01',
    credentials: awsUser,
    region: deployment.awsRegion,
  });

  return ses;
};

export const getFromDomain = async (
  goldstackConfig: any,
  packageSchema: any,
  deploymentName?: string
): Promise<string> => {
  const packageConfig = new PackageConfig<
    EmailSendPackage,
    EmailSendDeployment
  >({
    goldstackJson: goldstackConfig,
    packageSchema,
  });
  if (!deploymentName) {
    assert(
      process.env.GOLDSTACK_DEPLOYMENT,
      `Cannot connect to SES for package ${goldstackConfig.name}. Either specify a deploymentName or ensure environment variable GOLDSTACK_DEPLOYMENT is defined.`
    );
    deploymentName = process.env.GOLDSTACK_DEPLOYMENT;
  }

  if (deploymentName === 'local') {
    return 'test.local';
  }

  const config = packageConfig.getConfigFromPackageConfig(goldstackConfig);
  const deployment = packageConfig.getDeployment(config, deploymentName);

  return deployment.configuration.domain;
};
