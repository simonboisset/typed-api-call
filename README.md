# typed-api-call

Typesafe api call generator. Make your external api cal safer and easier

## Installation

```bash
npm install typed-api-call
```

## Introduction

This library is a wrapper around the fetch api. It allows you to define your api calls and their schemas. It will then generate a function that will make the api call for you and return the response with the right type.

It's typesafe, so you can't make a mistake in your api call definition or in the api call itself. It will also check the response of your api call and throw an error if it doesn't match the schema.

Currently, it only supports zod for the schemas, but it will be possible to use other libraries in the future.

If you have any suggestion or question, feel free to open an issue.

## Usage

```typescript
import { createApiCall } from 'typed-api-call';
import { z } from 'zod';

export const getHeaders = ({ token }: { token?: string }) => {
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Content-Type', 'application/json');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  return headers;
};

const myApiCall = createApiCall({ url: 'https://my-api.com/', getHeaders });

// GET https://my-api.com/users

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

const getusers = myApiCall({
  url: 'users',
  method: 'GET',
  input: z.object({ email: z.array(z.string().email()) }),
  response: z.object({ data: z.array(userSchema) }),
});

const users = await getusers({ params: undefined, data: { email: ['jonh.doe@gmail.com'] } });

// Patch https://my-api.com/users/${userId}

const patchUser = myApiCall({
  url: 'users/${userId}',
  method: 'PATCH',
  params: z.object({ userId: z.string() }),
  input: userSchema,
  response: userSchema,
});

// Be careful, you must provide the same params name in the url and in the params
```

## Api

### createApiCall

```typescript
const myApiCall = createApiCall({ url: 'https://my-api.com/', getHeaders });
```

- `url`: The base url of your api
- `getHeaders`: A function that return the headers of your api call

If getHeaders has parameters, you can pass them to the api call like this:

In the api call definition:

```typescript
const patchUser = myApiCall({
  url: 'users/${userId}',
  method: 'PATCH',
  ...

  headers: { token } // token is a parameter of getHeaders and will be passed to it
});
```

Or in the api call itself:

```typescript
const users = await getusers({
  params: { userId: 'xxx' },
  data: { email: ['jonh.doe@gmail.com'] },
  headers: { token },
});
```

### ApiCall definition

```typescript
const getuser = myApiCall({
  url: 'users/${userId}',
  method: 'GET',
  headers: { token },
  input: z.object({ email: z.array(z.string().email()) }),
  response: z.object({ data: z.array(userSchema) }),
  params: z.object({ userId: z.string() }),
});
```

- `url`: The url of your api call. You can use `${paramName}` to use a parameter in the url
- `method`: The method of your api call
- `headers`: The headers of your api call if you need to override the default headers
- `input`: The schema of the data you send to your api call
- `response`: The schema of the data you receive from your api call
- `params`: The schema of the parameters you pass to your api call, if you use `${paramName}` in the url

### Api call

```typescript
const users = await getusers({
  params: { userId: 'xxx' },
  data: { email: ['jonh.doe@gmail.com'] },
  headers: { token },
});
```

- `params`: The parameters of your api call if you use `${paramName}` in the url
- `data`: The data you send to your api call
- `headers`: The headers of your api call if you need to override the default headers
