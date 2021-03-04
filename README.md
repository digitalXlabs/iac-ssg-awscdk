# AWS CDK Project for Hugo Static Site Generator (SSG) Infrastructure

Hello and welcome, thanks for dropping by. We built this project to demonstrate how you can automate building out the infrastructure required on AWS to serve a site built using the Hugo static site generator.

As a consultancy, we often deploy sites that don't require complicated CMS's using a static site generator, and whilst there are many service operators such as forestry.io etc that you can use to deploy your sites and infrastructure, or even applcations in AWS marketplace, we as developers always need to understand the underlying code, we need to know what's going on.

In addition, we don't like doing task set ups repeatedly, so writing in in code is absolutely the best thing EVER!

If you've ever had to do this for your clients, you know exactly the pain it can be, remembering settings, where the lambdas are, how to configure the cloudfront settings, what if you could deploy the stack in a couple minutes, only needing to know

* The name of your client
* A unique client id
* the root domain
* the alterate domain prefixes

Thats it. How easy would that be?

For example - The synth command?

`cdk synth --context domainName=example.com --context ownerClientId=123x --context ownerName='My Acme Client' `

and the deploy command?

`cdk deploy --context domainName=example.com --context ownerClientId=123x --context ownerName='My Acme Client'  --all`


That's bloody it!

## Prerequisites & caveats

To use this software you need a couple of things in place before you start

1. An AWS account
2. An IAM user that has programmatic access key and secret active
3. These access key and access secret set in a profile or as environment variables
4. The CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION environment variables set
5. A Hosted Zone set up for your root domain on AWS Route 53
6. Node version >=12.x
7. AWS CDK installed `npm install -g aws-cdk`
   
## What is it all about?
This project uses the [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html) to create a cloudformation template that will deploy all the necessary resources that you need to host  a [Hugo](https://gohugo.io) Generated Static Site.

Using the CDK, we will deploy our infrastructure as code and the following resources will be created

* Route 53: Hosted Zone
* Route 53: A Record Sets
* S3: Bucket to store website HTML and other assets
* Cloudfront: Distribution, origins and behaviours
* Certificate Manager: SSL certifications for our domain/subdomain
* Lambda: Edge function for cloudfront Origin Request url redirections

We go into a bit of detail below on each of these resources. We will attempt to detail any omissions (things we have yet to code so you may need to tweak in the AWS console)

### Standard Lambda Edge function for url redirection

This Lambda is triggered by cloudfront. When an object requested by the client is not in the Cloudfront cache, it will trigger this lambda, which in turn will rewrite the request uri and headers to deliver the correct resource uri

### Route 53 Hosted Zone

I know we said above that you should have a hosted zone set up, but if you don't this stack will set it up for you. 

**CAVEAT** 

If your nameservers haven't propogated, you may get unpredictable results so do at least set up the hosted zone to make things easy on yourself

### ACM SSL Certificate

Cloudfront will only work with HTTPS domains, so we user AWS Certificate Manager to create SSL certifications for your sub/domain
### Route 53 Record Sets

The necessary A records that point to your cloudfront distribution
### S3 Bucket

The bucket used to store the Hugo generated static files and assets
### Cloudfront Distribution, Origins and Behaviours
The cloudfront Distribution and the requistite origins and behaviours that you need to serve your Hugo generated static website from a cloud distribution network.

**CAVEAT**

Some of the nicities are not included currently, like setting up the error docs and such at the present time

## Installation

1. To install, clone this repository to your local machine
2. cd into the directory and run `npm install`
3. Run `npm run build` or `npm run watch`

## Setting up local environment

1. export AWS_Profile=<yourprofile>
2. export CDK_DEFAULT_ACCOUNT=<youraccount> 
3. export CDK_DEFAULT_REGION=<yourdefaultregion>

## Deploying
6. Check that your template with synthesize by either
   1. Make adjustments in cdk.json file entering the values you need for 'ownnerName', 'ownerClientId' and 'domainName' or 
   2. Issue command `cdk synth --context domainName=<fully.qualified.domain.name> --context ownerClientId=<clientid> --context ownerName='<your client name' YourClientNameHugoStack -e` (replace the values between the <>)
7. If you have never used the CDK in your AWS account, you will need to [bootstrap](https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html) it by running the command `cdk bootstrap aws://ACCOUNT-NUMBER-1/REGION-1 aws://ACCOUNT-NUMBER-2/REGION-2 ...`
8. If you have no errors, you can issue the deploy command `cdk deploy --context domainName=<fully.qualified.domain.name> --context ownerClientId=<clientid> --context ownerName='<your client name>' --all`
9.  Add the additional context `--context prod=true` if you're deployign to a production environment. This will create example.com, www.example.com and prod.example.com for as alternate names for the cloudfront distribution and will also add example.com and *.example.com to your certicate


## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
