# Team Features Implementation Plan

## How Team Subscriptions Should Work

### 1. **Team Creation & Management**
- **Team Owner** upgrades to Team/Enterprise plan via Stripe
- Team gets created automatically after successful payment
- Owner can invite team members via email addresses
- Team gets a unique workspace URL: `/team/[team-slug]`

### 2. **Invitation Flow**
```
1. Team Owner clicks "Invite Member" → enters email + role
2. System sends invitation email with secure token
3. Invitee clicks link → signs up/logs in with GitHub
4. Invitee accepts invite → joins team workspace
5. Team Owner gets notification of acceptance
```

### 3. **Team Permissions System**
- **Owner**: Full control, billing, invite/remove members, delete team
- **Admin**: Invite members, manage repositories, moderate comments  
- **Member**: View shared repos, create analyses, comment
- **Viewer**: View-only access to shared repositories/analyses

### 4. **Shared Repository Workflow**
```
1. Team Member adds repository to team workspace
2. All team members can now analyze this repository
3. Analyses are marked as "shared" and visible to team
4. Team members can comment on shared visualizations
5. Export permissions based on individual user's role
```

## Testing Plan

### Phase 1: Basic Team Setup
1. **Upgrade to Team Plan**
   - Test Stripe checkout for team subscription
   - Verify team creation in database
   - Check owner permissions

2. **Team Member Invitation**
   - Send invites to test email addresses  
   - Test invitation email delivery
   - Test invite acceptance flow
   - Verify member permissions

### Phase 2: Collaboration Features
3. **Repository Sharing**
   - Add repository to team workspace
   - Verify all members can see shared repo
   - Test analysis creation on shared repos

4. **Commenting System** 
   - Add comments to shared visualizations
   - Test notification delivery to team members
   - Verify comment permissions by role

### Phase 3: Advanced Features  
5. **Team Analytics Dashboard**
   - Team-wide analysis statistics
   - Member activity summaries
   - Repository usage metrics

6. **Enterprise Features**
   - Custom branding on exports
   - API access for team data
   - SSO integration testing

## API Endpoints Needed

### Team Management
- `POST /api/teams` - Create team (auto after subscription)
- `GET /api/teams/[teamId]` - Get team details
- `PUT /api/teams/[teamId]` - Update team settings
- `DELETE /api/teams/[teamId]` - Delete team

### Member Management  
- `POST /api/teams/[teamId]/invitations` - Send invitation
- `GET /api/teams/[teamId]/members` - List team members
- `PUT /api/teams/[teamId]/members/[userId]` - Update member role
- `DELETE /api/teams/[teamId]/members/[userId]` - Remove member

### Repository Sharing
- `POST /api/teams/[teamId]/repositories` - Add shared repository
- `GET /api/teams/[teamId]/repositories` - List shared repositories  
- `DELETE /api/teams/[teamId]/repositories/[repoId]` - Remove repository

### Comments & Collaboration
- `POST /api/analyses/[analysisId]/comments` - Add comment
- `GET /api/analyses/[analysisId]/comments` - Get comments
- `PUT /api/comments/[commentId]` - Edit comment
- `DELETE /api/comments/[commentId]` - Delete comment

## Current State vs Required Implementation

### ✅ Already Working
- Stripe subscription system
- Individual user profiles  
- Basic notification infrastructure
- Subscription tier checking

### 🔨 Needs Implementation
- Team database tables (use `team-features-schema.sql`)
- Invitation system with email delivery
- Team workspace UI components
- Repository sharing functionality
- Commenting system
- Team-level permissions

### 🧪 Testing Strategy
1. **Local Development**: Use Stripe test mode + test email addresses
2. **Database Setup**: Run team schema migrations on test database
3. **Email Testing**: Use services like Mailtrap for invitation emails  
4. **Role Testing**: Create multiple test accounts with different team roles
5. **Integration Testing**: Test full workflow from upgrade → invite → collaborate

## Ready to Implement?
The foundation is solid with your Stripe integration and RLS policies working. The main work needed is:
1. Database schema extension for teams
2. Team invitation system with email delivery
3. Team workspace UI components
4. Repository sharing and commenting features

Would you like me to start implementing any of these components?