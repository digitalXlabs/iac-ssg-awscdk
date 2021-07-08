// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
const SES = require('aws-sdk/clients/ses');

const dynamodb = require('aws-sdk/clients/dynamodb')
const docClient = new dynamodb.DocumentClient()
// Get the DynamoDB table name from environment variables
const tableName = process.env.TABLE
// set email params

const emailReply = process.env.EMAILREPLY
const emailSource = process.env.EMAILSOURCE
const emailTemplate = process.env.CONFIRMTEMPLATE

const qs = require('querystring')

export const handler = async (event: any) => {

  const camelCase = (str: string) => {
    return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
  }

  const unCamelCase = (str: string) => {
    return str
      // insert a space before all caps
      .replace(/([A-Z])/g, ' $1')
      // uppercase the first character
      .replace(/^./, function (str) { return str.toUpperCase(); })
  }

  const normaliseExport = (data: any) =>
    Object.assign({}, ...Object.keys(data).map(k => {
      return { [camelCase(k)]: data[k] };
    }));

  const unNormaliseExport = (data: any) =>
    Object.assign({}, ...Object.keys(data).map(k => {
      return { [unCamelCase(k)]: data[k] };
    }));

  const responseSuccess = async (res: any) => {
    console.log("successresponse", JSON.stringify(res, null, 2))
    return {
      statusCode: res.statusCode || 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: res.response || `ok`
      })
    }
  }

  const responseError = async (err: any) => {
    console.error("err response", JSON.stringify(err, null, 2))

    throw {
      statusCode: err.statusCode || 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      requestId: event.requestContext.requestId,
      body: JSON.stringify({
        message: err.message || 'Bad request'
      })
    }
  }


  const addRecord = async (e: any) => {

    let today = new Date()
    let sevenDays = Math.floor(today.setDate(today.getDate() + 7)  / 1000)

    let data = {
      email: null
    }
    // Get id and name from the body of the request
    try {
      data = JSON.parse(e.body)
    }
    catch (err) {
      // not json so try for  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      if ((e.headers['content-type']) && e.headers['content-type'].includes('application/x-www-form-urlencoded')) {
        Object.assign(data, qs.parse(e.body))
      }
      else {
        throw err
      }
    }

    Object.assign(data, {
      id: e.requestContext.requestId,
      requestTime: Date.now(),
      verified: false,
      expiresAt: sevenDays
    })

    const params = {
      TableName: tableName,
      Item: normaliseExport(data),
      ConditionExpression: `attribute_not_exists(email)`
    }

    await docClient.put(params).promise()
    return normaliseExport(data)
  }

  const getRecord = async (id: string) => {

    const params = {
      TableName: tableName,
      Key: { id: id },
    };
    return docClient.get(params).promise();

  }

  const confirmEmail = async (record: any) => {
    // change verfied to true
    record.Item.verified = true

    let today = new Date()
    let yearaway = Math.floor(today.setDate(today.getDate() + 367) / 1000)

    // extend the expiresAt
    record.Item.expiresAt = yearaway
    record.Item.verifiedAt = Date.now()

    const params = {
      TableName: tableName,
      Item: record.Item,
      ReturnValues: 'ALL_OLD'
    }

    return docClient.put(params).promise()
  }

  const sendEmailViaTemplate = async (template: any, data: any) => {
    const ses = new SES({
      region: "eu-west-1"
    });

    const params = {
      Destination: { /* required */
        BccAddresses: [
          emailReply,
          /* more items */
        ],

        ToAddresses: [
          data.email,
          /* more items */
        ]
      },
      Source: emailSource, /* required */
      Template: template, /* required */
      TemplateData: JSON.stringify(data), /* required */
      // ConfigurationSetName: 'STRING_VALUE',
      ReplyToAddresses: [
        emailReply,
        /* more items */
      ]
    };

    return ses.sendTemplatedEmail(params).promise();

  }



  try {
    let response

    switch (event.httpMethod) {
      case 'POST': {
        // All log statements are written to CloudWatch
        console.log(event)
        const data = await addRecord(event)
        await sendEmailViaTemplate(emailTemplate, data)
        // await sendEmail('OBRegisterInterestEmailVerify', data)
        response = await responseSuccess({
          statusCode: 201,
          response: data.Attributes
        })
        break;
      }
      case 'PATCH': {
        // used to verify a users email registration
        if (event.pathParameters.proxy === 'verify') {
          const id = JSON.parse(event.body).id;
          const record = await getRecord(id)
          const fini = await confirmEmail(record);

          response = await responseSuccess({
            statusCode: 201,
            response: fini.Attributes
          });

        }
        break
      }
      // case 'GET': {
      //   const data = await getRecord(event)
      //   response = responseSuccess({
      //     statusCode: 200,
      //     data: data.Item
      //   })
      //   break;
      // }
      default: {
        throw new Error('Method not allowed')
      }

    }


    return response
  } catch (err) {
    // throw err
    return responseError(err)
  }
}


