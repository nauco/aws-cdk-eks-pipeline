#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MzcCdkStack } from '../lib/mzc-cdk-stack';


const app = new cdk.App();

const name = app.node.tryGetContext("name")
const region = app.node.tryGetContext("region")


new MzcCdkStack(app, 'MzcCdkStack', {
  
});
