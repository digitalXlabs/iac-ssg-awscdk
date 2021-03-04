
let response

const regex = /\.[a-z0-9]+$/
const indexDocument = 'index.html'

  export const handler = async (event: any) => {
  const cf = event.Records[0].cf
  const config = cf.config
  const request = cf.request
  
  if (request.uri.endsWith('/')) {
    return Object.assign({}, request, { uri: `${request.uri}${indexDocument}` })
  } else if (request.uri.endsWith(`/${indexDocument}`)) {
    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [
          {
            key: 'Location',
            value: request.uri.substr(0, request.uri.length - indexDocument.length)
          }
        ]
      }
    }
  } else if (!regex.test(request.uri)) {
    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [
          {
            key: 'Location',
            value: `${request.uri}/`
          }
        ]
      }
    }
  } else {
    return request
  }
}
