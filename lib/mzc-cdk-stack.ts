import * as cdk from '@aws-cdk/core';
import * as ecr from '@aws-cdk/aws-ecr';
import * as eks from '@aws-cdk/aws-eks';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as iam from '@aws-cdk/aws-iam';
const fs = require('fs');



export class MzcCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    let config: any = JSON.parse(fs.readFileSync("./appconfig.json").toString());
    //console.log(config.ops_repo)

    const ecrRepo = new ecr.Repository(this, 'EcrRepo');
    
    const repository = new codecommit.Repository(this, 'CodecommitRepo', {
      repositoryName: `${this.stackName}-repo`,
      description: "Application code",
    });
    
    
    const pipeline = new codepipeline.Pipeline(this, 'Mypipeline', {
      pipelineName: `${this.stackName}-pipeline`,
    })
    
    new cdk.CfnOutput(this, "application_repository", { value: `${repository.repositoryCloneUrlHttp}` });
    new cdk.CfnOutput(this, "ecr_repository", { value: `${ecrRepo.repositoryUri}` });
    
    const source_output = new codepipeline.Artifact();
    const docker_output = new codepipeline.Artifact("Docker");
    
    const buildspec_docker = codebuild.BuildSpec.fromSourceFilename("buildspec.yml");
    const docker_build = new codebuild.PipelineProject(this, "DockerBuild", {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true,
      },
      environmentVariables: {
        REPO_ECR: {
          value: `${ecrRepo.repositoryUri}`,
        },
        REPO_ECR_NAME: {
          value: `${ecrRepo.repositoryUri}`,
        },
        OPS_REPO: {
          value: config.ops_repo,
        },
        ARGO_URL: {
          value: config.argo_url,
        },
        ARGO_PW: {
          value: config.argo_password,
        },
        APP_NAME: {
          value: `${this.stackName.toLowerCase()}`,
        },
      },
      buildSpec: buildspec_docker,
    })
    
    ecrRepo.grantPullPush(docker_build);
    docker_build.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["ecr:BatchCheckLayerAvailability", "ecr:GetDownloadUrlForLayer", "ecr:BatchGetImage"],
      resources: [`arn:${cdk.Stack.of(this).partition}:ecr:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:repository/*`],
    }))
    docker_build.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["codecommit:*"],
      resources: [`arn:aws:codecommit:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`],
    }))
    
    const source_action = new codepipeline_actions.CodeCommitSourceAction({
      actionName: "CodeCommit_Source",
      repository: repository,
      output: source_output,
      branch: "master"
    })
    
    pipeline.addStage({
      stageName: "Source",
      actions: [source_action]
    })
    
    pipeline.addStage({
     stageName: "DockerBuild",
     actions: [
        new codepipeline_actions.CodeBuildAction({
        actionName: "DockerBuild_and_Push_ECR",
        project: docker_build,
        input: source_output,
        outputs: [docker_output]
       })
       ]
    })

  }
}


