#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MzcCdkStack } from '../lib/mzc-cdk-stack';
const fs = require('fs');

const app = new cdk.App();

const name = app.node.tryGetContext("name")
const region = app.node.tryGetContext("region")
let config: any = JSON.parse(fs.readFileSync("./appconfig.json").toString());

new MzcCdkStack(app, config.stack_name, {
  
});
