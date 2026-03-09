export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LendFlow Underwriting API',
    version: '1.0.0',
    description:
      'REST API for the LendFlow mortgage and loan underwriting platform. Supports customer loan applications with automatic underwriting decisions and an admin portal for review and rule management.',
    contact: {
      name: 'LendFlow',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API base path',
    },
  ],
  tags: [
    { name: 'Public', description: 'Endpoints available without authentication' },
    { name: 'Admin Auth', description: 'Admin authentication' },
    { name: 'Admin Dashboard', description: 'Dashboard KPIs and overview' },
    { name: 'Admin Applications', description: 'Application review and management (requires Bearer token)' },
    { name: 'Admin Rules', description: 'Underwriting rule configuration (requires Bearer token)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from POST /api/admin/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          detail: { type: 'string', example: 'Application not found' },
        },
      },
      LoanType: {
        type: 'object',
        properties: {
          id: { type: 'string', enum: ['home', 'car', 'personal'] },
          title: { type: 'string', example: 'Home Loan' },
          description: { type: 'string', example: 'For mortgage and refinancing needs.' },
        },
      },
      ScoreBreakdown: {
        type: 'object',
        properties: {
          credit: { type: 'number', example: 82.5 },
          income: { type: 'number', example: 74.0 },
          debt_to_income: { type: 'number', example: 68.3 },
          employment: { type: 'number', example: 90.0 },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
          loan_type: { type: 'string', enum: ['home', 'car', 'personal'] },
          full_name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
          phone: { type: 'string', example: '5551234567' },
          annual_income: { type: 'number', example: 85000 },
          loan_amount: { type: 'number', example: 320000 },
          credit_score: { type: 'integer', example: 720 },
          monthly_debt: { type: 'number', example: 450 },
          employment_years: { type: 'number', example: 5 },
          debt_to_income: { type: 'number', example: 0.36 },
          weighted_score: { type: 'number', example: 78.6 },
          score_breakdown: { $ref: '#/components/schemas/ScoreBreakdown' },
          auto_decision: { type: 'string', enum: ['approved', 'rejected', 'review'] },
          final_decision: { type: 'string', enum: ['approved', 'rejected', 'review'] },
          status: {
            type: 'string',
            enum: ['pending_review', 'in_review', 'approved', 'rejected', 'on_hold', 'auto_approved', 'auto_rejected', 'overridden'],
          },
          override_reason: { type: 'string', nullable: true, example: null },
          admin_notes: { type: 'string', nullable: true, example: null },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      ApplicationSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          loan_type: { type: 'string', enum: ['home', 'car', 'personal'] },
          full_name: { type: 'string' },
          weighted_score: { type: 'number' },
          auto_decision: { type: 'string', enum: ['approved', 'rejected', 'review'] },
          final_decision: { type: 'string', enum: ['approved', 'rejected', 'review'] },
          status: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuditEntry: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          action: { type: 'string', example: 'status_updated' },
          actor: { type: 'string', example: 'admin' },
          details: { type: 'string', example: 'Status changed to in_review.' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      UnderwritingRule: {
        type: 'object',
        properties: {
          loan_type: { type: 'string', enum: ['home', 'car', 'personal'] },
          min_credit_score: { type: 'integer', example: 620 },
          max_dti: { type: 'number', example: 43 },
          approval_score: { type: 'number', example: 75 },
          review_score: { type: 'number', example: 55 },
          weight_credit: { type: 'number', example: 0.35 },
          weight_income: { type: 'number', example: 0.25 },
          weight_dti: { type: 'number', example: 0.25 },
          weight_employment: { type: 'number', example: 0.15 },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Public'],
        summary: 'Health check',
        operationId: 'healthCheck',
        responses: {
          200: {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'LendFlow underwriting API is running' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/loan-types': {
      get: {
        tags: ['Public'],
        summary: 'List available loan types',
        operationId: 'getLoanTypes',
        responses: {
          200: {
            description: 'Array of loan type options',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/LoanType' },
                },
              },
            },
          },
        },
      },
    },
    '/applications': {
      post: {
        tags: ['Public'],
        summary: 'Submit a loan application',
        description: 'Creates a new loan application and immediately runs the auto-underwriting engine to produce an initial decision.',
        operationId: 'createApplication',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['loan_type', 'full_name', 'email', 'phone', 'annual_income', 'loan_amount', 'credit_score', 'monthly_debt', 'employment_years'],
                properties: {
                  loan_type: { type: 'string', enum: ['home', 'car', 'personal'] },
                  full_name: { type: 'string', minLength: 2, maxLength: 120, example: 'Jane Doe' },
                  email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
                  phone: { type: 'string', minLength: 9, maxLength: 10, example: '5551234567' },
                  annual_income: { type: 'number', exclusiveMinimum: 0, example: 85000 },
                  loan_amount: { type: 'number', exclusiveMinimum: 0, example: 320000 },
                  credit_score: { type: 'integer', minimum: 300, maximum: 900, example: 720 },
                  monthly_debt: { type: 'number', minimum: 0, example: 450 },
                  employment_years: { type: 'number', minimum: 0, maximum: 60, example: 5 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Application created with auto-underwriting result',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Application' } },
            },
          },
          400: {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'Underwriting rule not found for loan type',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/applications/{applicationId}': {
      get: {
        tags: ['Public'],
        summary: 'Get application by ID',
        operationId: 'getApplication',
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'UUID of the loan application',
          },
        ],
        responses: {
          200: {
            description: 'Application details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Application' } } },
          },
          404: {
            description: 'Application not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/admin/login': {
      post: {
        tags: ['Admin Auth'],
        summary: 'Admin login',
        description: 'Authenticates an admin user and returns a JWT bearer token.',
        operationId: 'adminLogin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', minLength: 3, example: 'admin' },
                  password: { type: 'string', minLength: 3, example: 'secret' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    token_type: { type: 'string', example: 'bearer' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/admin/dashboard': {
      get: {
        tags: ['Admin Dashboard'],
        summary: 'Get dashboard KPIs',
        description: 'Returns summary statistics and 8 most recent applications for the admin dashboard.',
        operationId: 'getDashboard',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total_applications: { type: 'integer', example: 142 },
                    pending_review: { type: 'integer', example: 18 },
                    approved_count: { type: 'integer', example: 89 },
                    rejected_count: { type: 'integer', example: 35 },
                    average_score: { type: 'number', example: 72.45 },
                    recent_applications: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ApplicationSummary' },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/admin/applications': {
      get: {
        tags: ['Admin Applications'],
        summary: 'List all applications',
        description: 'Returns a list of application summaries, optionally filtered by status or loan type.',
        operationId: 'listApplications',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['pending_review', 'in_review', 'approved', 'rejected', 'on_hold', 'auto_approved', 'auto_rejected', 'overridden'],
            },
          },
          {
            name: 'loan_type',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['home', 'car', 'personal'] },
          },
        ],
        responses: {
          200: {
            description: 'List of application summaries',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ApplicationSummary' } },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/admin/applications/{applicationId}': {
      get: {
        tags: ['Admin Applications'],
        summary: 'Get application with audit trail',
        operationId: 'getAdminApplication',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Application details and audit history',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    application: { $ref: '#/components/schemas/Application' },
                    audit: { type: 'array', items: { $ref: '#/components/schemas/AuditEntry' } },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          404: {
            description: 'Application not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/admin/applications/{applicationId}/status': {
      put: {
        tags: ['Admin Applications'],
        summary: 'Update application status',
        operationId: 'updateApplicationStatus',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['pending_review', 'in_review', 'approved', 'rejected', 'on_hold', 'auto_approved', 'auto_rejected', 'overridden'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated application',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Application' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Application not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/applications/{applicationId}/override': {
      post: {
        tags: ['Admin Applications'],
        summary: 'Manually override decision',
        description: 'Overrides the auto-underwriting decision with a manual approval or rejection and a required reason.',
        operationId: 'overrideApplication',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['decision', 'reason'],
                properties: {
                  decision: { type: 'string', enum: ['approved', 'rejected'] },
                  reason: { type: 'string', minLength: 5, maxLength: 500, example: 'Customer has strong alternative income sources.' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Application with override applied',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Application' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Application not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/applications/{applicationId}/notes': {
      post: {
        tags: ['Admin Applications'],
        summary: 'Add admin note',
        description: 'Appends a timestamped note to the application and sets status to in_review.',
        operationId: 'addNote',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['note'],
                properties: {
                  note: { type: 'string', minLength: 2, maxLength: 800, example: 'Requested additional income verification documents.' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated application with note appended',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Application' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Application not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/applications/{applicationId}/reevaluate': {
      post: {
        tags: ['Admin Applications'],
        summary: 'Re-run underwriting',
        description: 'Re-evaluates the application using the current underwriting rules. If the application was previously overridden, the override is preserved.',
        operationId: 'reevaluateApplication',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Application with updated scores and decision',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Application' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Application or rule not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/rules': {
      get: {
        tags: ['Admin Rules'],
        summary: 'Get all underwriting rules',
        operationId: 'getRules',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Array of underwriting rules for each loan type',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/UnderwritingRule' } },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/rules/{loanType}': {
      put: {
        tags: ['Admin Rules'],
        summary: 'Update underwriting rule',
        description: 'Updates scoring thresholds and weights for a specific loan type. approval_score must be greater than review_score.',
        operationId: 'updateRule',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'loanType',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['home', 'car', 'personal'] },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['min_credit_score', 'max_dti', 'approval_score', 'review_score', 'weight_credit', 'weight_income', 'weight_dti', 'weight_employment'],
                properties: {
                  min_credit_score: { type: 'integer', minimum: 300, maximum: 900, example: 620 },
                  max_dti: { type: 'number', minimum: 0, maximum: 100, example: 43 },
                  approval_score: { type: 'number', minimum: 0, maximum: 100, example: 75 },
                  review_score: { type: 'number', minimum: 0, maximum: 100, example: 55 },
                  weight_credit: { type: 'number', exclusiveMinimum: 0, example: 0.35 },
                  weight_income: { type: 'number', exclusiveMinimum: 0, example: 0.25 },
                  weight_dti: { type: 'number', exclusiveMinimum: 0, example: 0.25 },
                  weight_employment: { type: 'number', exclusiveMinimum: 0, example: 0.15 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated underwriting rule',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UnderwritingRule' } } },
          },
          400: {
            description: 'Validation error (e.g. approval_score not greater than review_score)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Loan type not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};
