# Hugo Static Site Generator Deploy IaC using AWS CDK

Hello, and welcome. Thanks for dropping by. We built this project to demonstrate how you can automate building out the infrastructure required on AWS to serve a site built using the Hugo static site generator.

As a consultancy, we often deploy sites that don't require complicated CMS's using a static site generator. There are many service operators such as forestry.io or Netlify, which you can use to deploy your sites and infrastructure. There are also applications available in the AWS marketplace that will deploy with the push of a button. However, as developers, we always need to understand the underlying code. We need to know what's going on.

Besides, we don't like doing task setups repeatedly, so writing in code is absolutely the best thing EVER!

If you've ever had to do this for your clients, you know exactly the pain it can be, remembering settings, where the lambdas are, how to configure the CloudFront settings, what if you could deploy the stack in a couple of minutes, only needing to know:

* The name of your client
* A unique client id
* the root domain
* the alternate domain prefixes

That's it. How easy would that be?

For example - The synth command?

`cdk synth --context domainName=example.com --context ownerClientId=123x --context ownerName='My Acme Client' `

And the deploy command?

`cdk deploy --context domainName=example.com --context ownerClientId=123x --context ownerName='My Acme Client'  --all`


That's bloody it!

## Prerequisites 

To use this software, you need a couple of things in place before you begin.

1. An AWS account
2. An IAM user that has programmatic access key and secret active
3. These access key and access secret set in a profile or as environment variables
4. The CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION environment variables set
5. A Hosted Zone set up for your root domain on AWS Route 53
6. Node version >=12.x
7. AWS CDK needs to be installed `npm install -g aws-cdk`
   
## Caveats

1. This code won't deploy your Hugo site for you, only the infrastructure

## What is it all about?
This project uses the [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html) to create a cloud formation template that will deploy all the necessary resources that you need to host a [Hugo](https://gohugo.io) Generated Static Site.

Using the CDK, we will deploy our infrastructure as code, and the following resources will be created.

* Route 53: Hosted Zone
* Route 53: A Record Sets
* S3: Bucket to store website HTML and other assets
* Cloudfront: Distribution, origins and behaviours
* Certificate Manager: SSL certifications for our domain/subdomain
* Lambda: Edge function for CloudFront Origin Request URL redirections

We go into a bit of detail below on each of these resources. We will attempt to detail any omissions (things we have yet to code, so you may need to tweak in the AWS console)

### Standard Lambda Edge function for url redirection

CloudFront triggers this Lambda when an object requested by the client is not in the Cloudfront cache. The  Lambda,  in turn, will rewrite the request URI and headers to deliver the correct resource URI.

### Route 53 Hosted Zone

I know we said above that you should have a hosted zone set up, but this stack will set it up for you if you don't. 

**CAVEAT** 

If your nameservers haven't propagated, you may get unpredictable results, so do at least set up the hosted zone to make things easy on yourself.

### ACM SSL Certificate

Cloudfront will only work with HTTPS domains, so we user, AWS Certificate Manager, to create SSL certifications for your sub/domain
### Route 53 Record Sets

The necessary A records that point to your CloudFront distribution

### S3 Bucket

The bucket used to store the Hugo generated static files and assets.

### Cloudfront Distribution, Origins and Behaviours
The CloudFront distribution and the requisite origins and behaviours you need to serve your Hugo generated a static website from a cloud distribution network.

**CAVEAT**

Some of the niceties are not included currently, like setting up the error docs and such at present.

## Installation

1. To install, clone this repository to your local machine
2. cd into the directory and run `npm install`
3. Run `npm run build` or `npm run watch`

## Setting up a local environment

1. `export AWS_Profile=<yourprofile>`
2. `export CDK_DEFAULT_ACCOUNT=<youraccount> `
3. `export CDK_DEFAULT_REGION=<yourdefaultregion>`


## Bootstrap CDK

If you have never used the CDK in your AWS account, you will need to [bootstrap](https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html) it, which means you provision the initial resources needed to perform deployment. Do this by running the command:

   `cdk bootstrap aws://ACCOUNT-NUMBER-1/REGION-1 aws://ACCOUNT-NUMBER-2/REGION-2`

You will need to bootstrap AWS region us-east-1 to hold the lambdaEdge function included with the package, if you are using a different region for your main package, then also add this to the command.

Bootstrapping will create a Cloudformation template called CDKToolkit in each of the regions that you've stated should be bootstrapped. It will also create S3 buckets in each of the regions specified to store the assets needed for the CDK to work.

Once finished, if all goes well, you will see 

`Environment aws://ACCOUNT-NUMBER-1/REGION-1 bootstrapped.`

`Environment aws://ACCOUNT-NUMBER-1/REGION-2 bootstrapped.`

## Deploy using `cdk.json`

1. Make adjustments in the cdk.json file, entering the values you need for 'ownerName', 'ownerClientId', 'domainName' and 'account' and the 'isProd' flag
2. Run the command `cdk ls` which will show you the two stacks that will be built and deployed, one for the lambda edge function and one for the main stack
3. Run `cdk deploy --all` to deploy all the stacks. 
4. You will be asked to confirm deployment for two stacks, answer `y` in both cases
5. The initial deployment can take up to 15 minutes to deploy


## Deploy using command line context parameters

1. Run the deploy command and add the context values to the command `cdk deploy --context domainName=<fully.qualified.domain.name> --context ownerClientId=<clientid> --context ownerName='<your client name>' --context account<yourawsaccountnumber>  --all`
2. Add the additional context `--context prod=true` if you're deploying to a production environment. This will create Route53  domains example.com, www.example.com and prod.example.com  as alternate names for the CloudFront distribution. It will also add example.com and *.example.com to your certificate

## Destroying the stacks
To destroy the stacks
1. if you used the cdk.json method, run cdk destroy
2. If you used the command line context `cdk destroy --context domainName=<fully.qualified.domain.name> --context ownerClientId=<clientid> --context ownerName='<your client name>' --context account<yourawsaccountnumber>  --all`

** NB it is possible if the lambdaEdge function has propogated, you will get an error stating the CDK is unable to delete your stack because the LambdaEdge functio is a replicated function. If this happens you will need to delete the stack from the console, excluding the lambda edge function which may take a few hours before it is able to be deleted


# Wrapping up
You have completed your first CDK enabled Cloudformation template and AWS resources. Clicking through the AWS management console, you will see that it has created the following resources for you.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with the current state
 * `cdk synth`       emits the synthesized CloudFormation template
