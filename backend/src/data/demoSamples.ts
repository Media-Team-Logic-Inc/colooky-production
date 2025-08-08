// Demo sample data for interactive visualization
export const demoSamples = {
  'auth-ecommerce': {
    id: 'auth-ecommerce',
    name: 'E-commerce Auth System',
    description: 'Complete authentication flow with JWT, roles, and protected routes',
    tags: ['authentication', 'jwt', 'rbac', 'e-commerce'],
    complexity: 'intermediate',
    analysisData: {
      repositoryName: 'auth-ecommerce-demo',
      fileCount: 12,
      functionCount: 28,
      classCount: 4,
      importCount: 45,
      apiCallCount: 8,
      linesOfCode: 850,
      entities: [
        // Authentication Flow Entities
        {
          id: 'login-endpoint',
          entityType: 'function',
          name: 'login',
          filePath: '/routes/auth.js',
          lineStart: 15,
          lineEnd: 45,
          complexity: 6,
          parameters: ['email', 'password'],
          returnType: 'Promise<AuthResponse>',
          isAsync: true,
          isExported: true,
          dependencies: ['validateCredentials', 'generateJWT', 'updateLastLogin'],
          dependents: ['authMiddleware', 'loginComponent'],
          metadata: {
            description: 'Main login endpoint that validates credentials and returns JWT',
            tags: ['auth', 'endpoint', 'jwt'],
            httpMethod: 'POST',
            route: '/api/auth/login'
          }
        },
        {
          id: 'auth-middleware',
          entityType: 'function',
          name: 'authenticateToken',
          filePath: '/middleware/auth.js',
          lineStart: 8,
          lineEnd: 30,
          complexity: 4,
          parameters: ['req', 'res', 'next'],
          returnType: 'void',
          isAsync: true,
          isExported: true,
          dependencies: ['verifyJWT', 'getUserById'],
          dependents: ['protectedRoutes', 'userRoutes', 'adminRoutes'],
          metadata: {
            description: 'JWT authentication middleware for protected routes',
            tags: ['middleware', 'jwt', 'auth'],
            protects: ['user-profile', 'orders', 'admin-panel']
          }
        },
        {
          id: 'rbac-middleware',
          entityType: 'function',
          name: 'requireRole',
          filePath: '/middleware/rbac.js',
          lineStart: 5,
          lineEnd: 25,
          complexity: 3,
          parameters: ['roles'],
          returnType: 'middleware',
          isAsync: false,
          isExported: true,
          dependencies: ['getUserRoles', 'checkPermissions'],
          dependents: ['adminRoutes', 'moderatorRoutes'],
          metadata: {
            description: 'Role-based access control middleware',
            tags: ['rbac', 'authorization', 'roles'],
            supportedRoles: ['admin', 'moderator', 'customer']
          }
        },
        {
          id: 'register-endpoint',
          entityType: 'function',
          name: 'register',
          filePath: '/routes/auth.js',
          lineStart: 50,
          lineEnd: 85,
          complexity: 8,
          parameters: ['email', 'password', 'firstName', 'lastName'],
          returnType: 'Promise<RegisterResponse>',
          isAsync: true,
          isExported: true,
          dependencies: ['hashPassword', 'createUser', 'sendVerificationEmail'],
          dependents: ['registerComponent'],
          metadata: {
            description: 'User registration with email verification',
            tags: ['auth', 'registration', 'email-verification'],
            httpMethod: 'POST',
            route: '/api/auth/register'
          }
        },
        {
          id: 'password-reset',
          entityType: 'function',
          name: 'resetPassword',
          filePath: '/routes/auth.js',
          lineStart: 90,
          lineEnd: 120,
          complexity: 7,
          parameters: ['email'],
          returnType: 'Promise<ResetResponse>',
          isAsync: true,
          isExported: true,
          dependencies: ['generateResetToken', 'sendResetEmail', 'updateUser'],
          dependents: ['forgotPasswordComponent'],
          metadata: {
            description: 'Password reset flow with email token',
            tags: ['auth', 'password-reset', 'email'],
            httpMethod: 'POST',
            route: '/api/auth/reset-password'
          }
        },
        {
          id: 'user-profile',
          entityType: 'function',
          name: 'getUserProfile',
          filePath: '/routes/users.js',
          lineStart: 12,
          lineEnd: 28,
          complexity: 2,
          parameters: ['req', 'res'],
          returnType: 'Promise<UserProfile>',
          isAsync: true,
          isExported: true,
          dependencies: ['authenticateToken', 'sanitizeUser'],
          dependents: ['profileComponent', 'dashboardComponent'],
          metadata: {
            description: 'Get authenticated user profile data',
            tags: ['user', 'profile', 'protected'],
            httpMethod: 'GET',
            route: '/api/users/profile',
            requiresAuth: true
          }
        },
        {
          id: 'admin-panel',
          entityType: 'function',
          name: 'getAdminDashboard',
          filePath: '/routes/admin.js',
          lineStart: 8,
          lineEnd: 35,
          complexity: 5,
          parameters: ['req', 'res'],
          returnType: 'Promise<AdminData>',
          isAsync: true,
          isExported: true,
          dependencies: ['authenticateToken', 'requireRole', 'getSystemStats'],
          dependents: ['adminDashboardComponent'],
          metadata: {
            description: 'Admin dashboard with system statistics',
            tags: ['admin', 'dashboard', 'rbac'],
            httpMethod: 'GET',
            route: '/api/admin/dashboard',
            requiresAuth: true,
            requiresRole: 'admin'
          }
        },
        {
          id: 'checkout-flow',
          entityType: 'function',
          name: 'processCheckout',
          filePath: '/routes/orders.js',
          lineStart: 45,
          lineEnd: 85,
          complexity: 9,
          parameters: ['req', 'res'],
          returnType: 'Promise<CheckoutResponse>',
          isAsync: true,
          isExported: true,
          dependencies: ['authenticateToken', 'validateCart', 'processPayment', 'createOrder'],
          dependents: ['checkoutComponent'],
          metadata: {
            description: 'Secure checkout process requiring authentication',
            tags: ['checkout', 'payment', 'protected', 'e-commerce'],
            httpMethod: 'POST',
            route: '/api/orders/checkout',
            requiresAuth: true,
            paymentMethods: ['stripe', 'paypal']
          }
        }
      ],
      // Flow definitions for visualization
      flows: [
        {
          id: 'login-flow',
          name: 'User Login Flow',
          description: 'Complete user authentication process',
          steps: [
            'login-endpoint',
            'validateCredentials', 
            'generateJWT',
            'auth-middleware',
            'user-profile'
          ],
          color: '#4CAF50'
        },
        {
          id: 'registration-flow',
          name: 'User Registration Flow',
          description: 'New user account creation with email verification',
          steps: [
            'register-endpoint',
            'hashPassword',
            'createUser',
            'sendVerificationEmail'
          ],
          color: '#2196F3'
        },
        {
          id: 'admin-access-flow',
          name: 'Admin Access Flow',
          description: 'Role-based admin panel access',
          steps: [
            'auth-middleware',
            'rbac-middleware',
            'admin-panel'
          ],
          color: '#FF9800'
        },
        {
          id: 'secure-checkout-flow',
          name: 'Secure Checkout Flow',
          description: 'Authenticated user purchase process',
          steps: [
            'auth-middleware',
            'validateCart',
            'checkout-flow',
            'processPayment',
            'createOrder'
          ],
          color: '#9C27B0'
        }
      ]
    }
  }
};

export type DemoSample = typeof demoSamples[keyof typeof demoSamples];