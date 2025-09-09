import { FlowScenario } from '../components/FlexibleSubwayMap';

export const demoScenarios: FlowScenario[] = [
  // 1. User Signup Flow (original)
  {
    id: 'signup',
    title: 'User Signup Flow',
    description: 'From Button Click to Database - Complete user registration process',
    legendItems: [
      { color: '#3b82f6', label: 'Frontend/UI' },
      { color: '#10b981', label: 'API/Backend' },
      { color: '#f59e0b', label: 'Database' },
      { color: '#8b5cf6', label: 'Auth/Security' },
      { color: '#ef4444', label: 'Data Issues' },
      { color: '#6b7280', label: 'External Service' },
    ],
    nodes: [
      {
        id: 'signup-btn',
        title: 'SignupButton.jsx',
        x: 160, y: 120, width: 140, height: 50,
        color: '#3b82f6', strokeColor: '#60a5fa',
        stepNumber: 1,
        details: [
          'File: src/components/SignupButton.jsx:21',
          'Triggers onClick handler',
          'Opens signup modal', 
          'Line 21: setShowModal(true)'
        ]
      },
      {
        id: 'form-modal',
        title: 'SignupModal.jsx',
        x: 160, y: 230, width: 140, height: 50,
        color: '#3b82f6', strokeColor: '#60a5fa',
        stepNumber: 2,
        details: [
          'File: src/components/SignupModal.jsx:67',
          'Renders form with email/password fields',
          'Client-side validation',
          'Calls handleSubmit on form submission'
        ]
      },
      {
        id: 'api-call',
        title: '/api/auth/signup',
        x: 400, y: 200, width: 140, height: 50,
        color: '#10b981', strokeColor: '#34d399',
        stepNumber: 3,
        details: [
          'File: src/pages/api/auth/signup.js:137',
          'HTTP POST endpoint',
          'Validates request body',
          'Calls authentication service'
        ]
      },
      {
        id: 'password-hash',
        title: 'bcrypt.hash()',
        x: 620, y: 120, width: 140, height: 50,
        color: '#8b5cf6', strokeColor: '#a78bfa',
        stepNumber: 4,
        details: [
          'Library: bcrypt',
          'Salt rounds: 12',
          'Async operation',
          'Returns hashed password'
        ]
      },
      {
        id: 'db-insert',
        title: 'User.create()',
        x: 620, y: 280, width: 140, height: 50,
        color: '#f59e0b', strokeColor: '#fbbf24',
        stepNumber: 5,
        details: [
          'Model: User (Prisma/Mongoose)',
          'Function: User.create()',
          'Inserts to users table',
          'Returns user object'
        ]
      },
      {
        id: 'response',
        title: 'JSON Response',
        x: 400, y: 350, width: 140, height: 50,
        color: '#10b981', strokeColor: '#34d399',
        details: [
          'HTTP 201: Created',
          'Returns user object (sanitized)',
          'Sets authentication cookies',
          'Success message'
        ]
      },
    ],
    connections: [
      { from: { x: 230, y: 170 }, to: { x: 230, y: 230 }, color: '#3b82f6' },
      { from: { x: 300, y: 255 }, to: { x: 400, y: 225 }, color: '#10b981' },
      { from: { x: 540, y: 225 }, to: { x: 620, y: 145 }, color: '#8b5cf6' },
      { from: { x: 690, y: 170 }, to: { x: 690, y: 280 }, color: '#f59e0b' },
      { from: { x: 620, y: 305 }, to: { x: 540, y: 375 }, color: '#10b981' },
      { from: { x: 470, y: 350 }, to: { x: 230, y: 280 }, color: '#3b82f6' },
    ]
  },

  // 2. API Request Flow
  {
    id: 'api-request',
    title: 'API Request Flow',
    description: 'REST API call from frontend to external service with caching',
    legendItems: [
      { color: '#3b82f6', label: 'Frontend' },
      { color: '#10b981', label: 'Backend API' },
      { color: '#f59e0b', label: 'Database/Cache' },
      { color: '#8b5cf6', label: 'External API' },
      { color: '#ef4444', label: 'Data Issues' },
    ],
    nodes: [
      {
        id: 'fetch-data',
        title: 'fetchUserData()',
        x: 50, y: 100, width: 120, height: 40,
        color: '#3b82f6', strokeColor: '#60a5fa',
        stepNumber: 1,
        details: [
          'Frontend function call',
          'Triggered by user action',
          'Sends GET request to /api/users',
          'Handles loading state'
        ]
      },
      {
        id: 'api-endpoint',
        title: '/api/users',
        x: 250, y: 100, width: 120, height: 40,
        color: '#10b981', strokeColor: '#34d399',
        stepNumber: 2,
        details: [
          'Express.js route handler',
          'Validates request parameters',
          'Checks authentication',
          'Implements rate limiting'
        ]
      },
      {
        id: 'cache-check',
        title: 'Redis.get()',
        x: 450, y: 50, width: 120, height: 40,
        color: '#f59e0b', strokeColor: '#fbbf24',
        stepNumber: 3,
        details: [
          'Check Redis cache first',
          'Key: user:${userId}',
          'TTL: 300 seconds',
          'Returns cached data if exists'
        ]
      },
      {
        id: 'external-api',
        title: 'UserService API',
        x: 450, y: 150, width: 120, height: 40,
        color: '#8b5cf6', strokeColor: '#a78bfa',
        stepNumber: 4,
        details: [
          'External service call',
          'HTTP GET with auth token',
          'Handles API rate limits',
          'Returns user profile data'
        ]
      },
      {
        id: 'cache-set',
        title: 'Redis.set()',
        x: 450, y: 250, width: 120, height: 40,
        color: '#f59e0b', strokeColor: '#fbbf24',
        details: [
          'Store in cache for next time',
          'Set TTL to 5 minutes',
          'Key: user:${userId}',
          'Async operation'
        ]
      },
      {
        id: 'format-response',
        title: 'formatResponse()',
        x: 250, y: 250, width: 120, height: 40,
        color: '#10b981', strokeColor: '#34d399',
        details: [
          'Transform data structure',
          'Remove sensitive fields',
          'Add metadata',
          'Return JSON response'
        ]
      }
    ],
    connections: [
      { from: { x: 170, y: 120 }, to: { x: 250, y: 120 }, color: '#64b5f6' },
      { from: { x: 370, y: 120 }, to: { x: 450, y: 70 }, color: '#f59e0b' },
      { from: { x: 450, y: 90 }, to: { x: 450, y: 150 }, color: '#8b5cf6' },
      { from: { x: 510, y: 190 }, to: { x: 510, y: 250 }, color: '#f59e0b' },
      { from: { x: 450, y: 270 }, to: { x: 370, y: 270 }, color: '#10b981' },
      { from: { x: 250, y: 250 }, to: { x: 170, y: 120 }, color: '#64b5f6' },
    ]
  },

  // 3. Payment Processing Flow
  {
    id: 'payment',
    title: 'Payment Processing',
    description: 'Secure payment flow from checkout to confirmation',
    legendItems: [
      { color: '#3b82f6', label: 'Frontend' },
      { color: '#10b981', label: 'Backend' },
      { color: '#8b5cf6', label: 'Payment Gateway' },
      { color: '#f59e0b', label: 'Database' },
      { color: '#ef4444', label: 'Data Issues' },
      { color: '#06d6a0', label: 'Notification' },
    ],
    nodes: [
      {
        id: 'checkout-form',
        title: 'CheckoutForm.jsx',
        x: 50, y: 100, width: 120, height: 40,
        color: '#3b82f6', strokeColor: '#60a5fa',
        stepNumber: 1,
        details: [
          'Payment form component',
          'Collects card details',
          'Client-side validation',
          'PCI compliant handling'
        ]
      },
      {
        id: 'payment-intent',
        title: 'createPayment()',
        x: 250, y: 100, width: 120, height: 40,
        color: '#10b981', strokeColor: '#34d399',
        stepNumber: 2,
        details: [
          'Backend payment handler',
          'Creates payment intent',
          'Validates amount/currency',
          'Generates secure token'
        ]
      },
      {
        id: 'stripe-api',
        title: 'Stripe API',
        x: 450, y: 100, width: 120, height: 40,
        color: '#8b5cf6', strokeColor: '#a78bfa',
        stepNumber: 3,
        details: [
          'Process payment with Stripe',
          'Handles 3D Secure',
          'Returns payment status',
          'Manages failures gracefully'
        ]
      },
      {
        id: 'save-transaction',
        title: 'Transaction.create()',
        x: 450, y: 200, width: 120, height: 40,
        color: '#f59e0b', strokeColor: '#fbbf24',
        stepNumber: 4,
        details: [
          'Save transaction record',
          'Store payment reference',
          'Update order status',
          'Audit trail creation'
        ]
      },
      {
        id: 'send-confirmation',
        title: 'sendEmail()',
        x: 250, y: 200, width: 120, height: 40,
        color: '#06d6a0', strokeColor: '#34d399',
        details: [
          'Send confirmation email',
          'Include receipt PDF',
          'Update user notification',
          'Queue background job'
        ]
      },
      {
        id: 'success-redirect',
        title: 'SuccessPage.jsx',
        x: 50, y: 200, width: 120, height: 40,
        color: '#3b82f6', strokeColor: '#60a5fa',
        details: [
          'Payment success page',
          'Show confirmation message',
          'Display transaction ID',
          'Next steps guidance'
        ]
      }
    ],
    connections: [
      { from: { x: 170, y: 120 }, to: { x: 250, y: 120 }, color: '#64b5f6' },
      { from: { x: 370, y: 120 }, to: { x: 450, y: 120 }, color: '#8b5cf6' },
      { from: { x: 510, y: 140 }, to: { x: 510, y: 200 }, color: '#f59e0b' },
      { from: { x: 450, y: 220 }, to: { x: 370, y: 220 }, color: '#06d6a0' },
      { from: { x: 250, y: 220 }, to: { x: 170, y: 220 }, color: '#64b5f6' },
    ]
  },

  // 4. File Upload Flow
  {
    id: 'file-upload',
    title: 'File Upload System',
    description: 'Multi-step file processing with validation and storage',
    legendItems: [
      { color: '#3b82f6', label: 'Frontend' },
      { color: '#10b981', label: 'Upload API' },
      { color: '#f59e0b', label: 'File Storage' },
      { color: '#8b5cf6', label: 'Processing' },
      { color: '#ef4444', label: 'Validation' },
    ],
    nodes: [
      {
        id: 'file-input',
        title: 'FileUpload.jsx',
        x: 50, y: 100, width: 120, height: 40,
        color: '#3b82f6', strokeColor: '#60a5fa',
        stepNumber: 1,
        details: [
          'Drag & drop file input',
          'Progress bar component',
          'File type validation',
          'Size limit checking'
        ]
      },
      {
        id: 'upload-endpoint',
        title: '/api/upload',
        x: 250, y: 100, width: 120, height: 40,
        color: '#10b981', strokeColor: '#34d399',
        stepNumber: 2,
        details: [
          'Multer middleware',
          'File size validation',
          'MIME type checking',
          'Virus scanning hook'
        ]
      },
      {
        id: 'virus-scan',
        title: 'antiVirusScan()',
        x: 250, y: 200, width: 120, height: 40,
        color: '#ef4444', strokeColor: '#f87171',
        stepNumber: 3,
        details: [
          'ClamAV integration',
          'Async scanning process',
          'Quarantine malicious files',
          'Log security events'
        ]
      },
      {
        id: 'cloud-storage',
        title: 'AWS S3 Upload',
        x: 450, y: 100, width: 120, height: 40,
        color: '#f59e0b', strokeColor: '#fbbf24',
        stepNumber: 4,
        details: [
          'Upload to S3 bucket',
          'Generate CDN URL',
          'Set appropriate permissions',
          'Enable versioning'
        ]
      },
      {
        id: 'image-processing',
        title: 'imageProcessor()',
        x: 450, y: 200, width: 120, height: 40,
        color: '#8b5cf6', strokeColor: '#a78bfa',
        details: [
          'Generate thumbnails',
          'Optimize image quality',
          'Extract metadata',
          'Multiple format support'
        ]
      },
      {
        id: 'save-metadata',
        title: 'File.create()',
        x: 350, y: 300, width: 120, height: 40,
        color: '#f59e0b', strokeColor: '#fbbf24',
        details: [
          'Save file metadata',
          'Store file path/URL',
          'Link to user account',
          'Update usage quotas'
        ]
      }
    ],
    connections: [
      { from: { x: 170, y: 120 }, to: { x: 250, y: 120 }, color: '#64b5f6' },
      { from: { x: 310, y: 140 }, to: { x: 310, y: 200 }, color: '#ef4444' },
      { from: { x: 370, y: 120 }, to: { x: 450, y: 120 }, color: '#f59e0b' },
      { from: { x: 510, y: 140 }, to: { x: 510, y: 200 }, color: '#8b5cf6' },
      { from: { x: 450, y: 220 }, to: { x: 410, y: 300 }, color: '#f59e0b' },
      { from: { x: 310, y: 240 }, to: { x: 350, y: 300 }, color: '#ef4444' },
    ]
  }
];

export const getScenarioById = (id: string): FlowScenario | undefined => {
  return demoScenarios.find(scenario => scenario.id === id);
};

export default demoScenarios;