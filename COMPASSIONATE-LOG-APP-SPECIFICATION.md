# Compassionate LOG - App Specification

## Executive Summary

**Compassionate LOG** is a multi-tenant mobile application designed for overdose response organizations to track, log, and analyze their outreach activities. The app enables harm reduction teams to document incidents, manage team member activities, track distribution of life-saving supplies, and generate analytics to improve community health outcomes.

## Core Purpose & Mission

The app serves organizations working in overdose prevention and response by providing:
- **Incident Tracking**: Log overdose incidents and responses
- **Outreach Management**: Track team member activities and supply distribution
- **Analytics & Insights**: Generate data-driven insights for program improvement
- **Multi-Organization Support**: Secure data isolation between different organizations
- **Compliance & Reporting**: Maintain audit trails and generate reports

---

## Application Architecture

### Multi-Tenant Structure
- **Organizations**: Independent entities with their own data and team members
- **Team Members**: Users belonging to specific organizations with role-based access
- **Data Isolation**: Complete separation of data between organizations using Row Level Security (RLS)
- **Invite System**: Organization-controlled onboarding via invite codes

### Technology Stack
- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Analytics**: Custom dashboard views and aggregations
- **Blockchain**: Foundation for future data integrity features

---

## User Flows & Onboarding

### New User Journey
1. **Download App** → Initial welcome screen
2. **Choose Path**:
   - Join existing organization (with invite code)
   - Request new organization setup
3. **Authentication** → Sign up/login with email
4. **Organization Assignment** → Automatic or manual assignment
5. **Legal Acceptance** → Terms, privacy policy, consent forms
6. **Dashboard Access** → Full app functionality unlocked

### Existing User Journey
1. **Login** → Email/password authentication
2. **Organization Context** → Automatic organization loading
3. **Dashboard** → Immediate access to relevant data and features

---

## Screen-by-Screen Breakdown

### Authentication Screens

#### Login Screen (`app/login.tsx`)
- **Purpose**: User authentication entry point
- **Features**: Email/password login, forgot password, sign up redirect
- **Data Flow**: Supabase Auth → User session → Organization context loading
- **User Input**: Email, password
- **Success Path**: Redirect to dashboard or onboarding

#### Signup Screen (`app/signup.tsx`)
- **Purpose**: New user registration
- **Features**: Email/password creation, validation, terms acceptance
- **Data Flow**: Create auth user → Trigger profile creation → Organization assignment
- **User Input**: Email, password, basic profile info
- **Success Path**: Onboarding flow or dashboard

### Onboarding Screens

#### Onboarding Index (`app/onboarding/index.tsx`)
- **Purpose**: Onboarding flow coordinator
- **Features**: Route users based on organization status
- **Logic**: Check if user has organization → Direct to appropriate screen

#### Enter Invite Code (`app/onboarding/enter-code.tsx`)
- **Purpose**: Join existing organization via invite code
- **Features**: Code validation, organization preview, confirmation
- **Data Flow**: Validate code → Show organization info → Create membership
- **User Input**: 6-character invite code
- **Success Path**: Organization assignment → Dashboard

#### Select Organization (`app/onboarding/select-org.tsx`)
- **Purpose**: Choose from available organizations (if multiple access)
- **Features**: Organization list, selection, confirmation
- **Data Flow**: Load accessible organizations → User selection → Set context

#### Request Organization (`app/onboarding/request-org.tsx`)
- **Purpose**: Request new organization setup
- **Features**: Organization details form, admin contact info
- **Data Flow**: Submit request → Admin notification → Manual approval process
- **User Input**: Organization name, description, contact details

### Legal & Consent Screens

#### Consent Screen (`app/consent.tsx`)
- **Purpose**: Legal compliance and data consent
- **Features**: Terms display, privacy policy, consent checkboxes
- **Data Flow**: Track acceptance → Update user profile → Enable full access
- **Requirements**: Must accept to proceed

#### Terms of Service (`app/legal/terms.tsx`)
- **Purpose**: Display full terms of service
- **Features**: Scrollable legal text, acceptance tracking

#### Privacy Policy (`app/legal/privacy.tsx`)
- **Purpose**: Display privacy policy
- **Features**: Data usage explanation, user rights information

### Main Application Screens (Tab Navigation)

#### Dashboard Tab (`app/(tabs)/dashboard.tsx`)
- **Purpose**: Central hub for organization overview and quick actions
- **Features**:
  - Organization health metrics
  - Recent incident summary
  - Quick action buttons (log incident, start outreach)
  - Team member activity overview
  - Key performance indicators
- **Data Sources**: 
  - Health dashboard views
  - Recent incidents
  - Team member statistics
  - Outreach summaries
- **User Actions**: Navigate to detailed screens, create new entries

#### Distribution Tab (`app/(tabs)/distribution.tsx`)
- **Purpose**: Track and manage supply distribution activities
- **Features**:
  - Log supply distribution events
  - Track inventory levels
  - Location-based distribution mapping
  - Supply effectiveness analytics
- **Data Flow**: Distribution logs → Location tracking → Analytics aggregation
- **User Input**: Supply type, quantity, location, recipient info (anonymized)

#### Settings Tab (`app/(tabs)/settings.tsx`)
- **Purpose**: User and organization configuration
- **Features**:
  - User profile management
  - Organization settings (if admin)
  - Notification preferences
  - Data export options
  - Logout functionality
- **Access Control**: Role-based feature visibility

### Specialized Screens

#### Outreach History (`app/outreach-history.tsx`)
- **Purpose**: Comprehensive view of all outreach activities
- **Features**:
  - Filterable activity log
  - Team member performance tracking
  - Location effectiveness analysis
  - Time-based analytics
- **Data Sources**: Outreach logs, team member data, location analytics
- **Filters**: Date range, team member, location, activity type

#### Request Organization (`app/request-organization.tsx`)
- **Purpose**: Formal organization certification request
- **Features**:
  - Detailed organization information form
  - Certification requirements checklist
  - Document upload capabilities
  - Status tracking
- **Data Flow**: Request submission → Admin review queue → Approval workflow

### Debug & Administrative Screens

#### Organization Debug (`app/__debug-org.tsx`, `app/__org-debug.tsx`)
- **Purpose**: Development and troubleshooting tools
- **Features**: Organization context inspection, RLS policy testing
- **Access**: Development/admin only

---

## Core Features Deep Dive

### 1. Incident Logging & Tracking

#### What It Does
- Records overdose incidents and response activities
- Tracks response times, outcomes, and interventions used
- Maintains anonymized victim information for analytics
- Links incidents to specific team members and locations

#### Data Flow
1. Team member encounters incident
2. Opens app → Incident logging screen
3. Records: Location, time, interventions, outcome, supplies used
4. Data saved with organization context and team member attribution
5. Incident appears in organization dashboard and analytics

#### User Expectations
- Quick, mobile-friendly incident entry
- Offline capability for field use
- GPS location capture
- Standardized intervention categories

#### Value Delivered
- Real-time incident tracking
- Response effectiveness measurement
- Geographic hotspot identification
- Compliance documentation

### 2. Outreach Activity Management

#### What It Does
- Logs proactive outreach activities (not just incident response)
- Tracks team member assignments and activities
- Records supply distribution and community engagement
- Measures outreach effectiveness by location and team member

#### Data Flow
1. Team member starts outreach shift
2. Logs activities throughout shift: locations visited, supplies distributed, contacts made
3. Records outcomes and follow-up needs
4. Data aggregated for team and location analytics
5. Feeds into organizational performance metrics

#### User Expectations
- Simple activity logging during field work
- Bulk entry capabilities for busy shifts
- Location tracking and mapping
- Supply inventory integration

#### Value Delivered
- Team member performance insights
- Location-based strategy optimization
- Supply distribution efficiency
- Community impact measurement

### 3. Multi-Organization Data Isolation

#### What It Does
- Ensures complete data separation between organizations
- Implements role-based access control within organizations
- Manages organization membership and permissions
- Provides secure invite-based onboarding

#### Technical Implementation
- **Row Level Security (RLS)**: Database-level data isolation
- **Organization Context**: All queries filtered by user's organization
- **Invite Codes**: Secure organization joining mechanism
- **Role Management**: Admin, team member, viewer permissions

#### Data Flow
1. User authenticates → Organization context established
2. All database queries automatically filtered by organization
3. RLS policies prevent cross-organization data access
4. Admin users can manage team members and settings within their organization

#### User Expectations
- Seamless single-organization experience
- No visibility into other organizations' data
- Secure team member management
- Reliable access control

#### Value Delivered
- Complete data privacy and security
- Scalable multi-tenant architecture
- Compliance with data protection requirements
- Independent organizational operations

### 4. Analytics & Reporting Dashboard

#### What It Does
- Aggregates incident and outreach data into actionable insights
- Provides real-time organizational health metrics
- Generates location-based effectiveness analysis
- Tracks team member performance and workload distribution

#### Dashboard Components
- **Health Metrics**: Incident trends, response times, outcome rates
- **Location Analytics**: Hotspot mapping, coverage analysis, effectiveness by area
- **Team Performance**: Individual and comparative team member metrics
- **Supply Tracking**: Distribution patterns, inventory needs, effectiveness measures
- **Temporal Analysis**: Time-based trends, seasonal patterns, shift effectiveness

#### Data Sources
- Incident logs with location and outcome data
- Outreach activity records
- Supply distribution tracking
- Team member assignment and activity data
- Geographic and temporal aggregations

#### User Expectations
- Real-time data updates
- Interactive charts and visualizations
- Exportable reports for stakeholders
- Mobile-optimized dashboard views

#### Value Delivered
- Data-driven decision making
- Resource allocation optimization
- Performance improvement identification
- Stakeholder reporting capabilities

### 5. Team Member Management

#### What It Does
- Manages organization team member roster
- Tracks individual performance and activities
- Handles role assignments and permissions
- Provides team member analytics and comparisons

#### Features
- **Member Profiles**: Contact info, role, performance metrics
- **Activity Tracking**: Individual incident and outreach logs
- **Performance Analytics**: Comparative effectiveness measures
- **Workload Management**: Shift assignments, activity distribution
- **Role-Based Access**: Different permission levels within organization

#### Data Flow
1. Admin adds team member via invite code or direct assignment
2. Team member activities automatically attributed to their profile
3. Performance metrics calculated from activity data
4. Analytics available for individual and comparative analysis

#### User Expectations
- Easy team member onboarding
- Fair performance measurement
- Privacy-respecting activity tracking
- Clear role and permission structure

#### Value Delivered
- Team optimization insights
- Fair workload distribution
- Performance recognition and improvement
- Organizational capacity planning

---

## Data Architecture & Flow

### Database Structure

#### Core Tables
- **users**: Authentication and basic profile data
- **organizations**: Organization details and settings
- **user_organizations**: Membership relationships with roles
- **incidents**: Overdose incident records
- **outreach_logs**: Proactive outreach activity records
- **team_members**: Extended team member profiles and analytics
- **certification_requests**: Organization approval workflow
- **invite_codes**: Secure organization joining mechanism

#### Analytics Views
- **health_dashboard**: Aggregated organizational health metrics
- **location_analytics**: Geographic effectiveness analysis
- **team_performance**: Individual and comparative team metrics
- **supply_tracking**: Distribution and inventory analytics

### Row Level Security (RLS) Implementation

#### Organization Isolation
```sql
-- All tables filtered by user's organization context
CREATE POLICY org_isolation ON incidents 
FOR ALL USING (organization_id = get_user_org_id());
```

#### Role-Based Access
- **Admin**: Full organization management, all data access
- **Team Member**: Own data + organization aggregates
- **Viewer**: Read-only access to organization data

#### Security Features
- Automatic organization context injection
- Cross-organization query prevention
- Audit trail for all data modifications
- Secure invite code validation

### Data Flow Patterns

#### Incident Logging Flow
```
Field Team Member → Mobile App → Incident Form → 
Supabase Database → RLS Filter → Organization Data → 
Analytics Engine → Dashboard Updates
```

#### Analytics Generation Flow
```
Raw Activity Data → Scheduled Aggregation → 
Analytics Views → Dashboard Queries → 
Real-time Metrics → User Interface
```

#### Organization Onboarding Flow
```
New User Signup → Organization Request/Invite → 
Admin Approval → User Assignment → 
Profile Creation → Dashboard Access
```

---

## Background Systems & Processes

### Supabase Backend Services

#### Authentication System
- Email/password authentication
- Session management and refresh
- Password reset functionality
- User profile creation triggers

#### Database Management
- PostgreSQL with Row Level Security
- Automated backups and point-in-time recovery
- Real-time subscriptions for live data updates
- Database function execution for complex operations

#### Real-time Features
- Live dashboard updates
- Team member activity notifications
- Incident alert system
- Analytics refresh triggers

### Automated Processes

#### Data Aggregation
- Scheduled analytics view refreshes
- Performance metric calculations
- Location effectiveness analysis
- Supply inventory tracking

#### Audit & Compliance
- Activity logging for all data modifications
- Legal acceptance tracking
- Data retention policy enforcement
- Export capabilities for compliance reporting

#### Organization Management
- Automatic user profile creation on signup
- Default organization assignment for new users
- Invite code generation and validation
- Certification request workflow automation

### Blockchain Foundation

#### Current Implementation
- Basic blockchain service structure
- Data integrity verification framework
- Preparation for immutable audit trails

#### Future Capabilities
- Tamper-proof incident records
- Cross-organization data verification
- Compliance audit trails
- Decentralized data backup

---

## User Expectations & Requirements

### What Users Must Provide

#### During Onboarding
- Valid email address and secure password
- Organization invite code OR organization request details
- Acceptance of terms of service and privacy policy
- Basic profile information (name, role)

#### During Regular Use
- Accurate incident and activity data
- Timely logging of field activities
- Proper location information for geographic analytics
- Appropriate use of organizational resources and data

#### For Administrators
- Team member management and role assignments
- Organization settings and configuration
- Invite code generation and distribution
- Compliance with data protection requirements

### What Users Can Expect

#### Data Security & Privacy
- Complete isolation from other organizations' data
- Secure authentication and session management
- Encrypted data transmission and storage
- Compliance with healthcare data protection standards

#### Performance & Reliability
- Fast, responsive mobile interface
- Offline capability for field use
- Real-time data synchronization when connected
- 99.9% uptime for critical functionality

#### Support & Training
- Intuitive, mobile-first user interface
- In-app help and guidance
- Documentation and training materials
- Technical support for issues and questions

---

## Value Proposition

### For Organizations
- **Improved Response Effectiveness**: Data-driven insights for better resource allocation
- **Compliance Documentation**: Automated audit trails and reporting capabilities
- **Team Optimization**: Performance analytics for team member development
- **Strategic Planning**: Location and temporal analysis for program improvement
- **Cost Efficiency**: Reduced administrative overhead through automation

### For Team Members
- **Streamlined Workflow**: Quick, mobile-optimized data entry
- **Performance Recognition**: Fair, data-based performance measurement
- **Professional Development**: Insights for skill improvement and career growth
- **Reduced Paperwork**: Digital logging replaces manual documentation
- **Real-time Feedback**: Immediate access to activity impact and effectiveness

### For Communities
- **Better Coverage**: Optimized outreach based on geographic and temporal analysis
- **Faster Response**: Improved incident response times through better coordination
- **Resource Optimization**: More effective supply distribution and inventory management
- **Evidence-Based Programs**: Data-driven program improvements and expansions
- **Transparency**: Clear metrics on program effectiveness and community impact

### For Stakeholders & Funders
- **Measurable Impact**: Clear metrics on program effectiveness and outcomes
- **Accountability**: Transparent reporting on resource utilization
- **Scalability Evidence**: Data supporting program expansion and replication
- **Compliance Assurance**: Automated compliance with reporting requirements
- **ROI Demonstration**: Clear evidence of program value and cost-effectiveness

---

## Technical Specifications

### Mobile Application
- **Platform**: React Native with Expo
- **Deployment**: iOS App Store, Google Play Store, TestFlight for beta
- **Offline Support**: Local storage with sync capabilities
- **Performance**: Optimized for field use on various device types

### Backend Infrastructure
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with email/password
- **API**: RESTful API with real-time subscriptions
- **Security**: End-to-end encryption, secure data transmission

### Analytics & Reporting
- **Real-time Dashboards**: Live data updates and visualizations
- **Export Capabilities**: CSV, PDF report generation
- **Custom Views**: Configurable analytics for different organizational needs
- **Performance Optimization**: Indexed queries and materialized views

---

This specification provides a comprehensive overview of Compassionate LOG's functionality, architecture, and value proposition. The app serves as a critical tool for overdose response organizations to improve their effectiveness, ensure compliance, and demonstrate impact through data-driven insights.