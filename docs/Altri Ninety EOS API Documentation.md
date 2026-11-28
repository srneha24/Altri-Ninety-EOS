# Altri Ninety EOS API Documentation

Base URLs: <backend-url>

# Authentication

- HTTP Authentication, scheme: bearer

# Altri Ninety EOS

## POST Login

POST /auth/login

> Body Parameters

```json
{
    "email": "avery@acme.test"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|yes|none|
|» email|body|string(email)|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "token": {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3OTU0NjI5MDIsImV4cCI6MTc5NTQ2NjUwMiwianRpIjoiZWQyZTgzNTM4ZjYzNGYzYjgyMDI5YmRjMWI0YjMwM2EifQ.nOV_7SbHa_G7wRqbZbzT5Ws1Wf5E24zAasOR0Mb97XY",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzk1NDYyOTAyLCJleHAiOjE3OTYwNjc3MDIsImp0aSI6IjNmYTFiMTFjZTRhNDRhMTY4ZmJmYTlkMjIwZTUwNzk2In0.iAwO8SZcj9X_-5j2od_h1tPQBl9CqEGeyfs7QtP5xk0",
            "token_type": "bearer"
        }
    }
}
```

> 401 Response

```json
{
    "success": false,
    "message": "User not found",
    "data": null
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» token|object|true|none||none|
|»»» access_token|string|true|none||none|
|»»» refresh_token|string|true|none||none|
|»»» token_type|string|true|none||none|

HTTP Status Code **401**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|null|true|none||none|

## POST Refresh Token

POST /auth/refresh

> Body Parameters

```json
{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzk1NDY0ODk5LCJleHAiOjE3OTYwNjk2OTksImp0aSI6IjE5YjVhN2U2NGUyYjRmMzc5M2MxMTk2Yzk0Yzg0ZGIyIn0.jEUaLO3HoXX0DZvqPAZ17ms8Hd4bRESdkKUPTcrXelQ"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|yes|none|
|» refresh_token|body|string|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "token": {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3OTU0NjQ5MjYsImV4cCI6MTc5NTQ2ODUyNiwianRpIjoiYmZjMDZhNzg2NGMyNGQ4OGIwNzQ2YTJhYzliN2E1YTMifQ.9pcbRjB7aEE-awN1zsElosIR8tG-6RzaqFAxBW7K_Pw",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzk1NDY0OTI2LCJleHAiOjE3OTYwNjk3MjYsImp0aSI6ImM3ZWU4ZGFmZjU2NTRmYWVhMzFjOWQ4YmFmZTg2Zjk4In0.2RiO3xmEKgaA9SU8XrdFwMAs4mrUyxD5xnZuMdqA6Rs",
            "token_type": "bearer"
        }
    }
}
```

> 400 Response

```json
{
    "success": false,
    "message": "Invalid token",
    "data": null
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» token|object|true|none||none|
|»»» access_token|string|true|none||none|
|»»» refresh_token|string|true|none||none|
|»»» token_type|string|true|none||none|

HTTP Status Code **400**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|null|true|none||none|

## GET Get Logged In User

GET /auth/me

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "u1",
        "name": "Avery Admin",
        "role": "admin"
    }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» name|string|true|none||none|
|»» role|string|true|none||none|

## GET Get User Teams

GET /auth/teams

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "teams": [
            {
                "id": "team_lead",
                "name": "Leadership"
            },
            {
                "id": "team_sales",
                "name": "Sales"
            },
            {
                "id": "team_ops",
                "name": "Operations"
            }
        ]
    }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» teams|[object]|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|

## GET Get Team Members

GET /company/teams/{team_id}/members/

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": [
        {
            "id": "u2",
            "name": "Blake Brooks",
            "role": "team_member"
        },
        {
            "id": "u6",
            "name": "Finley Ford",
            "role": "team_member"
        },
        {
            "id": "u7",
            "name": "Gray Green",
            "role": "observer"
        },
        {
            "id": "u1",
            "name": "Avery Admin",
            "role": "admin"
        }
    ]
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|[object]|true|none||none|
|»» id|string|true|none||none|
|»» name|string|true|none||none|
|»» role|string|true|none||none|

## GET Get Scorecard

GET /traction/teams/{team_id}/scorecard

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|start_date|query|string(date)|yes|none|
|end_date|query|string(date)|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": [
        {
            "id": "m1",
            "name": "New deals closed",
            "unit": "count",
            "goal": {
                "type": "at_least",
                "value": 10
            },
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "scores": [
                {
                    "id": "score_366a13b706195f",
                    "created_at": "2026-11-11T15:00:00.330736+00:00",
                    "updated_at": "2026-11-11T15:00:00.330753+00:00",
                    "week_start": "2026-08-17",
                    "value": 12.0,
                    "measurable_id": "m1"
                },
                {
                    "id": "score_aae5129f61bd58",
                    "created_at": "2026-11-11T15:00:00.332029+00:00",
                    "updated_at": "2026-11-11T15:00:00.332043+00:00",
                    "week_start": "2026-08-24",
                    "value": 11.0,
                    "measurable_id": "m1"
                },
                {
                    "id": "score_31bc49a2c58d55",
                    "created_at": "2026-11-11T15:00:00.332720+00:00",
                    "updated_at": "2026-11-11T15:00:00.332732+00:00",
                    "week_start": "2026-08-31",
                    "value": 9.0,
                    "measurable_id": "m1"
                },
                {
                    "id": "score_396b3ef219dc50",
                    "created_at": "2026-11-11T15:00:00.333371+00:00",
                    "updated_at": "2026-11-11T15:00:00.333384+00:00",
                    "week_start": "2026-09-07",
                    "value": 10.0,
                    "measurable_id": "m1"
                },
                {
                    "id": "score_98508bca7aec5f",
                    "created_at": "2026-11-11T15:00:00.334044+00:00",
                    "updated_at": "2026-11-11T15:00:00.334056+00:00",
                    "week_start": "2026-09-14",
                    "value": 14.0,
                    "measurable_id": "m1"
                },
                {
                    "id": "score_ae09b2e75d265b",
                    "created_at": "2026-11-11T15:00:00.334690+00:00",
                    "updated_at": "2026-11-11T15:00:00.334702+00:00",
                    "week_start": "2026-09-21",
                    "value": 13.0,
                    "measurable_id": "m1"
                },
                {
                    "id": "score_dee8229c103a58",
                    "created_at": "2026-11-11T15:00:00.335309+00:00",
                    "updated_at": "2026-11-11T15:00:00.335321+00:00",
                    "week_start": "2026-09-28",
                    "value": 10.0,
                    "measurable_id": "m1"
                },
                {
                    "id": "score_f01ba45a06d750",
                    "created_at": "2026-11-11T15:00:00.335860+00:00",
                    "updated_at": "2026-11-11T15:00:00.335872+00:00",
                    "week_start": "2026-10-05",
                    "value": 8.0,
                    "measurable_id": "m1"
                },
                {
                    "id": "score_312d1f9e2f415d",
                    "created_at": "2026-11-11T15:00:00.336405+00:00",
                    "updated_at": "2026-11-11T15:00:00.336416+00:00",
                    "week_start": "2026-10-12",
                    "value": 11.0,
                    "measurable_id": "m1"
                },
                {
                    "id": "score_5fe9aee105eb51",
                    "created_at": "2026-11-11T15:00:00.336962+00:00",
                    "updated_at": "2026-11-11T15:00:00.336975+00:00",
                    "week_start": "2026-10-19",
                    "value": 12.0,
                    "measurable_id": "m1"
                },
                {
                    "id": "score_f86e0bcafe7356",
                    "created_at": "2026-11-11T15:00:00.337933+00:00",
                    "updated_at": "2026-11-11T15:00:00.337950+00:00",
                    "week_start": "2026-10-26",
                    "value": 9.0,
                    "measurable_id": "m1"
                }
            ],
            "cells": [
                {
                    "week_start": "2026-08-03",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-10",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-17",
                    "score_id": "score_366a13b706195f",
                    "value": 12.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-08-24",
                    "score_id": "score_aae5129f61bd58",
                    "value": 11.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-08-31",
                    "score_id": "score_31bc49a2c58d55",
                    "value": 9.0,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-09-07",
                    "score_id": "score_396b3ef219dc50",
                    "value": 10.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-14",
                    "score_id": "score_98508bca7aec5f",
                    "value": 14.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-21",
                    "score_id": "score_ae09b2e75d265b",
                    "value": 13.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-28",
                    "score_id": "score_dee8229c103a58",
                    "value": 10.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-05",
                    "score_id": "score_f01ba45a06d750",
                    "value": 8.0,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-10-12",
                    "score_id": "score_312d1f9e2f415d",
                    "value": 11.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-19",
                    "score_id": "score_5fe9aee105eb51",
                    "value": 12.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-26",
                    "score_id": "score_f86e0bcafe7356",
                    "value": 9.0,
                    "status": "off_track"
                }
            ],
            "created_at": "2026-11-11T15:00:00.322703+00:00",
            "updated_at": "2026-11-11T15:00:00.322716+00:00"
        },
        {
            "id": "m2",
            "name": "Customer churn",
            "unit": "%",
            "goal": {
                "type": "at_most",
                "value": 3.0
            },
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "scores": [
                {
                    "id": "score_1060f005a1915d",
                    "created_at": "2026-11-11T15:00:00.339731+00:00",
                    "updated_at": "2026-11-11T15:00:00.339746+00:00",
                    "week_start": "2026-08-17",
                    "value": 2.1,
                    "measurable_id": "m2"
                },
                {
                    "id": "score_d61bbefaa9775a",
                    "created_at": "2026-11-11T15:00:00.340411+00:00",
                    "updated_at": "2026-11-11T15:00:00.340425+00:00",
                    "week_start": "2026-08-24",
                    "value": 2.5,
                    "measurable_id": "m2"
                },
                {
                    "id": "score_4f1a8e23b6e05c",
                    "created_at": "2026-11-11T15:00:00.341120+00:00",
                    "updated_at": "2026-11-11T15:00:00.341132+00:00",
                    "week_start": "2026-08-31",
                    "value": 3.4,
                    "measurable_id": "m2"
                },
                {
                    "id": "score_d734cb3f7d5754",
                    "created_at": "2026-11-11T15:00:00.342126+00:00",
                    "updated_at": "2026-11-11T15:00:00.342148+00:00",
                    "week_start": "2026-09-07",
                    "value": 3.0,
                    "measurable_id": "m2"
                },
                {
                    "id": "score_7daa988c81f554",
                    "created_at": "2026-11-11T15:00:00.343297+00:00",
                    "updated_at": "2026-11-11T15:00:00.343338+00:00",
                    "week_start": "2026-09-14",
                    "value": 2.8,
                    "measurable_id": "m2"
                },
                {
                    "id": "score_f371362cf0995d",
                    "created_at": "2026-11-11T15:00:00.344368+00:00",
                    "updated_at": "2026-11-11T15:00:00.344385+00:00",
                    "week_start": "2026-09-21",
                    "value": 2.2,
                    "measurable_id": "m2"
                },
                {
                    "id": "score_d985cdd4119859",
                    "created_at": "2026-11-11T15:00:00.345324+00:00",
                    "updated_at": "2026-11-11T15:00:00.345341+00:00",
                    "week_start": "2026-09-28",
                    "value": 2.9,
                    "measurable_id": "m2"
                },
                {
                    "id": "score_0ea16000cac85b",
                    "created_at": "2026-11-11T15:00:00.346143+00:00",
                    "updated_at": "2026-11-11T15:00:00.346158+00:00",
                    "week_start": "2026-10-05",
                    "value": 3.1,
                    "measurable_id": "m2"
                },
                {
                    "id": "score_5e466496045a5b",
                    "created_at": "2026-11-11T15:00:00.347138+00:00",
                    "updated_at": "2026-11-11T15:00:00.347159+00:00",
                    "week_start": "2026-10-12",
                    "value": 2.0,
                    "measurable_id": "m2"
                },
                {
                    "id": "score_aadfedea321651",
                    "created_at": "2026-11-11T15:00:00.348308+00:00",
                    "updated_at": "2026-11-11T15:00:00.348325+00:00",
                    "week_start": "2026-10-19",
                    "value": 2.4,
                    "measurable_id": "m2"
                },
                {
                    "id": "score_1d715cdd889b5b",
                    "created_at": "2026-11-11T15:00:00.349382+00:00",
                    "updated_at": "2026-11-11T15:00:00.349420+00:00",
                    "week_start": "2026-10-26",
                    "value": 2.6,
                    "measurable_id": "m2"
                }
            ],
            "cells": [
                {
                    "week_start": "2026-08-03",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-10",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-17",
                    "score_id": "score_1060f005a1915d",
                    "value": 2.1,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-08-24",
                    "score_id": "score_d61bbefaa9775a",
                    "value": 2.5,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-08-31",
                    "score_id": "score_4f1a8e23b6e05c",
                    "value": 3.4,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-09-07",
                    "score_id": "score_d734cb3f7d5754",
                    "value": 3.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-14",
                    "score_id": "score_7daa988c81f554",
                    "value": 2.8,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-21",
                    "score_id": "score_f371362cf0995d",
                    "value": 2.2,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-28",
                    "score_id": "score_d985cdd4119859",
                    "value": 2.9,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-05",
                    "score_id": "score_0ea16000cac85b",
                    "value": 3.1,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-10-12",
                    "score_id": "score_5e466496045a5b",
                    "value": 2.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-19",
                    "score_id": "score_aadfedea321651",
                    "value": 2.4,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-26",
                    "score_id": "score_1d715cdd889b5b",
                    "value": 2.6,
                    "status": "on_track"
                }
            ],
            "created_at": "2026-11-11T15:00:00.324129+00:00",
            "updated_at": "2026-11-11T15:00:00.324140+00:00"
        },
        {
            "id": "m3",
            "name": "Avg first response",
            "unit": "hours",
            "goal": {
                "max": 4,
                "min": 2,
                "type": "between"
            },
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "scores": [
                {
                    "id": "score_33bd0729ef0756",
                    "created_at": "2026-11-11T15:00:00.351396+00:00",
                    "updated_at": "2026-11-11T15:00:00.351412+00:00",
                    "week_start": "2026-08-17",
                    "value": 3.0,
                    "measurable_id": "m3"
                },
                {
                    "id": "score_5d9a980d78ce5a",
                    "created_at": "2026-11-11T15:00:00.352321+00:00",
                    "updated_at": "2026-11-11T15:00:00.352343+00:00",
                    "week_start": "2026-08-24",
                    "value": 2.0,
                    "measurable_id": "m3"
                },
                {
                    "id": "score_a0dc07ec471a52",
                    "created_at": "2026-11-11T15:00:00.353356+00:00",
                    "updated_at": "2026-11-11T15:00:00.353371+00:00",
                    "week_start": "2026-08-31",
                    "value": 4.0,
                    "measurable_id": "m3"
                },
                {
                    "id": "score_9acda77a353c56",
                    "created_at": "2026-11-11T15:00:00.354319+00:00",
                    "updated_at": "2026-11-11T15:00:00.354334+00:00",
                    "week_start": "2026-09-07",
                    "value": 4.5,
                    "measurable_id": "m3"
                },
                {
                    "id": "score_8eb1fc62435b51",
                    "created_at": "2026-11-11T15:00:00.355309+00:00",
                    "updated_at": "2026-11-11T15:00:00.355325+00:00",
                    "week_start": "2026-09-14",
                    "value": 1.8,
                    "measurable_id": "m3"
                },
                {
                    "id": "score_95a6437fab265e",
                    "created_at": "2026-11-11T15:00:00.356207+00:00",
                    "updated_at": "2026-11-11T15:00:00.356224+00:00",
                    "week_start": "2026-09-21",
                    "value": 3.2,
                    "measurable_id": "m3"
                },
                {
                    "id": "score_c6ec9d74dc5456",
                    "created_at": "2026-11-11T15:00:00.356962+00:00",
                    "updated_at": "2026-11-11T15:00:00.356977+00:00",
                    "week_start": "2026-09-28",
                    "value": 2.5,
                    "measurable_id": "m3"
                },
                {
                    "id": "score_8d7fab9de8595b",
                    "created_at": "2026-11-11T15:00:00.357709+00:00",
                    "updated_at": "2026-11-11T15:00:00.357732+00:00",
                    "week_start": "2026-10-05",
                    "value": 3.9,
                    "measurable_id": "m3"
                },
                {
                    "id": "score_e24f7a4511ca59",
                    "created_at": "2026-11-11T15:00:00.360380+00:00",
                    "updated_at": "2026-11-11T15:00:00.360394+00:00",
                    "week_start": "2026-10-12",
                    "value": 4.1,
                    "measurable_id": "m3"
                },
                {
                    "id": "score_dec9def94c2057",
                    "created_at": "2026-11-11T15:00:00.361249+00:00",
                    "updated_at": "2026-11-11T15:00:00.361264+00:00",
                    "week_start": "2026-10-19",
                    "value": 2.0,
                    "measurable_id": "m3"
                },
                {
                    "id": "score_c279820f3c0c58",
                    "created_at": "2026-11-11T15:00:00.362026+00:00",
                    "updated_at": "2026-11-11T15:00:00.362039+00:00",
                    "week_start": "2026-10-26",
                    "value": 3.3,
                    "measurable_id": "m3"
                }
            ],
            "cells": [
                {
                    "week_start": "2026-08-03",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-10",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-17",
                    "score_id": "score_33bd0729ef0756",
                    "value": 3.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-08-24",
                    "score_id": "score_5d9a980d78ce5a",
                    "value": 2.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-08-31",
                    "score_id": "score_a0dc07ec471a52",
                    "value": 4.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-07",
                    "score_id": "score_9acda77a353c56",
                    "value": 4.5,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-09-14",
                    "score_id": "score_8eb1fc62435b51",
                    "value": 1.8,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-09-21",
                    "score_id": "score_95a6437fab265e",
                    "value": 3.2,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-28",
                    "score_id": "score_c6ec9d74dc5456",
                    "value": 2.5,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-05",
                    "score_id": "score_8d7fab9de8595b",
                    "value": 3.9,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-12",
                    "score_id": "score_e24f7a4511ca59",
                    "value": 4.1,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-10-19",
                    "score_id": "score_dec9def94c2057",
                    "value": 2.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-26",
                    "score_id": "score_c279820f3c0c58",
                    "value": 3.3,
                    "status": "on_track"
                }
            ],
            "created_at": "2026-11-11T15:00:00.324964+00:00",
            "updated_at": "2026-11-11T15:00:00.324975+00:00"
        },
        {
            "id": "m4",
            "name": "Payroll runs",
            "unit": "count",
            "goal": {
                "type": "exactly",
                "value": 1
            },
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "scores": [
                {
                    "id": "score_4dc3ae21695f54",
                    "created_at": "2026-11-11T15:00:00.363207+00:00",
                    "updated_at": "2026-11-11T15:00:00.363219+00:00",
                    "week_start": "2026-08-17",
                    "value": 1.0,
                    "measurable_id": "m4"
                },
                {
                    "id": "score_e1724e5fffe35a",
                    "created_at": "2026-11-11T15:00:00.363738+00:00",
                    "updated_at": "2026-11-11T15:00:00.363749+00:00",
                    "week_start": "2026-08-24",
                    "value": 1.0,
                    "measurable_id": "m4"
                },
                {
                    "id": "score_69dc47ad0e4650",
                    "created_at": "2026-11-11T15:00:00.364294+00:00",
                    "updated_at": "2026-11-11T15:00:00.364305+00:00",
                    "week_start": "2026-08-31",
                    "value": 0.0,
                    "measurable_id": "m4"
                },
                {
                    "id": "score_a845dcc7733254",
                    "created_at": "2026-11-11T15:00:00.364842+00:00",
                    "updated_at": "2026-11-11T15:00:00.364853+00:00",
                    "week_start": "2026-09-07",
                    "value": 1.0,
                    "measurable_id": "m4"
                },
                {
                    "id": "score_b90b0298e7115e",
                    "created_at": "2026-11-11T15:00:00.365408+00:00",
                    "updated_at": "2026-11-11T15:00:00.365419+00:00",
                    "week_start": "2026-09-14",
                    "value": 1.0,
                    "measurable_id": "m4"
                },
                {
                    "id": "score_f3fe444cb92557",
                    "created_at": "2026-11-11T15:00:00.365952+00:00",
                    "updated_at": "2026-11-11T15:00:00.365965+00:00",
                    "week_start": "2026-09-21",
                    "value": 2.0,
                    "measurable_id": "m4"
                },
                {
                    "id": "score_7a1a44bf6ba358",
                    "created_at": "2026-11-11T15:00:00.366502+00:00",
                    "updated_at": "2026-11-11T15:00:00.366515+00:00",
                    "week_start": "2026-09-28",
                    "value": 1.0,
                    "measurable_id": "m4"
                },
                {
                    "id": "score_a8f3b2ab83d350",
                    "created_at": "2026-11-11T15:00:00.367029+00:00",
                    "updated_at": "2026-11-11T15:00:00.367040+00:00",
                    "week_start": "2026-10-05",
                    "value": 1.0,
                    "measurable_id": "m4"
                },
                {
                    "id": "score_90126011b32b56",
                    "created_at": "2026-11-11T15:00:00.367549+00:00",
                    "updated_at": "2026-11-11T15:00:00.367560+00:00",
                    "week_start": "2026-10-12",
                    "value": 1.0,
                    "measurable_id": "m4"
                },
                {
                    "id": "score_ee639606933e52",
                    "created_at": "2026-11-11T15:00:00.368086+00:00",
                    "updated_at": "2026-11-11T15:00:00.368097+00:00",
                    "week_start": "2026-10-19",
                    "value": 1.0,
                    "measurable_id": "m4"
                },
                {
                    "id": "score_0082dc81bee858",
                    "created_at": "2026-11-11T15:00:00.368607+00:00",
                    "updated_at": "2026-11-11T15:00:00.368620+00:00",
                    "week_start": "2026-10-26",
                    "value": 0.0,
                    "measurable_id": "m4"
                }
            ],
            "cells": [
                {
                    "week_start": "2026-08-03",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-10",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-17",
                    "score_id": "score_4dc3ae21695f54",
                    "value": 1.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-08-24",
                    "score_id": "score_e1724e5fffe35a",
                    "value": 1.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-08-31",
                    "score_id": "score_69dc47ad0e4650",
                    "value": 0.0,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-09-07",
                    "score_id": "score_a845dcc7733254",
                    "value": 1.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-14",
                    "score_id": "score_b90b0298e7115e",
                    "value": 1.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-21",
                    "score_id": "score_f3fe444cb92557",
                    "value": 2.0,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-09-28",
                    "score_id": "score_7a1a44bf6ba358",
                    "value": 1.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-05",
                    "score_id": "score_a8f3b2ab83d350",
                    "value": 1.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-12",
                    "score_id": "score_90126011b32b56",
                    "value": 1.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-19",
                    "score_id": "score_ee639606933e52",
                    "value": 1.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-26",
                    "score_id": "score_0082dc81bee858",
                    "value": 0.0,
                    "status": "off_track"
                }
            ],
            "created_at": "2026-11-11T15:00:00.325807+00:00",
            "updated_at": "2026-11-11T15:00:00.325817+00:00"
        },
        {
            "id": "m5",
            "name": "Cash on hand",
            "unit": "$k",
            "goal": {
                "type": "at_least",
                "value": 500
            },
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "scores": [
                {
                    "id": "score_ff1ce3f3ee5954",
                    "created_at": "2026-11-11T15:00:00.369976+00:00",
                    "updated_at": "2026-11-11T15:00:00.369988+00:00",
                    "week_start": "2026-08-17",
                    "value": 510.0,
                    "measurable_id": "m5"
                },
                {
                    "id": "score_6d86756419f75c",
                    "created_at": "2026-11-11T15:00:00.370520+00:00",
                    "updated_at": "2026-11-11T15:00:00.370531+00:00",
                    "week_start": "2026-08-24",
                    "value": 495.0,
                    "measurable_id": "m5"
                },
                {
                    "id": "score_180e9ae6af3050",
                    "created_at": "2026-11-11T15:00:00.371566+00:00",
                    "updated_at": "2026-11-11T15:00:00.371587+00:00",
                    "week_start": "2026-08-31",
                    "value": 500.0,
                    "measurable_id": "m5"
                },
                {
                    "id": "score_1e955c08300553",
                    "created_at": "2026-11-11T15:00:00.372597+00:00",
                    "updated_at": "2026-11-11T15:00:00.372616+00:00",
                    "week_start": "2026-09-07",
                    "value": 530.0,
                    "measurable_id": "m5"
                },
                {
                    "id": "score_1c96c09695cb5f",
                    "created_at": "2026-11-11T15:00:00.373442+00:00",
                    "updated_at": "2026-11-11T15:00:00.373461+00:00",
                    "week_start": "2026-09-14",
                    "value": 505.0,
                    "measurable_id": "m5"
                },
                {
                    "id": "score_81d1bd16158c5e",
                    "created_at": "2026-11-11T15:00:00.374313+00:00",
                    "updated_at": "2026-11-11T15:00:00.374329+00:00",
                    "week_start": "2026-09-21",
                    "value": 520.0,
                    "measurable_id": "m5"
                },
                {
                    "id": "score_a61919e12bf15a",
                    "created_at": "2026-11-11T15:00:00.375244+00:00",
                    "updated_at": "2026-11-11T15:00:00.375259+00:00",
                    "week_start": "2026-09-28",
                    "value": 480.0,
                    "measurable_id": "m5"
                },
                {
                    "id": "score_14f367f18da45b",
                    "created_at": "2026-11-11T15:00:00.376043+00:00",
                    "updated_at": "2026-11-11T15:00:00.376059+00:00",
                    "week_start": "2026-10-05",
                    "value": 515.0,
                    "measurable_id": "m5"
                },
                {
                    "id": "score_c1c78969fa185c",
                    "created_at": "2026-11-11T15:00:00.376804+00:00",
                    "updated_at": "2026-11-11T15:00:00.376820+00:00",
                    "week_start": "2026-10-12",
                    "value": 540.0,
                    "measurable_id": "m5"
                },
                {
                    "id": "score_339e5a8ec0e851",
                    "created_at": "2026-11-11T15:00:00.377548+00:00",
                    "updated_at": "2026-11-11T15:00:00.377562+00:00",
                    "week_start": "2026-10-26",
                    "value": 525.0,
                    "measurable_id": "m5"
                }
            ],
            "cells": [
                {
                    "week_start": "2026-08-03",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-10",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-17",
                    "score_id": "score_ff1ce3f3ee5954",
                    "value": 510.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-08-24",
                    "score_id": "score_6d86756419f75c",
                    "value": 495.0,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-08-31",
                    "score_id": "score_180e9ae6af3050",
                    "value": 500.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-07",
                    "score_id": "score_1e955c08300553",
                    "value": 530.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-14",
                    "score_id": "score_1c96c09695cb5f",
                    "value": 505.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-21",
                    "score_id": "score_81d1bd16158c5e",
                    "value": 520.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-09-28",
                    "score_id": "score_a61919e12bf15a",
                    "value": 480.0,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-10-05",
                    "score_id": "score_14f367f18da45b",
                    "value": 515.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-12",
                    "score_id": "score_c1c78969fa185c",
                    "value": 540.0,
                    "status": "on_track"
                },
                {
                    "week_start": "2026-10-19",
                    "score_id": null,
                    "value": null,
                    "status": "off_track"
                },
                {
                    "week_start": "2026-10-26",
                    "score_id": "score_339e5a8ec0e851",
                    "value": 525.0,
                    "status": "on_track"
                }
            ],
            "created_at": "2026-11-11T15:00:00.326559+00:00",
            "updated_at": "2026-11-11T15:00:00.326569+00:00"
        }
    ]
}
```

> 403 Response

```json
{
    "success": false,
    "message": "Access denied",
    "data": null
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|[object]|true|none||none|
|»» id|string|true|none||none|
|»» name|string|true|none||none|
|»» unit|string|true|none||none|
|»» goal|object|true|none||none|
|»»» type|string|false|none||none|
|»»» value|integer|false|none||none|
|»»» max|integer|false|none||none|
|»»» min|integer|false|none||none|
|»» owner|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» scores|[object]|true|none||none|
|»»» id|string|true|none||none|
|»»» created_at|string(date-time)|true|none||none|
|»»» updated_at|string(date-time)|true|none||none|
|»»» week_start|string(date)|true|none||none|
|»»» value|number|true|none||none|
|»»» measurable_id|string|true|none||none|
|»» cells|[object]|true|none||none|
|»»» week_start|string(date)|true|none||none|
|»»» score_id|string¦null|true|none||none|
|»»» value|number¦null|true|none||none|
|»»» status|string|true|none||none|
|»» created_at|string|true|none||none|
|»» updated_at|string|true|none||none|

#### Enum

|Name|Value|
|---|---|
|status|on_track|
|status|off_track|

HTTP Status Code **403**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|null|true|none||none|

## PATCH Update Measurable Score

PATCH /traction/teams/{team_id}/scores/{score_id}

Can only be performed by Admins or Team Members belonging to the team.

> Body Parameters

```json
{
    "value": 3.9
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|score_id|path|string|yes|none|
|body|body|object|yes|none|
|» value|body|number|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Score Updated",
    "data": {
        "id": "score_366a13b706195f",
        "created_at": "2026-11-11T15:00:00.330736+00:00",
        "updated_at": "2026-11-11T15:03:40.248797+00:00",
        "week_start": "2026-08-17",
        "value": 3.9,
        "measurable_id": "m1"
    }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string(date-time)|true|none||none|
|»» updated_at|string(date-time)|true|none||none|
|»» week_start|string(date)|true|none||none|
|»» value|number|true|none||none|
|»» measurable_id|string|true|none||none|

## PUT Upsert Measurable Score

PUT /traction/teams/{team_id}/measurables/{measurable_id}/scores/{week_start}

Can only be performed by Admins or Team Members belonging to the team.

> Body Parameters

```json
{
    "value": 6.5
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|measurable_id|path|string|yes|none|
|week_start|path|string(date)|yes|none|
|body|body|object|yes|none|
|» value|body|number|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Score Saved",
    "data": {
        "id": "score_366a13b706195f",
        "created_at": "2026-11-11T15:00:00.330736+00:00",
        "updated_at": "2026-11-11T15:07:01.651193+00:00",
        "week_start": "2026-08-17",
        "value": 6.5,
        "measurable_id": "m1"
    }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string(date-time)|true|none||none|
|»» updated_at|string(date-time)|true|none||none|
|»» week_start|string(date)|true|none||none|
|»» value|number|true|none||none|
|»» measurable_id|string|true|none||none|

## GET Get Issues

GET /traction/teams/{team_id}/issues

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|status|query|string|no|none|
|priority|query|integer|no|none|
|owner_id|query|string|no|none|
|order_by|query|string|no|none|

#### Enum

|Name|Value|
|---|---|
|status|solved|
|status|unsolved|
|status|all|
|order_by|priority|
|order_by|-priority|
|order_by|created_at|
|order_by|-created_at|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": [
        {
            "id": "i4",
            "created_at": "2026-09-01T15:00:00+00:00",
            "updated_at": "2026-11-25T19:01:44.077130+00:00",
            "title": "Idea: quarterly customer survey",
            "priority": null,
            "solved_at": "2026-11-25T19:01:44.077016+00:00",
            "resolution_note": "This is a resolution text",
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "source": null
        },
        {
            "id": "i_41c2ade8438346",
            "created_at": "2026-11-26T08:24:07.469068+00:00",
            "updated_at": "2026-11-26T08:24:07.469135+00:00",
            "title": "Created issue 1",
            "priority": null,
            "solved_at": null,
            "resolution_note": null,
            "owner": {
                "id": "u1",
                "name": "Avery Admin"
            },
            "source": null
        },
        {
            "id": "i_1f6ef2ab7ebf45",
            "created_at": "2026-11-26T10:08:21.928029+00:00",
            "updated_at": "2026-11-26T10:08:21.928039+00:00",
            "title": "Publish hiring ad",
            "priority": null,
            "solved_at": null,
            "resolution_note": null,
            "owner": {
                "id": "u1",
                "name": "Avery Admin"
            },
            "source": {
                "todo_id": "t12",
                "title": "Publish hiring ad"
            }
        },
        {
            "id": "i2",
            "created_at": "2026-10-14T16:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.040615+00:00",
            "title": "Two key accounts at risk",
            "priority": 5,
            "solved_at": null,
            "resolution_note": null,
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "source": null
        },
        {
            "id": "i1",
            "created_at": "2026-10-20T14:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.038125+00:00",
            "title": "Hiring pipeline is slow",
            "priority": 5,
            "solved_at": null,
            "resolution_note": null,
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "source": null
        },
        {
            "id": "i7",
            "created_at": "2026-10-20T15:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.048689+00:00",
            "title": "Onboarding docs are outdated",
            "priority": 4,
            "solved_at": "2026-10-28T15:30:00+00:00",
            "resolution_note": "Assign an owner and refresh the docs.",
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "source": null
        },
        {
            "id": "i3",
            "created_at": "2026-10-05T15:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.041790+00:00",
            "title": "Support coverage on weekends",
            "priority": 3,
            "solved_at": null,
            "resolution_note": null,
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "source": null
        },
        {
            "id": "i5",
            "created_at": "2026-11-09T16:00:00+00:00",
            "updated_at": "2026-11-25T20:36:57.562679+00:00",
            "title": "New deals closed, week of Nov 2",
            "priority": 3,
            "solved_at": null,
            "resolution_note": null,
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "source": {
                "week_start": "2026-11-02",
                "measurable_id": "m1",
                "title": "New deals closed"
            }
        },
        {
            "id": "i6",
            "created_at": "2026-11-03T14:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.047690+00:00",
            "title": "Payroll runs, week of Oct 26",
            "priority": 2,
            "solved_at": "2026-11-04T15:40:00+00:00",
            "resolution_note": "Bank holiday moved the run; added a reminder.",
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "source": {
                "week_start": "2026-10-26",
                "measurable_id": "m4",
                "title": "Payroll runs"
            }
        }
    ]
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|[object]|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string(date-time)|true|none||none|
|»» updated_at|string(date-time)|true|none||none|
|»» title|string|true|none||none|
|»» priority|integer¦null|true|none||none|
|»» solved_at|string(date-time)¦null|true|none||none|
|»» resolution_note|string¦null|true|none||none|
|»» owner|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» source|object¦null|true|none||none|
|»»» todo_id|string|false|none||none|
|»»» title|string|true|none||none|
|»»» week_start|string(date)|false|none||none|
|»»» measurable_id|string|false|none||none|
|»»» rock_id|string|false|none||none|

## POST Create Issue

POST /traction/teams/{team_id}/issues

Can only be performed by Admins or Team Members belonging to the team.
Will return a 200 status code if an existing issue is found for the `source` if `source` is set, otherwise will return a 201 status code.

> Body Parameters

```json
{
    "source": {
        "measurable_id": "m1",
        "week_start": "2026-08-17"
    }
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|body|body|object|yes|none|
|» title|body|string|no|Required if `source` is not set.|
|» priority|body|integer¦null|no|none|
|» source|body|object¦null|no|If set, exactly one of `measurable_id`, `rock_id` and `todo_id` needs to be set, and if `measurable_id` is set, then `week_start` also needs to be set.|
|»» measurable_id|body|string|no|none|
|»» week_start|body|string(date)|no|Must be a **Monday**. Required if `measurable_id` is set|
|»» rock_id|body|string|no|none|
|»» todo_id|body|string|no|none|

> Response Examples

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "i_41c2ade8438346",
        "created_at": "2026-11-26T08:24:07.469068+00:00",
        "updated_at": "2026-11-26T08:24:07.469135+00:00",
        "title": "Created issue 1",
        "priority": null,
        "solved_at": null,
        "resolution_note": null,
        "owner": {
            "id": "u1",
            "name": "Avery Admin"
        },
        "source": null
    }
}
```

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "i_1f6ef2ab7ebf45",
        "created_at": "2026-11-26T10:08:21.928029+00:00",
        "updated_at": "2026-11-26T10:08:21.928039+00:00",
        "title": "Publish hiring ad",
        "priority": null,
        "solved_at": null,
        "resolution_note": null,
        "owner": {
            "id": "u1",
            "name": "Avery Admin"
        },
        "source": {
            "todo_id": "t12",
            "title": "Publish hiring ad"
        }
    }
}
```

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "i_92fc69fdcbae49",
        "created_at": "2026-11-11T15:08:18.315126+00:00",
        "updated_at": "2026-11-11T15:08:18.317560+00:00",
        "title": "New deals closed, week of Aug 17",
        "priority": null,
        "solved_at": null,
        "resolution_note": null,
        "owner": {
            "id": "u1",
            "name": "Avery Admin"
        },
        "source": {
            "measurable_id": "m1",
            "week_start": "2026-08-17",
            "title": "New deals closed, week of Aug 17"
        }
    }
}
```

> 200 Response

```json
{
  "success": true,
  "message": "string",
  "data": {
    "id": "string",
    "created_at": "string",
    "updated_at": "string",
    "title": "string",
    "priority": 1,
    "solved_at": "2019-08-24T14:15:22Z",
    "resolution_note": "string",
    "owner": {
      "id": "string",
      "name": "string"
    },
    "source": {
      "measurable_id": "string",
      "week_start": "2019-08-24",
      "rock_id": "string",
      "todo_id": "string"
    }
  }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string|true|none||none|
|»» updated_at|string|true|none||none|
|»» title|string|true|none||none|
|»» priority|integer¦null|true|none||none|
|»» solved_at|string(date-time)¦null|true|none||none|
|»» resolution_note|string¦null|true|none||none|
|»» owner|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» source|object|true|none||none|
|»»» measurable_id|string|false|none||none|
|»»» week_start|string(date)|false|none||none|
|»»» rock_id|string|false|none||none|
|»»» todo_id|string|false|none||none|

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string|true|none||none|
|»» updated_at|string|true|none||none|
|»» title|string|true|none||none|
|»» priority|integer¦null|true|none||none|
|»» solved_at|null|true|none||none|
|»» resolution_note|null|true|none||none|
|»» owner|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» source|object¦null|true|none||none|
|»»» measurable_id|string|false|none||none|
|»»» week_start|string(date)|false|none||none|
|»»» rock_id|string|false|none||none|
|»»» todo_id|string|false|none||none|
|»»» title|string|true|none||none|

## PATCH Update Issue

PATCH /traction/teams/{team_id}/issues/{issue_id}

Can only be performed by Admins or Team Members belonging to the team.

> Body Parameters

```json
{
    "priority": 3
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|issue_id|path|string|yes|none|
|body|body|object|yes|none|
|» title|body|string|no|none|
|» priority|body|integer¦null|no|none|
|» resolution_note|body|string¦null|no|Setting it null will fail if issue is already solved.|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "i_92fc69fdcbae49",
        "created_at": "2026-11-11T15:08:18.315126+00:00",
        "updated_at": "2026-11-11T15:09:23.896841+00:00",
        "title": "New deals closed, week of Aug 17",
        "priority": 3,
        "solved_at": null,
        "resolution_note": null,
        "owner": {
            "id": "u1",
            "name": "Avery Admin"
        },
        "source": {
            "week_start": "2026-08-17",
            "measurable_id": "m1",
            "title": "New deals closed"
        }
    }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string(date-time)|true|none||none|
|»» updated_at|string(date-time)|true|none||none|
|»» title|string|true|none||none|
|»» priority|integer|true|none||none|
|»» solved_at|string(date-time)¦null|true|none||none|
|»» resolution_note|string¦null|true|none||none|
|»» owner|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» source|object|true|none||none|
|»»» week_start|string(date)|false|none||none|
|»»» measurable_id|string|false|none||none|
|»»» title|string|true|none||none|
|»»» rock_id|string|false|none||none|
|»»» todo_id|string|false|none||none|

## GET Get Todos

GET /traction/teams/{team_id}/todos

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|done|query|boolean|no|none|
|issue_id|query|string|no|none|
|owner_id|query|string|no|none|
|order_by|query|string|no|none|

#### Enum

|Name|Value|
|---|---|
|order_by|due_date|
|order_by|-due_date|
|order_by|created_at|
|order_by|-created_at|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": [
        {
            "id": "t1",
            "created_at": "2026-09-08T21:00:00+00:00",
            "updated_at": "2026-11-25T19:18:42.287938+00:00",
            "title": "Draft survey questions",
            "due_date": "2026-09-15",
            "done_at": "2026-11-25T19:18:42.287823+00:00",
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "issue": null
        },
        {
            "id": "t2",
            "created_at": "2026-09-10T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.057911+00:00",
            "title": "Review support rota",
            "due_date": "2026-09-17",
            "done_at": "2026-09-17T20:00:00+00:00",
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "issue": null
        },
        {
            "id": "t10",
            "created_at": "2026-10-20T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.059032+00:00",
            "title": "Send renewal offers",
            "due_date": "2026-10-27",
            "done_at": "2026-10-26T19:00:00+00:00",
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "issue": null
        },
        {
            "id": "t11",
            "created_at": "2026-10-23T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.060082+00:00",
            "title": "Close Q3 books",
            "due_date": "2026-10-30",
            "done_at": "2026-11-02T05:30:00+00:00",
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "issue": null
        },
        {
            "id": "t12",
            "created_at": "2026-10-25T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.061081+00:00",
            "title": "Publish hiring ad",
            "due_date": "2026-11-01",
            "done_at": null,
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "issue": null
        },
        {
            "id": "t21",
            "created_at": "2026-10-27T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.063175+00:00",
            "title": "Call at-risk account A",
            "due_date": "2026-11-03",
            "done_at": "2026-11-03T17:00:00+00:00",
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "issue": null
        },
        {
            "id": "t22",
            "created_at": "2026-10-28T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.064022+00:00",
            "title": "Call at-risk account B",
            "due_date": "2026-11-04",
            "done_at": "2026-11-04T18:00:00+00:00",
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "issue": null
        },
        {
            "id": "t20",
            "created_at": "2026-10-28T15:35:00+00:00",
            "updated_at": "2026-11-23T16:43:26.062020+00:00",
            "title": "Assign onboarding docs owner",
            "due_date": "2026-11-04",
            "done_at": "2026-11-03T20:00:00+00:00",
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "issue": {
                "id": "i7",
                "title": "Onboarding docs are outdated"
            }
        },
        {
            "id": "t24",
            "created_at": "2026-10-29T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.065841+00:00",
            "title": "Interview panel prep",
            "due_date": "2026-11-05",
            "done_at": "2026-11-04T21:00:00+00:00",
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "issue": null
        },
        {
            "id": "t23",
            "created_at": "2026-10-29T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.064961+00:00",
            "title": "Update cash forecast",
            "due_date": "2026-11-05",
            "done_at": "2026-11-05T16:00:00+00:00",
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "issue": null
        },
        {
            "id": "t25",
            "created_at": "2026-10-30T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.066663+00:00",
            "title": "Partner API review",
            "due_date": "2026-11-06",
            "done_at": "2026-11-06T19:00:00+00:00",
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "issue": null
        },
        {
            "id": "t28",
            "created_at": "2026-10-30T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.069147+00:00",
            "title": "Board update draft",
            "due_date": "2026-11-06",
            "done_at": "2026-11-09T05:59:00+00:00",
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "issue": null
        },
        {
            "id": "t26",
            "created_at": "2026-10-31T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.067480+00:00",
            "title": "Weekend support pilot",
            "due_date": "2026-11-07",
            "done_at": "2026-11-06T22:00:00+00:00",
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "issue": null
        },
        {
            "id": "t27",
            "created_at": "2026-10-31T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.068335+00:00",
            "title": "Pricing benchmark",
            "due_date": "2026-11-07",
            "done_at": "2026-11-07T15:00:00+00:00",
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "issue": null
        },
        {
            "id": "t29",
            "created_at": "2026-11-01T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.069974+00:00",
            "title": "Vendor contract renewal",
            "due_date": "2026-11-08",
            "done_at": "2026-11-09T06:01:00+00:00",
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "issue": null
        },
        {
            "id": "t31",
            "created_at": "2026-11-03T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.071761+00:00",
            "title": "Send portal beta invites",
            "due_date": "2026-11-10",
            "done_at": null,
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "issue": null
        },
        {
            "id": "t30",
            "created_at": "2026-11-04T15:45:00+00:00",
            "updated_at": "2026-11-23T16:43:26.070813+00:00",
            "title": "Set payroll reminder",
            "due_date": "2026-11-11",
            "done_at": null,
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "issue": {
                "id": "i6",
                "title": "Payroll runs, week of Oct 26"
            }
        },
        {
            "id": "t32",
            "created_at": "2026-11-06T21:00:00+00:00",
            "updated_at": "2026-11-23T16:43:26.072628+00:00",
            "title": "Prep Q1 planning agenda",
            "due_date": "2026-11-13",
            "done_at": null,
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "issue": null
        },
        {
            "id": "t_cb57ebf1048f4e",
            "created_at": "2026-11-26T10:19:03.796902+00:00",
            "updated_at": "2026-11-26T10:19:03.796911+00:00",
            "title": "Created todo 1",
            "due_date": "2026-12-03",
            "done_at": null,
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "issue": null
        },
        {
            "id": "t_1d7419c1426448",
            "created_at": "2026-11-26T10:20:38.286926+00:00",
            "updated_at": "2026-11-26T10:20:38.286935+00:00",
            "title": "Created todo 2",
            "due_date": "2026-12-03",
            "done_at": null,
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "issue": {
                "id": "i_1f6ef2ab7ebf45",
                "title": "Publish hiring ad"
            }
        },
        {
            "id": "t_bad69cc57d5b43",
            "created_at": "2026-11-26T10:22:22.855837+00:00",
            "updated_at": "2026-11-26T10:22:22.855845+00:00",
            "title": "Created todo 3",
            "due_date": "2026-12-03",
            "done_at": null,
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "issue": {
                "id": "i_1f6ef2ab7ebf45",
                "title": "Publish hiring ad"
            }
        }
    ]
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|[object]|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string(date-time)|true|none||none|
|»» updated_at|string(date-time)|true|none||none|
|»» title|string|true|none||none|
|»» due_date|string|true|none||none|
|»» done_at|string(date-time)¦null|true|none||none|
|»» owner|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» issue|object¦null|true|none||none|
|»»» id|string|true|none||none|
|»»» title|string|true|none||none|

## POST Create Todo

POST /traction/teams/{team_id}/todos

Can only be performed by Admins or Team Members belonging to the team.

> Body Parameters

```json
{
    "title": "Created todo 3",
    "owner_id": "u4",
    "source_issue_id": "i_1f6ef2ab7ebf45"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|body|body|object|yes|none|
|» title|body|string|yes|none|
|» source_issue_id|body|string¦null|no|none|
|» owner_id|body|string|yes|none|

> Response Examples

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "t_cb57ebf1048f4e",
        "created_at": "2026-11-26T10:19:03.796902+00:00",
        "updated_at": "2026-11-26T10:19:03.796911+00:00",
        "title": "Created todo 1",
        "due_date": "2026-12-03",
        "done_at": null,
        "owner": {
            "id": "u4",
            "name": "Dana Diaz"
        },
        "issue": null
    }
}
```

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "t_1d7419c1426448",
        "created_at": "2026-11-26T10:20:38.286926+00:00",
        "updated_at": "2026-11-26T10:20:38.286935+00:00",
        "title": "Created todo 2",
        "due_date": "2026-12-03",
        "done_at": null,
        "owner": {
            "id": "u4",
            "name": "Dana Diaz"
        },
        "issue": {
            "id": "i_1f6ef2ab7ebf45",
            "title": "Publish hiring ad"
        }
    }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|Inline|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string|true|none||none|
|»» updated_at|string|true|none||none|
|»» title|string|true|none||none|
|»» due_date|string|true|none||none|
|»» done_at|null|true|none||none|
|»» owner|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» issue|object¦null|true|none||none|
|»»» id|string|true|none||none|
|»»» title|string|true|none||none|

## PATCH Update Todo

PATCH /traction/teams/{team_id}/todos/{todo_id}

Can only be performed by Admins or Team Members belonging to the team.

> Body Parameters

```json
{
    "done": true
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|todo_id|path|string|yes|none|
|body|body|object|yes|none|
|» done|body|boolean|yes|none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get  Quarterly Rocks

GET /traction/teams/{team_id}/quarterly-rocks

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|quarter|query|string|yes|none|
|status|query|string|no|none|
|owner_id|query|string|no|none|

#### Enum

|Name|Value|
|---|---|
|status|on_track|
|status|off_track|
|status|complete|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": [
        {
            "id": "r1",
            "created_at": "2026-11-23T16:43:26.005996+00:00",
            "updated_at": "2026-11-23T16:43:26.006009+00:00",
            "title": "Launch partner portal",
            "quarter": "2026-Q4",
            "status": "on_track",
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "milestones": [
                {
                    "id": "ms1",
                    "created_at": "2026-11-23T16:43:26.018492+00:00",
                    "updated_at": "2026-11-23T16:43:26.018510+00:00",
                    "title": "Partner API spec",
                    "due_date": "2026-10-15",
                    "done": true
                },
                {
                    "id": "ms2",
                    "created_at": "2026-11-23T16:43:26.021555+00:00",
                    "updated_at": "2026-11-23T16:43:26.021571+00:00",
                    "title": "Portal beta",
                    "due_date": "2026-11-11",
                    "done": false
                },
                {
                    "id": "ms3",
                    "created_at": "2026-11-23T16:43:26.023050+00:00",
                    "updated_at": "2026-11-23T16:43:26.023065+00:00",
                    "title": "Portal launch",
                    "due_date": "2026-12-01",
                    "done": false
                }
            ]
        },
        {
            "id": "r2",
            "created_at": "2026-11-23T16:43:26.007971+00:00",
            "updated_at": "2026-11-23T16:43:26.007981+00:00",
            "title": "Hire VP of Sales",
            "quarter": "2026-Q4",
            "status": "on_track",
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "milestones": [
                {
                    "id": "ms4",
                    "created_at": "2026-11-23T16:43:26.024494+00:00",
                    "updated_at": "2026-11-23T16:43:26.024508+00:00",
                    "title": "Job description approved",
                    "due_date": "2026-10-10",
                    "done": true
                },
                {
                    "id": "ms5",
                    "created_at": "2026-11-23T16:43:26.025942+00:00",
                    "updated_at": "2026-11-23T16:43:26.025955+00:00",
                    "title": "Shortlist of 5",
                    "due_date": "2026-11-10",
                    "done": false
                },
                {
                    "id": "ms6",
                    "created_at": "2026-11-23T16:43:26.027310+00:00",
                    "updated_at": "2026-11-23T16:43:26.027323+00:00",
                    "title": "First interviews",
                    "due_date": "2026-11-20",
                    "done": false
                },
                {
                    "id": "ms7",
                    "created_at": "2026-11-23T16:43:26.028527+00:00",
                    "updated_at": "2026-11-23T16:43:26.028541+00:00",
                    "title": "Second interviews",
                    "due_date": "2026-11-27",
                    "done": false
                },
                {
                    "id": "ms8",
                    "created_at": "2026-11-23T16:43:26.029605+00:00",
                    "updated_at": "2026-11-23T16:43:26.029620+00:00",
                    "title": "References checked",
                    "due_date": "2026-12-04",
                    "done": false
                },
                {
                    "id": "ms9",
                    "created_at": "2026-11-23T16:43:26.030724+00:00",
                    "updated_at": "2026-11-23T16:43:26.030737+00:00",
                    "title": "Offer made",
                    "due_date": "2026-12-08",
                    "done": false
                },
                {
                    "id": "ms10",
                    "created_at": "2026-11-23T16:43:26.031670+00:00",
                    "updated_at": "2026-11-23T16:43:26.031679+00:00",
                    "title": "Offer accepted",
                    "due_date": "2026-12-15",
                    "done": false
                },
                {
                    "id": "ms11",
                    "created_at": "2026-11-23T16:43:26.032492+00:00",
                    "updated_at": "2026-11-23T16:43:26.032502+00:00",
                    "title": "Start date set",
                    "due_date": "2026-12-20",
                    "done": false
                }
            ]
        },
        {
            "id": "r3",
            "created_at": "2026-11-23T16:43:26.009242+00:00",
            "updated_at": "2026-11-23T16:43:26.009253+00:00",
            "title": "ERP migration",
            "quarter": "2026-Q4",
            "status": "complete",
            "owner": {
                "id": "u4",
                "name": "Dana Diaz"
            },
            "milestones": []
        },
        {
            "id": "r4",
            "created_at": "2026-11-23T16:43:26.010226+00:00",
            "updated_at": "2026-11-23T16:43:26.010237+00:00",
            "title": "Refresh brand",
            "quarter": "2026-Q4",
            "status": "off_track",
            "owner": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "milestones": []
        },
        {
            "id": "r5",
            "created_at": "2026-11-23T16:43:26.011044+00:00",
            "updated_at": "2026-11-23T16:43:26.011050+00:00",
            "title": "Q4 pricing review",
            "quarter": "2026-Q4",
            "status": "on_track",
            "owner": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "milestones": []
        }
    ]
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|[object]|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string(date-time)|true|none||none|
|»» updated_at|string(date-time)|true|none||none|
|»» title|string|true|none||none|
|»» quarter|string|true|none||none|
|»» status|string|true|none||none|
|»» owner|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» milestones|[object]|true|none||none|
|»»» id|string|true|none||none|
|»»» created_at|string(date-time)|true|none||none|
|»»» updated_at|string(date-time)|true|none||none|
|»»» title|string|true|none||none|
|»»» due_date|string(date)|true|none||none|
|»»» done|boolean|true|none||none|

#### Enum

|Name|Value|
|---|---|
|status|on_track|
|status|off_track|
|status|complete|

## POST Update Meeting State

POST /traction/teams/{team_id}/meetings/state

Can only be performed by Admins or Team Members belonging to the team. Once a meeting has started, only the meeting's facilitator can update the state.

> Body Parameters

```json
{
    "state": "start"
}
```

```json
{
    "state": "ids",
    "meeting_id": "mt_39d6ac511e6c42"
}
```

```json
{
    "state": "conclude",
    "meeting_id": "mt_39d6ac511e6c42"
}
```

```json
{
    "state": "end",
    "meeting_id": "mt_39d6ac511e6c42"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|body|body|object|yes|none|
|» state|body|string|yes|none|
|» meeting_id|body|string|no|Required if `state` is not `start`|

#### Enum

|Name|Value|
|---|---|
|» state|start|
|» state|ids|
|» state|conclude|
|» state|end|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "mt_a3f49891e26342",
        "created_at": "2026-11-26T19:54:19.336149+00:00",
        "updated_at": "2026-11-26T19:54:19.336180+00:00",
        "started_at": "2026-11-26T19:54:19.335463+00:00",
        "ids_started_at": null,
        "conclude_started_at": null,
        "ended_at": null,
        "facilitator": {
            "id": "u1",
            "name": "Avery Admin"
        },
        "state": "start",
        "attendees": [
            {
                "id": "att_75d4645196b845",
                "created_at": "2026-11-26T19:54:19.346461+00:00",
                "updated_at": "2026-11-26T19:54:19.346471+00:00",
                "joined_at": "2026-11-26T19:54:19.335463+00:00",
                "rating": null,
                "user": {
                    "id": "u1",
                    "name": "Avery Admin"
                }
            }
        ],
        "server_now": "2026-11-11T15:00:06.488286+00:00"
    }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string(date-time)|true|none||none|
|»» updated_at|string(date-time)|true|none||none|
|»» started_at|string(date-time)|true|none||none|
|»» ids_started_at|string¦null|true|none||none|
|»» conclude_started_at|string(date-time)¦null|true|none||none|
|»» ended_at|string(date-time)¦null|true|none||none|
|»» facilitator|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» state|string|true|none||none|
|»» attendees|[object]|true|none||none|
|»»» id|string|true|none||none|
|»»» created_at|string(date-time)|true|none||none|
|»»» updated_at|string(date-time)|true|none||none|
|»»» joined_at|string(date-time)¦null|true|none||none|
|»»» rating|integer¦null|true|none||none|
|»»» user|object|true|none||none|
|»»»» id|string|true|none||none|
|»»»» name|string|true|none||none|
|»» server_now|string(date-time)|true|none||none|

#### Enum

|Name|Value|
|---|---|
|state|start|
|state|ids|
|state|conclude|
|state|end|

## GET Get Meeting

GET /traction/teams/{team_id}/meetings/{meeting_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|meeting_id|path|string|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "mt1",
        "created_at": "2026-11-26T19:29:51.776745+00:00",
        "updated_at": "2026-11-26T19:29:51.776755+00:00",
        "started_at": "2026-10-28T15:00:00+00:00",
        "ids_started_at": null,
        "conclude_started_at": null,
        "ended_at": "2026-10-28T16:15:00+00:00",
        "facilitator": {
            "id": "u3",
            "name": "Casey Cho"
        },
        "state": "end",
        "attendees": [
            {
                "id": "att_a0d6ff48ec725f",
                "created_at": "2026-11-26T19:29:51.790442+00:00",
                "updated_at": "2026-11-26T19:29:51.790471+00:00",
                "joined_at": null,
                "rating": 8,
                "user": {
                    "id": "u1",
                    "name": "Avery Admin"
                }
            },
            {
                "id": "att_d75ba57c218750",
                "created_at": "2026-11-26T19:29:51.795361+00:00",
                "updated_at": "2026-11-26T19:29:51.795389+00:00",
                "joined_at": null,
                "rating": 9,
                "user": {
                    "id": "u2",
                    "name": "Blake Brooks"
                }
            },
            {
                "id": "att_93aa2ba283bd51",
                "created_at": "2026-11-26T19:29:51.798142+00:00",
                "updated_at": "2026-11-26T19:29:51.798165+00:00",
                "joined_at": null,
                "rating": 7,
                "user": {
                    "id": "u3",
                    "name": "Casey Cho"
                }
            },
            {
                "id": "att_c215c72c7b1c5f",
                "created_at": "2026-11-26T19:29:51.800690+00:00",
                "updated_at": "2026-11-26T19:29:51.800711+00:00",
                "joined_at": null,
                "rating": null,
                "user": {
                    "id": "u4",
                    "name": "Dana Diaz"
                }
            },
            {
                "id": "att_3a74b15a431f5a",
                "created_at": "2026-11-26T19:29:51.804543+00:00",
                "updated_at": "2026-11-26T19:29:51.804589+00:00",
                "joined_at": null,
                "rating": null,
                "user": {
                    "id": "u5",
                    "name": "Ellis Evans"
                }
            }
        ],
        "server_now": "2026-11-11T15:00:06.488286+00:00"
    }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string(date-time)|true|none||none|
|»» updated_at|string(date-time)|true|none||none|
|»» started_at|string(date-time)|true|none||none|
|»» ids_started_at|string¦null|true|none||none|
|»» conclude_started_at|string(date-time)¦null|true|none||none|
|»» ended_at|string(date-time)¦null|true|none||none|
|»» facilitator|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» state|string|true|none||none|
|»» attendees|[object]|true|none||none|
|»»» id|string|true|none||none|
|»»» created_at|string(date-time)|true|none||none|
|»»» updated_at|string(date-time)|true|none||none|
|»»» joined_at|string(date-time)¦null|true|none||none|
|»»» rating|integer¦null|true|none||none|
|»»» user|object|true|none||none|
|»»»» id|string|true|none||none|
|»»»» name|string|true|none||none|
|»» server_now|string(date-time)|true|none||none|

#### Enum

|Name|Value|
|---|---|
|state|start|
|state|ids|
|state|conclude|
|state|end|

## GET Get Active Meeting

GET /traction/teams/{team_id}/meetings/active

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "mt_a3f49891e26342",
        "created_at": "2026-11-26T19:54:19.336149+00:00",
        "updated_at": "2026-11-26T19:54:19.336180+00:00",
        "started_at": "2026-11-26T19:54:19.335463+00:00",
        "ids_started_at": null,
        "conclude_started_at": null,
        "ended_at": null,
        "facilitator": {
            "id": "u1",
            "name": "Avery Admin"
        },
        "state": "start",
        "attendees": [
            {
                "id": "att_75d4645196b845",
                "created_at": "2026-11-26T19:54:19.346461+00:00",
                "updated_at": "2026-11-26T19:54:19.346471+00:00",
                "joined_at": "2026-11-26T19:54:19.335463+00:00",
                "rating": null,
                "user": {
                    "id": "u1",
                    "name": "Avery Admin"
                }
            }
        ],
        "server_now": "2026-11-11T15:00:06.488286+00:00"
    }
}
```

> 404 Response

```json
{
    "success": false,
    "message": "No Active Meeting",
    "data": null
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string(date-time)|true|none||none|
|»» updated_at|string(date-time)|true|none||none|
|»» started_at|string(date-time)|true|none||none|
|»» ids_started_at|string¦null|true|none||none|
|»» conclude_started_at|string(date-time)¦null|true|none||none|
|»» ended_at|string(date-time)¦null|true|none||none|
|»» facilitator|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» state|string|true|none||none|
|»» attendees|[object]|true|none||none|
|»»» id|string|true|none||none|
|»»» created_at|string(date-time)|true|none||none|
|»»» updated_at|string(date-time)|true|none||none|
|»»» joined_at|string(date-time)¦null|true|none||none|
|»»» rating|integer¦null|true|none||none|
|»»» user|object|true|none||none|
|»»»» id|string|true|none||none|
|»»»» name|string|true|none||none|
|»» server_now|string(date-time)|true|none||none|

#### Enum

|Name|Value|
|---|---|
|state|start|
|state|ids|
|state|conclude|
|state|end|

HTTP Status Code **404**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|null|true|none||none|

## POST Join Meeting

POST /traction/teams/{team_id}/meetings/{meeting_id}/attendees

Can be used to join a meeting multiple times. `joined_at` gets updated at every subsequent join.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|meeting_id|path|string|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Meeting Joined",
    "data": {}
}
```

> 400 Response

```json
{
    "success": false,
    "message": "Meeting Has Already Ended",
    "data": null
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|

HTTP Status Code **400**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|null|true|none||none|

## GET Get Meeting Attendees

GET /traction/teams/{team_id}/meetings/{meeting_id}/attendees

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|meeting_id|path|string|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": [
        {
            "id": "att_a0d6ff48ec725f",
            "created_at": "2026-11-23T16:43:26.083244+00:00",
            "updated_at": "2026-11-23T16:43:26.083256+00:00",
            "joined_at": null,
            "rating": 8,
            "user": {
                "id": "u1",
                "name": "Avery Admin"
            }
        },
        {
            "id": "att_d75ba57c218750",
            "created_at": "2026-11-23T16:43:26.085581+00:00",
            "updated_at": "2026-11-23T16:43:26.085595+00:00",
            "joined_at": null,
            "rating": 9,
            "user": {
                "id": "u2",
                "name": "Blake Brooks"
            }
        },
        {
            "id": "att_93aa2ba283bd51",
            "created_at": "2026-11-23T16:43:26.087017+00:00",
            "updated_at": "2026-11-23T16:43:26.087030+00:00",
            "joined_at": null,
            "rating": 7,
            "user": {
                "id": "u3",
                "name": "Casey Cho"
            }
        },
        {
            "id": "att_c215c72c7b1c5f",
            "created_at": "2026-11-23T16:43:26.088314+00:00",
            "updated_at": "2026-11-23T16:43:26.088324+00:00",
            "joined_at": null,
            "rating": null,
            "user": {
                "id": "u4",
                "name": "Dana Diaz"
            }
        },
        {
            "id": "att_3a74b15a431f5a",
            "created_at": "2026-11-23T16:43:26.089508+00:00",
            "updated_at": "2026-11-23T16:43:26.089517+00:00",
            "joined_at": null,
            "rating": null,
            "user": {
                "id": "u5",
                "name": "Ellis Evans"
            }
        }
    ]
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|[object]|true|none||none|
|»» id|string|true|none||none|
|»» created_at|string(date-time)|true|none||none|
|»» updated_at|string(date-time)|true|none||none|
|»» joined_at|string(date-time)¦null|true|none||none|
|»» rating|integer¦null|true|none||none|
|»» user|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|

## POST Rate Meeting

POST /traction/teams/{team_id}/meetings/{meeting_id}/ratings

Can only be performed by Admins or Team Members belonging to the team.
Will only be successful if an active meeting is in its conclusion stage.

> Body Parameters

```json
{
    "rating": 5
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|meeting_id|path|string|yes|none|
|body|body|object|yes|none|
|» rating|body|integer|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Rating Recorded",
    "data": {}
}
```

> 400 Response

```json
{
    "success": false,
    "message": "Meeting Has Already Ended",
    "data": null
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|

HTTP Status Code **400**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|null|true|none||none|

## GET Retrieve Meeting Summary

GET /traction/teams/{team_id}/meetings/{meeting_id}/summary

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|
|meeting_id|path|string|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "id": "mt2",
        "reviewed_week": "2026-10-26",
        "started_at": "2026-11-04T15:00:00+00:00",
        "ids_started_at": null,
        "conclude_started_at": null,
        "ended_at": "2026-11-04T16:20:00+00:00",
        "duration_seconds": 4800,
        "average_rating": 8.2,
        "facilitator": {
            "id": "u2",
            "name": "Blake Brooks"
        },
        "measurables": [
            {
                "id": "m1",
                "name": "New deals closed",
                "unit": "count",
                "goal": {
                    "type": "at_least",
                    "value": 10
                },
                "score": 9.0,
                "status": "off_track"
            },
            {
                "id": "m2",
                "name": "Customer churn",
                "unit": "%",
                "goal": {
                    "type": "at_most",
                    "value": 3.0
                },
                "score": 2.6,
                "status": "on_track"
            },
            {
                "id": "m3",
                "name": "Avg first response",
                "unit": "hours",
                "goal": {
                    "max": 4,
                    "min": 2,
                    "type": "between"
                },
                "score": 3.3,
                "status": "on_track"
            },
            {
                "id": "m4",
                "name": "Payroll runs",
                "unit": "count",
                "goal": {
                    "type": "exactly",
                    "value": 1
                },
                "score": 0.0,
                "status": "off_track"
            },
            {
                "id": "m5",
                "name": "Cash on hand",
                "unit": "$k",
                "goal": {
                    "type": "at_least",
                    "value": 500
                },
                "score": 525.0,
                "status": "on_track"
            }
        ],
        "issues": {
            "created": [],
            "solved": [
                {
                    "id": "i6",
                    "created_at": "2026-11-03T14:00:00+00:00",
                    "updated_at": "2026-11-23T16:43:26.047690+00:00",
                    "title": "Payroll runs, week of Oct 26",
                    "priority": 2,
                    "solved_at": "2026-11-04T15:40:00+00:00",
                    "resolution_note": "Bank holiday moved the run; added a reminder.",
                    "owner": {
                        "id": "u3",
                        "name": "Casey Cho"
                    },
                    "source": {
                        "week_start": "2026-10-26",
                        "measurable_id": "m4",
                        "title": "Payroll runs"
                    }
                }
            ]
        },
        "todos": {
            "created": [
                {
                    "id": "t30",
                    "created_at": "2026-11-04T15:45:00+00:00",
                    "updated_at": "2026-11-23T16:43:26.070813+00:00",
                    "title": "Set payroll reminder",
                    "due_date": "2026-11-11",
                    "done_at": null,
                    "owner": {
                        "id": "u3",
                        "name": "Casey Cho"
                    },
                    "issue": {
                        "id": "i6",
                        "title": "Payroll runs, week of Oct 26"
                    }
                }
            ],
            "done": []
        },
        "attendees": [
            {
                "id": "att_656513bca0d55a",
                "created_at": "2026-11-23T16:43:26.095670+00:00",
                "updated_at": "2026-11-23T16:43:26.095682+00:00",
                "joined_at": null,
                "rating": 8,
                "user": {
                    "id": "u1",
                    "name": "Avery Admin"
                }
            },
            {
                "id": "att_dde5eb10aab855",
                "created_at": "2026-11-23T16:43:26.096888+00:00",
                "updated_at": "2026-11-23T16:43:26.096900+00:00",
                "joined_at": null,
                "rating": 9,
                "user": {
                    "id": "u2",
                    "name": "Blake Brooks"
                }
            },
            {
                "id": "att_12f65f3b675a5e",
                "created_at": "2026-11-23T16:43:26.097900+00:00",
                "updated_at": "2026-11-23T16:43:26.097908+00:00",
                "joined_at": null,
                "rating": 8,
                "user": {
                    "id": "u3",
                    "name": "Casey Cho"
                }
            },
            {
                "id": "att_273c3fe8714d50",
                "created_at": "2026-11-23T16:43:26.098744+00:00",
                "updated_at": "2026-11-23T16:43:26.098752+00:00",
                "joined_at": null,
                "rating": 8,
                "user": {
                    "id": "u4",
                    "name": "Dana Diaz"
                }
            },
            {
                "id": "att_09545462cc6657",
                "created_at": "2026-11-23T16:43:26.099650+00:00",
                "updated_at": "2026-11-23T16:43:26.099660+00:00",
                "joined_at": null,
                "rating": null,
                "user": {
                    "id": "u5",
                    "name": "Ellis Evans"
                }
            }
        ]
    }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|string|true|none||none|
|»» reviewed_week|string(date)|true|none||none|
|»» started_at|string(date-time)|true|none||none|
|»» ids_started_at|string(date-time)¦null|true|none||none|
|»» conclude_started_at|string(date-time)¦null|true|none||none|
|»» ended_at|string|true|none||none|
|»» duration_seconds|integer|true|none||none|
|»» average_rating|number|true|none||none|
|»» facilitator|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» measurables|[object]|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»»» unit|string|true|none||none|
|»»» goal|object|true|none||none|
|»»»» type|string|false|none||none|
|»»»» value|integer|false|none||none|
|»»»» max|integer|false|none||none|
|»»»» min|integer|false|none||none|
|»»» score|number¦null|true|none||none|
|»»» status|string|true|none||none|
|»» issues|object|true|none||none|
|»»» created|[object]|true|none||none|
|»»»» id|string|true|none||none|
|»»»» created_at|string(date-time)|true|none||none|
|»»»» updated_at|string(date-time)|true|none||none|
|»»»» title|string|true|none||none|
|»»»» priority|integer¦null|true|none||none|
|»»»» solved_at|string(date-time)¦null|true|none||none|
|»»»» resolution_note|string¦null|true|none||none|
|»»»» owner|object|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» name|string|true|none||none|
|»»»» source|object¦null|true|none||none|
|»»»»» measurable_id|string|false|none||none|
|»»»»» week_start|string(date)|false|none||none|
|»»»»» todo_id|string|false|none||none|
|»»»»» rock_id|string|false|none||none|
|»»»»» title|string|true|none||none|
|»»» solved|[object]|true|none||none|
|»»»» id|string|true|none||none|
|»»»» created_at|string(date-time)|false|none||none|
|»»»» updated_at|string(date-time)|true|none||none|
|»»»» title|string|true|none||none|
|»»»» priority|integer|true|none||none|
|»»»» solved_at|string(date-time)¦null|true|none||none|
|»»»» resolution_note|string¦null|true|none||none|
|»»»» owner|object|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» name|string|true|none||none|
|»»»» source|object¦null|true|none||none|
|»»»»» measurable_id|string|false|none||none|
|»»»»» week_start|string(date)|false|none||none|
|»»»»» todo_id|string|false|none||none|
|»»»»» rock_id|string|false|none||none|
|»»»»» title|string|true|none||none|
|»» todos|object|true|none||none|
|»»» created|[object]|true|none||none|
|»»»» id|string|true|none||none|
|»»»» created_at|string(date-time)|true|none||none|
|»»»» updated_at|string(date-time)|true|none||none|
|»»»» title|string|true|none||none|
|»»»» due_date|string(date)|true|none||none|
|»»»» done_at|string(date-time)¦null|true|none||none|
|»»»» owner|object|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» name|string|true|none||none|
|»»»» issue|object|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» title|string|true|none||none|
|»»» done|[object]|true|none||none|
|»»»» id|string|true|none||none|
|»»»» created_at|string(date-time)|true|none||none|
|»»»» updated_at|string(date-time)|true|none||none|
|»»»» title|string|true|none||none|
|»»»» due_date|string(date)|true|none||none|
|»»»» done_at|string(date-time)¦null|true|none||none|
|»»»» owner|object|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» name|string|true|none||none|
|»»»» issue|object|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» title|string|true|none||none|
|»» attendees|[object]|true|none||none|
|»»» id|string|true|none||none|
|»»» created_at|string|true|none||none|
|»»» updated_at|string|true|none||none|
|»»» joined_at|string¦null|true|none||none|
|»»» rating|integer¦null|true|none||none|
|»»» user|object|true|none||none|
|»»»» id|string|true|none||none|
|»»»» name|string|true|none||none|

#### Enum

|Name|Value|
|---|---|
|status|on_track|
|status|off_track|

## GET List Meeting Summaries

GET /traction/teams/{team_id}/meetings/summaries

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|team_id|path|string|yes|none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": [
        {
            "id": "mt_39d6ac511e6c42",
            "reviewed_week": "2026-11-16",
            "started_at": "2026-11-26T15:59:38.623921+00:00",
            "ids_started_at": "2026-11-26T16:03:56.470435+00:00",
            "conclude_started_at": "2026-11-26T16:05:07.647906+00:00",
            "ended_at": "2026-11-26T16:10:08.168535+00:00",
            "duration_seconds": 629,
            "average_rating": null,
            "facilitator": {
                "id": "u1",
                "name": "Avery Admin"
            },
            "measurables": [
                {
                    "id": "m1",
                    "name": "New deals closed",
                    "unit": "count",
                    "goal": {
                        "type": "at_least",
                        "value": 10
                    },
                    "score": null,
                    "status": "off_track"
                },
                {
                    "id": "m2",
                    "name": "Customer churn",
                    "unit": "%",
                    "goal": {
                        "type": "at_most",
                        "value": 3.0
                    },
                    "score": null,
                    "status": "off_track"
                },
                {
                    "id": "m3",
                    "name": "Avg first response",
                    "unit": "hours",
                    "goal": {
                        "max": 4,
                        "min": 2,
                        "type": "between"
                    },
                    "score": null,
                    "status": "off_track"
                },
                {
                    "id": "m4",
                    "name": "Payroll runs",
                    "unit": "count",
                    "goal": {
                        "type": "exactly",
                        "value": 1
                    },
                    "score": null,
                    "status": "off_track"
                },
                {
                    "id": "m5",
                    "name": "Cash on hand",
                    "unit": "$k",
                    "goal": {
                        "type": "at_least",
                        "value": 500
                    },
                    "score": null,
                    "status": "off_track"
                }
            ],
            "issues": {
                "created": [],
                "solved": []
            },
            "todos": {
                "created": [],
                "done": []
            },
            "attendees": [
                {
                    "id": "att_73ca5aba285b49",
                    "created_at": "2026-11-26T15:59:38.639687+00:00",
                    "updated_at": "2026-11-26T16:38:41.971454+00:00",
                    "joined_at": "2026-11-26T16:38:41.971407+00:00",
                    "rating": null,
                    "user": {
                        "id": "u1",
                        "name": "Avery Admin"
                    }
                }
            ]
        },
        {
            "id": "mt_f7ca4d3ac8a741",
            "reviewed_week": "2026-11-16",
            "started_at": "2026-11-26T15:54:51.704343+00:00",
            "ids_started_at": null,
            "conclude_started_at": null,
            "ended_at": "2026-11-26T15:56:57.995467+00:00",
            "duration_seconds": 126,
            "average_rating": null,
            "facilitator": {
                "id": "u1",
                "name": "Avery Admin"
            },
            "measurables": [
                {
                    "id": "m1",
                    "name": "New deals closed",
                    "unit": "count",
                    "goal": {
                        "type": "at_least",
                        "value": 10
                    },
                    "score": null,
                    "status": "off_track"
                },
                {
                    "id": "m2",
                    "name": "Customer churn",
                    "unit": "%",
                    "goal": {
                        "type": "at_most",
                        "value": 3.0
                    },
                    "score": null,
                    "status": "off_track"
                },
                {
                    "id": "m3",
                    "name": "Avg first response",
                    "unit": "hours",
                    "goal": {
                        "max": 4,
                        "min": 2,
                        "type": "between"
                    },
                    "score": null,
                    "status": "off_track"
                },
                {
                    "id": "m4",
                    "name": "Payroll runs",
                    "unit": "count",
                    "goal": {
                        "type": "exactly",
                        "value": 1
                    },
                    "score": null,
                    "status": "off_track"
                },
                {
                    "id": "m5",
                    "name": "Cash on hand",
                    "unit": "$k",
                    "goal": {
                        "type": "at_least",
                        "value": 500
                    },
                    "score": null,
                    "status": "off_track"
                }
            ],
            "issues": {
                "created": [],
                "solved": []
            },
            "todos": {
                "created": [],
                "done": []
            },
            "attendees": [
                {
                    "id": "att_1f870df8075040",
                    "created_at": "2026-11-26T15:54:51.720647+00:00",
                    "updated_at": "2026-11-26T15:54:51.720653+00:00",
                    "joined_at": "2026-11-26T15:54:51.704343+00:00",
                    "rating": null,
                    "user": {
                        "id": "u1",
                        "name": "Avery Admin"
                    }
                }
            ]
        },
        {
            "id": "mt2",
            "reviewed_week": "2026-10-26",
            "started_at": "2026-11-04T15:00:00+00:00",
            "ids_started_at": null,
            "conclude_started_at": null,
            "ended_at": "2026-11-04T16:20:00+00:00",
            "duration_seconds": 4800,
            "average_rating": 8.2,
            "facilitator": {
                "id": "u2",
                "name": "Blake Brooks"
            },
            "measurables": [
                {
                    "id": "m1",
                    "name": "New deals closed",
                    "unit": "count",
                    "goal": {
                        "type": "at_least",
                        "value": 10
                    },
                    "score": 9.0,
                    "status": "off_track"
                },
                {
                    "id": "m2",
                    "name": "Customer churn",
                    "unit": "%",
                    "goal": {
                        "type": "at_most",
                        "value": 3.0
                    },
                    "score": 2.6,
                    "status": "on_track"
                },
                {
                    "id": "m3",
                    "name": "Avg first response",
                    "unit": "hours",
                    "goal": {
                        "max": 4,
                        "min": 2,
                        "type": "between"
                    },
                    "score": 3.3,
                    "status": "on_track"
                },
                {
                    "id": "m4",
                    "name": "Payroll runs",
                    "unit": "count",
                    "goal": {
                        "type": "exactly",
                        "value": 1
                    },
                    "score": 0.0,
                    "status": "off_track"
                },
                {
                    "id": "m5",
                    "name": "Cash on hand",
                    "unit": "$k",
                    "goal": {
                        "type": "at_least",
                        "value": 500
                    },
                    "score": 525.0,
                    "status": "on_track"
                }
            ],
            "issues": {
                "created": [],
                "solved": [
                    {
                        "id": "i6",
                        "created_at": "2026-11-03T14:00:00+00:00",
                        "updated_at": "2026-11-23T16:43:26.047690+00:00",
                        "title": "Payroll runs, week of Oct 26",
                        "priority": 2,
                        "solved_at": "2026-11-04T15:40:00+00:00",
                        "resolution_note": "Bank holiday moved the run; added a reminder.",
                        "owner": {
                            "id": "u3",
                            "name": "Casey Cho"
                        },
                        "source": {
                            "week_start": "2026-10-26",
                            "measurable_id": "m4",
                            "title": "Payroll runs"
                        }
                    }
                ]
            },
            "todos": {
                "created": [
                    {
                        "id": "t30",
                        "created_at": "2026-11-04T15:45:00+00:00",
                        "updated_at": "2026-11-23T16:43:26.070813+00:00",
                        "title": "Set payroll reminder",
                        "due_date": "2026-11-11",
                        "done_at": null,
                        "owner": {
                            "id": "u3",
                            "name": "Casey Cho"
                        },
                        "issue": {
                            "id": "i6",
                            "title": "Payroll runs, week of Oct 26"
                        }
                    }
                ],
                "done": []
            },
            "attendees": [
                {
                    "id": "att_dde5eb10aab855",
                    "created_at": "2026-11-23T16:43:26.096888+00:00",
                    "updated_at": "2026-11-23T16:43:26.096900+00:00",
                    "joined_at": null,
                    "rating": 9,
                    "user": {
                        "id": "u2",
                        "name": "Blake Brooks"
                    }
                },
                {
                    "id": "att_12f65f3b675a5e",
                    "created_at": "2026-11-23T16:43:26.097900+00:00",
                    "updated_at": "2026-11-23T16:43:26.097908+00:00",
                    "joined_at": null,
                    "rating": 8,
                    "user": {
                        "id": "u3",
                        "name": "Casey Cho"
                    }
                },
                {
                    "id": "att_273c3fe8714d50",
                    "created_at": "2026-11-23T16:43:26.098744+00:00",
                    "updated_at": "2026-11-23T16:43:26.098752+00:00",
                    "joined_at": null,
                    "rating": 8,
                    "user": {
                        "id": "u4",
                        "name": "Dana Diaz"
                    }
                },
                {
                    "id": "att_09545462cc6657",
                    "created_at": "2026-11-23T16:43:26.099650+00:00",
                    "updated_at": "2026-11-23T16:43:26.099660+00:00",
                    "joined_at": null,
                    "rating": null,
                    "user": {
                        "id": "u5",
                        "name": "Ellis Evans"
                    }
                },
                {
                    "id": "att_656513bca0d55a",
                    "created_at": "2026-11-23T16:43:26.095670+00:00",
                    "updated_at": "2026-11-23T16:43:26.095682+00:00",
                    "joined_at": null,
                    "rating": 8,
                    "user": {
                        "id": "u1",
                        "name": "Avery Admin"
                    }
                }
            ]
        },
        {
            "id": "mt1",
            "reviewed_week": "2026-10-19",
            "started_at": "2026-10-28T15:00:00+00:00",
            "ids_started_at": null,
            "conclude_started_at": null,
            "ended_at": "2026-10-28T16:15:00+00:00",
            "duration_seconds": 4500,
            "average_rating": 8.0,
            "facilitator": {
                "id": "u3",
                "name": "Casey Cho"
            },
            "measurables": [
                {
                    "id": "m1",
                    "name": "New deals closed",
                    "unit": "count",
                    "goal": {
                        "type": "at_least",
                        "value": 10
                    },
                    "score": 12.0,
                    "status": "on_track"
                },
                {
                    "id": "m2",
                    "name": "Customer churn",
                    "unit": "%",
                    "goal": {
                        "type": "at_most",
                        "value": 3.0
                    },
                    "score": 2.4,
                    "status": "on_track"
                },
                {
                    "id": "m3",
                    "name": "Avg first response",
                    "unit": "hours",
                    "goal": {
                        "max": 4,
                        "min": 2,
                        "type": "between"
                    },
                    "score": 2.0,
                    "status": "on_track"
                },
                {
                    "id": "m4",
                    "name": "Payroll runs",
                    "unit": "count",
                    "goal": {
                        "type": "exactly",
                        "value": 1
                    },
                    "score": 1.0,
                    "status": "on_track"
                },
                {
                    "id": "m5",
                    "name": "Cash on hand",
                    "unit": "$k",
                    "goal": {
                        "type": "at_least",
                        "value": 500
                    },
                    "score": null,
                    "status": "off_track"
                }
            ],
            "issues": {
                "created": [],
                "solved": [
                    {
                        "id": "i7",
                        "created_at": "2026-10-20T15:00:00+00:00",
                        "updated_at": "2026-11-23T16:43:26.048689+00:00",
                        "title": "Onboarding docs are outdated",
                        "priority": 4,
                        "solved_at": "2026-10-28T15:30:00+00:00",
                        "resolution_note": "Assign an owner and refresh the docs.",
                        "owner": {
                            "id": "u4",
                            "name": "Dana Diaz"
                        },
                        "source": null
                    }
                ]
            },
            "todos": {
                "created": [
                    {
                        "id": "t20",
                        "created_at": "2026-10-28T15:35:00+00:00",
                        "updated_at": "2026-11-23T16:43:26.062020+00:00",
                        "title": "Assign onboarding docs owner",
                        "due_date": "2026-11-04",
                        "done_at": "2026-11-03T20:00:00+00:00",
                        "owner": {
                            "id": "u4",
                            "name": "Dana Diaz"
                        },
                        "issue": {
                            "id": "i7",
                            "title": "Onboarding docs are outdated"
                        }
                    }
                ],
                "done": []
            },
            "attendees": [
                {
                    "id": "att_a0d6ff48ec725f",
                    "created_at": "2026-11-23T16:43:26.083244+00:00",
                    "updated_at": "2026-11-23T16:43:26.083256+00:00",
                    "joined_at": null,
                    "rating": 8,
                    "user": {
                        "id": "u1",
                        "name": "Avery Admin"
                    }
                },
                {
                    "id": "att_d75ba57c218750",
                    "created_at": "2026-11-23T16:43:26.085581+00:00",
                    "updated_at": "2026-11-23T16:43:26.085595+00:00",
                    "joined_at": null,
                    "rating": 9,
                    "user": {
                        "id": "u2",
                        "name": "Blake Brooks"
                    }
                },
                {
                    "id": "att_93aa2ba283bd51",
                    "created_at": "2026-11-23T16:43:26.087017+00:00",
                    "updated_at": "2026-11-23T16:43:26.087030+00:00",
                    "joined_at": null,
                    "rating": 7,
                    "user": {
                        "id": "u3",
                        "name": "Casey Cho"
                    }
                },
                {
                    "id": "att_c215c72c7b1c5f",
                    "created_at": "2026-11-23T16:43:26.088314+00:00",
                    "updated_at": "2026-11-23T16:43:26.088324+00:00",
                    "joined_at": null,
                    "rating": null,
                    "user": {
                        "id": "u4",
                        "name": "Dana Diaz"
                    }
                },
                {
                    "id": "att_3a74b15a431f5a",
                    "created_at": "2026-11-23T16:43:26.089508+00:00",
                    "updated_at": "2026-11-23T16:43:26.089517+00:00",
                    "joined_at": null,
                    "rating": null,
                    "user": {
                        "id": "u5",
                        "name": "Ellis Evans"
                    }
                }
            ]
        }
    ]
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|[object]|true|none||none|
|»» id|string|true|none||none|
|»» reviewed_week|string(date)|true|none||none|
|»» started_at|string(date-time)|true|none||none|
|»» ids_started_at|string(date-time)¦null|true|none||none|
|»» conclude_started_at|string(date-time)¦null|true|none||none|
|»» ended_at|string|true|none||none|
|»» duration_seconds|integer|true|none||none|
|»» average_rating|number¦null|true|none||none|
|»» facilitator|object|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»» measurables|[object]|true|none||none|
|»»» id|string|true|none||none|
|»»» name|string|true|none||none|
|»»» unit|string|true|none||none|
|»»» goal|object|true|none||none|
|»»»» type|string|false|none||none|
|»»»» value|integer|false|none||none|
|»»»» max|integer|false|none||none|
|»»»» min|integer|false|none||none|
|»»» score|number¦null|true|none||none|
|»»» status|string|true|none||none|
|»» issues|object|true|none||none|
|»»» created|[object]|true|none||none|
|»»»» id|string|true|none||none|
|»»»» created_at|string(date-time)|true|none||none|
|»»»» updated_at|string(date-time)|true|none||none|
|»»»» title|string|true|none||none|
|»»»» priority|integer¦null|true|none||none|
|»»»» solved_at|string¦null|true|none||none|
|»»»» resolution_note|string¦null|true|none||none|
|»»»» owner|object|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» name|string|true|none||none|
|»»»» source|object¦null|true|none||none|
|»»»»» measurable_id|string|false|none||none|
|»»»»» week_start|string(date)|false|none||none|
|»»»»» todo_id|string|false|none||none|
|»»»»» rock_id|string|false|none||none|
|»»»»» title|string|true|none||none|
|»»» solved|[object]|true|none||none|
|»»»» id|string|true|none||none|
|»»»» created_at|string(date-time)|true|none||none|
|»»»» updated_at|string(date-time)|true|none||none|
|»»»» title|string|true|none||none|
|»»»» priority|integer¦null|true|none||none|
|»»»» solved_at|string(date-time)¦null|true|none||none|
|»»»» resolution_note|string¦null|true|none||none|
|»»»» owner|object|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» name|string|true|none||none|
|»»»» source|object¦null|true|none||none|
|»»»»» measurable_id|string|false|none||none|
|»»»»» week_start|string(date)|false|none||none|
|»»»»» rock_id|string|false|none||none|
|»»»»» todo_id|string|false|none||none|
|»»»»» title|string|true|none||none|
|»» todos|object|true|none||none|
|»»» created|[object]|true|none||none|
|»»»» id|string|true|none||none|
|»»»» created_at|string(date-time)|true|none||none|
|»»»» updated_at|string(date-time)|true|none||none|
|»»»» title|string|true|none||none|
|»»»» due_date|string(date)|true|none||none|
|»»»» done_at|string(date-time)¦null|true|none||none|
|»»»» owner|object|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» name|string|true|none||none|
|»»»» issue|object¦null|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» title|string|true|none||none|
|»»» done|[object]|true|none||none|
|»»»» id|string|true|none||none|
|»»»» created_at|string(date-time)|true|none||none|
|»»»» updated_at|string(date-time)|true|none||none|
|»»»» title|string|true|none||none|
|»»»» due_date|string(date)|true|none||none|
|»»»» done_at|string(date-time)¦null|true|none||none|
|»»»» owner|object|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» name|string|true|none||none|
|»»»» issue|object¦null|true|none||none|
|»»»»» id|string|true|none||none|
|»»»»» title|string|true|none||none|
|»» attendees|[object]|true|none||none|
|»»» id|string|true|none||none|
|»»» created_at|string(date-time)|true|none||none|
|»»» updated_at|string(date-time)|true|none||none|
|»»» joined_at|string(date-time)¦null|true|none||none|
|»»» rating|integer¦null|true|none||none|
|»»» user|object|true|none||none|
|»»»» id|string|true|none||none|
|»»»» name|string|true|none||none|

#### Enum

|Name|Value|
|---|---|
|status|on_track|
|status|off_track|

## GET Get Server Time

GET /server-now

> Response Examples

> 200 Response

```json
{
    "success": true,
    "message": "Request Success",
    "data": {
        "server_now": "2026-11-11T15:00:06.488286+00:00"
    }
}
```

### Responses

|HTTP Status Code|Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» server_now|string|true|none||none|

# Data Schema
