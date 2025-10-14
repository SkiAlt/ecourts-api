# ecourts-api
a mini-server that is used to hit a remote ecourts private api to fetch case info


-----

### 🚦 Setup & Health Endpoints

These endpoints are used for checking the API's status and initializing a session.

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Health Check** |
| **Description** | Checks if the API server is running and if a session has been initialized. |
| **Method** | `GET` |
| **Path** | `/api/health` |
| **Request** | None |
| **Success Response** | ` json { "success": true, "message": "eCourts API is running", "timestamp": "2025-10-14T06:43:20.123Z", "initialized": true }  ` |

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Initialize Session** |
| **Description** | Initializes a new session with the eCourts server to obtain a session cookie and JWT. This should be the first call made. |
| **Method** | `POST` |
| **Path** | `/api/initialize` |
| **Request Body** | ` json { "courtType": "DC", "deviceUuid": "324456" }  ` `courtType` (optional, default: 'DC'): 'DC' or 'HC'. <br> `deviceUuid` (optional, default: '324456'): A unique device identifier. |
| **Success Response** | ` json { "success": true, "message": "API initialized successfully", "token": "eyJhbGciOiJI..." }  ` |

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Set Client Token** |
| **Description** | Allows a client to manually set the JWT on the server, potentially reusing a previously obtained token. |
| **Method** | `POST` |
| **Path** | `/api/client-set-token` |
| **Request Body** | ` json { "token": "YOUR_JWT_TOKEN_HERE" }  ` `token` (required): The JWT string. |
| **Success Response** | ` json { "success": true, "message": "JWT token set successfully", "token": "YOUR_JWT_TOKEN..." }  ` |

-----

### 🗺️ Data Retrieval Endpoints

These endpoints fetch metadata required for searching, such as state lists, districts, and court details.

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Get States** |
| **Description** | Retrieves a list of all available states. |
| **Method** | `GET` |
| **Path** | `/api/states?courtType=DC` |
| **Query Params**| `courtType` (optional, default: 'DC'): 'DC' or 'HC'. |
| **Success Response** | ` json { "success": true, "data": [ { "state_code": "1", "state_name": "Andaman And Nicobar" }, ... ], "message": "States retrieved successfully" }  ` |

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Get Districts** |
| **Description** | Retrieves districts for a given state code. |
| **Method** | `POST` |
| **Path** | `/api/districts` |
| **Request Body** | ` json { "stateCode": "26", "courtType": "DC" }  ` `stateCode` (required): The code for the state (e.g., '26' for Maharashtra).<br>`courtType` (optional): 'DC' or 'HC'. |
| **Success Response** | ` json { "success": true, "data": [ { "dist_code": "1", "district_name": "Ahmednagar" }, ... ], "message": "Districts retrieved successfully" }  ` |

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Get Courts / Complexes** |
| **Description** | Retrieves all court complexes within a specific district. |
| **Method** | `POST` |
| **Path** | `/api/courts` |
| **Request Body** | ` json { "stateCode": "26", "districtCode": "1", "courtType": "DC" }  ` `stateCode`, `districtCode` (required): Codes for the state and district.<br>`courtType` (optional): 'DC' or 'HC'. |
| **Success Response** | ` json { "success": true, "data": [ { "complex_code": "1", "court_complex_name": "District and Sessions Court, Ahmednagar" }, ... ], "message": "Courts retrieved successfully" }  ` |

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Get Establishments** |
| **Description** | Retrieves specific court establishment codes for a given court complex. These codes are needed for case searches. |
| **Method** | `POST` |
| **Path** | `/api/establishments` |
| **Request Body** | ` json { "stateCode": "26", "districtCode": "1", "complexCode": "1", "courtType": "DC" }  ` `stateCode`, `districtCode`, `complexCode` (required): Codes for state, district, and court complex.<br>`courtType` (optional): 'DC' or 'HC'. |
| **Success Response** | ` json { "success": true, "data": [ { "establishment_code": "1", "court_name": "District and Sessions Court, Ahmednagar" }, ... ], "message": "Establishments retrieved successfully" }  ` |

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Get Case Types** |
| **Description** | Retrieves the available case types for a specific court establishment. |
| **Method** | `POST` |
| **Path** | `/api/case-types` |
| **Request Body** | ` json { "stateCode": "26", "districtCode": "1", "courtCode": "1", "courtType": "DC" }  ` `stateCode`, `districtCode`, `courtCode` (required): Codes for state, district, and the specific establishment.<br>`courtType` (optional): 'DC' or 'HC'. |
| **Success Response** | ` json { "success": true, "data": [ { "code": "1", "name": "Arbitration Request" }, { "code": "52", "name": "Bail Application" }, ... ], "message": "Case types retrieved successfully" }  ` |

-----

### ⚖️ Case Search & Details

These endpoints perform searches and retrieve detailed information about specific cases.

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Search by Case Number** |
| **Description** | Searches for a case using its number, type, year, and location. |
| **Method** | `POST` |
| **Path** | `/api/search/case-number` |
| **Request Body** | ` json { "caseNumber": "123", "caseType": "52", "year": "2023", "stateCode": "26", "districtCode": "1", "courtCodes": "1,2", "courtType": "DC" }  ` `caseNumber`, `caseType`, `year`, `stateCode`, `districtCode`, `courtCodes` (required): All parameters for the search.<br>`courtCodes` can be a comma-separated string or an array.<br>`courtType` (optional): 'DC' or 'HC'. |
| **Success Response** | A JSON object containing the search results from the eCourts API. |

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Search by CNR** |
| **Description** | Retrieves case details using the unique 16-digit Case Number Record (CNR). |
| **Method** | `POST` |
| **Path** | `/api/search/cnr` |
| **Request Body** | ` json { "cnr": "MHAN010012342023", "courtType": "DC" }  ` `cnr` (required): The CNR number of the case.<br>`courtType` (optional): 'DC' or 'HC'. |
| **Success Response** | A JSON object containing the search results from the eCourts API. |

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Get Case History** |
| **Description** | Retrieves the detailed history, orders, and status of a case using its CNR. |
| **Method** | `POST` |
| **Path** | `/api/case-history` |
| **Request Body** | ` json { "cnr": "MHAN010012342023", "courtType": "DC" }  ` `cnr` (required): The CNR number of the case.<br>`courtType` (optional): 'DC' or 'HC'. |
| **Success Response** | A detailed JSON object containing the full case history from the eCourts API. |

| Feature | Details |
| :--- | :--- |
| **Endpoint** | **Get Cause List** |
| **Description** | Retrieves the cause list (schedule of cases) for a specific court on a given date. |
| **Method** | `POST` |
| **Path** | `/api/cause-list` |
| **Request Body** | ` json { "stateCode": "26", "districtCode": "1", "courtCode": "1", "courtNo": "5", "causelistDate": "15-10-2025", "caseType": "cri_t", "courtType": "DC" }  ` `stateCode`, `districtCode`, `courtCode`, `courtNo`, `causelistDate` (required): All parameters for the search.<br>`causelistDate` must be in `DD-MM-YYYY` format.<br>`caseType` (optional, default: `cri_t`): `cri_t` for criminal, `civ_t` for civil.<br>`courtType` (optional): 'DC' or 'HC'. |
| **Success Response** | A JSON object containing the cause list from the eCourts API. |
