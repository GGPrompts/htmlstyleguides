# Azure AD / Microsoft Entra ID and Identity Governance - Research Brief

**Research Date:** February 12, 2026
**Purpose:** Comprehensive technical reference for Azure identity and governance systems
**Target Audience:** Cloud architects, security engineers, identity administrators

---

## Executive Summary

Microsoft Entra ID (formerly Azure Active Directory) is Microsoft's cloud-based identity and access management service. Identity Governance provides advanced capabilities for managing identity lifecycles, access reviews, privileged access, and compliance requirements. This brief covers core concepts, implementation patterns, CLI/PowerShell commands, and best practices current as of 2026.

**Critical 2026 Updates:**
- Azure AD officially rebranded to Microsoft Entra ID (2023, now standard terminology)
- Azure AD Connect Sync v2.5.79.0+ required by September 30, 2026
- Conditional Access policy enforcement changes effective March 27, 2026
- PIM API iteration 2 (beta) deprecation on October 28, 2026
- Azure AD B2C P2 discontinued March 15, 2026

---

## Part 1: Azure AD / Microsoft Entra ID Fundamentals

### 1.1 Cloud Identity Fundamentals

#### Tenant and Directory Concepts

**Tenant:**
- A dedicated, isolated instance of the Microsoft Entra ID service
- Created when an organization signs up for a Microsoft cloud service
- Has its own identity and access management scope distinct from other tenants
- Tenant ID and Directory ID are synonymous

**Directory:**
- Contains the identities and objects necessary to authenticate to authorized resources
- Each directory has one or more domains
- A directory can have many subscriptions but only one tenant
- The directory is part of the tenant structure

**Key Relationship:** A tenant and directory are parts of each other - the tenant provides the container while the directory holds the actual identity objects.

**Finding Your Tenant ID:**
```bash
# Azure CLI
az account show --query tenantId -o tsv

# PowerShell (Microsoft Graph)
Connect-MgGraph
Get-MgOrganization | Select-Object Id
```

#### What is Microsoft Entra?

Microsoft Entra is Microsoft's comprehensive identity and access management platform that includes:
- **Microsoft Entra ID** - Core identity service (formerly Azure AD)
- **Microsoft Entra External ID** - B2B and customer identity solutions
- **Microsoft Entra Verified ID** - Decentralized identity
- **Microsoft Entra Permissions Management** - Cloud infrastructure entitlement management
- **Microsoft Entra Private Access / Internet Access** - Zero Trust network access

---

### 1.2 Azure AD vs On-Premises Active Directory

#### Core Differences

| Aspect | On-Premises AD | Azure AD / Entra ID |
|--------|---------------|---------------------|
| **Deployment** | Runs on local servers, maintained by IT | Cloud-hosted, managed by Microsoft |
| **Scope** | Local Windows networks, Domain Controllers | Cloud apps, Microsoft 365, modern auth |
| **Protocols** | Kerberos, LDAP, NTLM, Group Policy | OAuth 2.0, SAML, OpenID Connect, WS-Federation |
| **Management** | Hardware, updates, patches by organization | Platform managed by Microsoft, policies by tenant |
| **Use Cases** | Traditional domain scenarios, legacy apps | Cloud applications, SSO, modern security |
| **Query Protocol** | LDAP | Microsoft Graph API (REST) |
| **Structure** | Hierarchical (OUs, forests, domains) | Flat tenant structure with administrative units |

#### When to Use Each

**On-Premises AD:**
- Traditional Windows domain scenarios
- Legacy applications requiring Kerberos/NTLM
- Local network resources
- Group Policy requirements

**Azure AD / Entra ID:**
- Cloud applications (SaaS)
- Microsoft 365 services
- Mobile device management
- Modern authentication with MFA and Conditional Access
- External user collaboration (B2B)

**Hybrid Approach (Most Common):**
- Organizations with both on-premises and cloud resources
- Single identity for accessing both environments
- Seamless user experience across cloud and on-premises

---

### 1.3 Azure AD Connect and Hybrid Identity

#### Overview

Azure AD Connect (now called Microsoft Entra Connect) synchronizes on-premises Active Directory identities with Microsoft Entra ID, enabling hybrid identity scenarios.

#### Critical 2026 Requirement

**MANDATORY UPGRADE:** All customers must upgrade to Microsoft Entra Connect Sync version **2.5.79.0 or higher** before **September 30, 2026**. Synchronization services will stop working if not upgraded.

#### Key Components

**Synchronization Engine:**
- Bidirectional sync between on-premises AD and Entra ID
- Attribute flow customization
- Filtering (OU-based, domain-based, attribute-based)

**Authentication Methods:**

1. **Password Hash Synchronization (PHS)** - Recommended
   - Hash of password hash synchronized to cloud
   - Users authenticate directly against Entra ID
   - Fastest, most resilient option
   - Enables leaked credential detection

2. **Pass-Through Authentication (PTA)**
   - Authentication requests pass through to on-premises AD
   - Password never leaves on-premises
   - Requires on-premises agent
   - Real-time authentication

3. **Federation (AD FS / PingFederate)**
   - External identity provider handles authentication
   - Most complex, requires infrastructure
   - Use only if specific requirements demand it

#### Security Hardening (2026)

Microsoft is enforcing hardening measures against "syncjacking" attacks:
- Full enforcement beginning March 2026
- Applies to Entra Connect version and tenant configuration
- Organizations should upgrade immediately to maintain security posture

#### Installation and Configuration

```powershell
# Check current Entra Connect version
Get-ADSyncScheduler | Select-Object CurrentlyEffectiveServerVersion

# Common sync operations
Start-ADSyncSyncCycle -PolicyType Delta    # Delta sync
Start-ADSyncSyncCycle -PolicyType Initial  # Full sync

# View sync connector status
Get-ADSyncConnectorRunStatus

# Export sync configuration (for backup)
Get-ADSyncServerConfiguration -Path "C:\Backup\ADSync"
```

#### Best Practices

1. **Always use Password Hash Sync** even with PTA or Federation as backup
2. **Enable seamless SSO** for better user experience
3. **Filter sync scope** to only needed OUs/users
4. **Stage servers** for high availability
5. **Monitor sync health** via Azure AD Connect Health
6. **Test changes** in non-production first

---

### 1.4 Conditional Access Policies

#### Overview

Conditional Access is the Zero Trust policy engine in Microsoft Entra ID. It uses signals to make real-time decisions about access to resources.

#### Policy Components

**Signals (Conditions):**
- User or group membership
- IP location information
- Device platform (iOS, Android, Windows, macOS)
- Device compliance state (Intune)
- Application being accessed
- Real-time sign-in risk (Identity Protection)
- User risk level

**Access Controls:**

**Grant Controls:**
- Block access
- Grant access (with requirements):
  - Require multifactor authentication (MFA)
  - Require device to be compliant (Intune)
  - Require Hybrid Azure AD joined device
  - Require approved client app
  - Require app protection policy
  - Require authentication strength
  - Require password change

**Session Controls:**
- Application enforced restrictions
- Conditional Access App Control
- Sign-in frequency
- Persistent browser session
- Disable resilience defaults
- Customize continuous access evaluation

#### Critical 2026 Update: Resource Exclusion Enforcement

**Effective Date:** March 27, 2026 (rolling out through June 2026)

**Change:** Conditional Access policies targeting "All resources" with resource exclusions will now be enforced during sign-in for applications requesting only OIDC scopes or limited directory scopes.

**Impact:** Previously, these policies could be bypassed by applications requesting minimal scopes. After March 27, 2026, enforcement will be consistent.

**Required Action by March 2026:**
- Organizations must transition all Conditional Access policies using only "Require Approved Client App" grant to use "Require Approved Client App OR Application Protection Policy"

#### Common Policy Examples

**Example 1: Require MFA for All Users**
```
Name: Require MFA for all users
Assignments:
  Users: All users
  Exclude: Emergency access accounts
  Cloud apps: All cloud apps
Conditions: None
Grant: Require multifactor authentication
State: On
```

**Example 2: Require Compliant Device for Admins**
```
Name: Require compliant device for admin access
Assignments:
  Users: Directory role = Global Administrator
  Cloud apps: Microsoft Admin portals
Conditions:
  Device platforms: All
Grant: Require device to be marked as compliant
State: On
```

**Example 3: Block Legacy Authentication**
```
Name: Block legacy authentication
Assignments:
  Users: All users
  Exclude: Service accounts
  Cloud apps: All cloud apps
Conditions:
  Client apps: Exchange ActiveSync clients, Other clients
Grant: Block access
State: On
```

**Example 4: Location-Based Access**
```
Name: Require MFA when outside corporate network
Assignments:
  Users: All users
  Cloud apps: All cloud apps
Conditions:
  Locations: Any location
  Exclude: Trusted named locations
Grant: Require multifactor authentication
State: On
```

#### PowerShell/CLI Management

```powershell
# Microsoft Graph PowerShell
Install-Module Microsoft.Graph.Identity.SignIns

Connect-MgGraph -Scopes "Policy.Read.All", "Policy.ReadWrite.ConditionalAccess"

# List all Conditional Access policies
Get-MgIdentityConditionalAccessPolicy | Select-Object DisplayName, State

# Get specific policy details
Get-MgIdentityConditionalAccessPolicy -ConditionalAccessPolicyId <policy-id>

# Create a policy (simplified example)
$params = @{
    DisplayName = "Require MFA for admins"
    State = "enabledForReportingButNotEnforced"  # Report-only mode first!
    Conditions = @{
        Users = @{
            IncludeRoles = @("62e90394-69f5-4237-9190-012177145e10")  # Global Admin
        }
        Applications = @{
            IncludeApplications = @("All")
        }
    }
    GrantControls = @{
        Operator = "OR"
        BuiltInControls = @("mfa")
    }
}
New-MgIdentityConditionalAccessPolicy -BodyParameter $params

# Delete a policy
Remove-MgIdentityConditionalAccessPolicy -ConditionalAccessPolicyId <policy-id>
```

```bash
# Azure CLI (limited CA support, use Graph API for full control)
az rest --method GET \
  --uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies"
```

#### Best Practices for 2026

1. **Coverage:** Ensure every app has at least one Conditional Access policy
2. **Report-Only Mode:** Always test policies in report-only mode first
3. **Emergency Access:** Exclude break-glass accounts from all policies
4. **Service Accounts:** Exclude service principals appropriately
5. **Policy Limit:** Maximum 195 policies per tenant (all states)
6. **Zero Trust:** Require MFA and compliant devices for privileged roles
7. **Legacy Auth:** Block all legacy authentication protocols
8. **Resilience:** Plan for authentication service disruptions
9. **All Resources:** Use "All cloud apps" to automatically cover new apps
10. **Documentation:** Maintain clear documentation of policy intent and exclusions

---

### 1.5 App Registrations and Service Principals

#### Key Concepts

**Application Registration:**
- The identity configuration for an application
- Defines how the app integrates with Microsoft Entra ID
- Created in Microsoft Entra ID
- Can be multi-tenant or single-tenant
- Defines permissions, redirect URIs, secrets/certificates

**Service Principal:**
- The local representation of an application in a specific tenant
- Automatically created when you register an app
- The app's identity in the tenant
- Can be assigned roles and permissions
- Represents the security identity for the application

**Relationship:** Application Registration = global definition; Service Principal = local instance

#### Creating App Registrations

**Via Azure Portal:**
1. Navigate to Microsoft Entra ID > App registrations
2. Click "New registration"
3. Provide name, supported account types, redirect URI
4. Configure API permissions
5. Create client secret or certificate

**Via PowerShell:**
```powershell
# Microsoft Graph PowerShell
Connect-MgGraph -Scopes "Application.ReadWrite.All"

# Create app registration
$app = New-MgApplication -DisplayName "MyApp" `
    -SignInAudience "AzureADMyOrg" `
    -Web @{ RedirectUris = @("https://myapp.example.com/auth") }

# Create service principal for the app
$sp = New-MgServicePrincipal -AppId $app.AppId

# Create a client secret (credential)
$passwordCred = @{
    DisplayName = "MyApp Secret"
    EndDateTime = (Get-Date).AddMonths(6)
}
$secret = Add-MgApplicationPassword -ApplicationId $app.Id -PasswordCredential $passwordCred

Write-Host "Application ID: $($app.AppId)"
Write-Host "Client Secret: $($secret.SecretText)"  # Save this - won't be shown again!
```

**Via Azure CLI:**
```bash
# Create app registration
az ad app create --display-name "MyApp"

# Create service principal
az ad sp create --id <app-id>

# Create client secret
az ad app credential reset --id <app-id> --append --years 1
```

#### API Permissions

**Microsoft Graph API Permissions:**

**Delegated Permissions:**
- Used when a user is present
- App acts on behalf of the user
- Permissions constrained by user's permissions
- Example: User.Read, Mail.Send

**Application Permissions:**
- Used for background services/daemons
- App acts as itself (no user context)
- Requires admin consent
- Example: User.Read.All, Mail.Send (all users)

**Granting Permissions:**
```powershell
# Add Microsoft Graph API permissions
$graphResourceId = "00000003-0000-0000-c000-000000000000"  # Microsoft Graph

# Delegated permission: User.Read
$delegatedPermission = @{
    ResourceAppId = $graphResourceId
    Scope = "User.Read Mail.Send"
}

# Application permission: User.Read.All
$appPermission = @{
    ResourceAppId = $graphResourceId
    AppRoleId = "df021288-bdef-4463-88db-98f22de89214"  # User.Read.All
}

# Update app registration
Update-MgApplication -ApplicationId $app.Id `
    -RequiredResourceAccess @{
        ResourceAppId = $graphResourceId
        ResourceAccess = @($delegatedPermission, $appPermission)
    }

# Grant admin consent for application permissions
# (Must be done via portal or with appropriate Graph API call)
```

#### Service Principal Management

```powershell
# List all service principals
Get-MgServicePrincipal | Select-Object DisplayName, AppId

# Find service principal by app ID
Get-MgServicePrincipal -Filter "appId eq '<app-id>'"

# Assign Azure RBAC role to service principal
New-AzRoleAssignment -ObjectId <service-principal-object-id> `
    -RoleDefinitionName "Contributor" `
    -Scope "/subscriptions/<subscription-id>/resourceGroups/<rg-name>"

# Delete service principal
Remove-MgServicePrincipal -ServicePrincipalId <object-id>
```

```bash
# Azure CLI
az ad sp list --display-name "MyApp"
az ad sp show --id <app-id>
az role assignment create --assignee <app-id> --role Contributor --scope <scope>
```

---

### 1.6 Managed Identities

#### Overview

Managed identities eliminate the need to manage credentials. Azure automatically handles the identity lifecycle and credential rotation. A service principal is created automatically but cannot be directly modified.

#### Types of Managed Identities

**System-Assigned Managed Identity:**
- Lifecycle tied to the Azure resource
- Created and deleted with the resource
- 1:1 relationship with the resource
- Use when identity is specific to a single resource

**User-Assigned Managed Identity:**
- Independent lifecycle (created separately)
- Can be shared across multiple resources
- Persists even if resources are deleted
- Use when multiple resources need the same identity

#### Enabling Managed Identities

**System-Assigned (Azure VM example):**
```bash
# Azure CLI
az vm identity assign --name MyVM --resource-group MyRG

# PowerShell
$vm = Get-AzVM -ResourceGroupName MyRG -Name MyVM
Update-AzVM -ResourceGroupName MyRG -VM $vm -IdentityType SystemAssigned
```

**User-Assigned:**
```bash
# Create user-assigned identity
az identity create --name MyIdentity --resource-group MyRG

# Assign to VM
az vm identity assign --name MyVM --resource-group MyRG \
  --identities /subscriptions/<sub-id>/resourcegroups/MyRG/providers/Microsoft.ManagedIdentity/userAssignedIdentities/MyIdentity
```

```powershell
# PowerShell
$identity = New-AzUserAssignedIdentity -ResourceGroupName MyRG -Name MyIdentity

$vm = Get-AzVM -ResourceGroupName MyRG -Name MyVM
Update-AzVM -ResourceGroupName MyRG -VM $vm `
    -IdentityType UserAssigned `
    -IdentityID $identity.Id
```

#### Using Managed Identities in Code

**Azure SDK (C# example):**
```csharp
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

// DefaultAzureCredential automatically uses managed identity when running in Azure
var credential = new DefaultAzureCredential();
var client = new SecretClient(new Uri("https://myvault.vault.azure.net/"), credential);

var secret = await client.GetSecretAsync("my-secret");
```

**REST API:**
```bash
# Get access token using managed identity
# From within Azure VM/App Service/Function/etc.
response=$(curl -H Metadata:true \
  "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/")

access_token=$(echo $response | jq -r .access_token)

# Use token to call Azure API
curl -H "Authorization: Bearer $access_token" \
  https://management.azure.com/subscriptions?api-version=2020-01-01
```

#### Granting Permissions

```bash
# Grant managed identity access to Key Vault
az keyvault set-policy --name MyVault \
  --object-id <managed-identity-principal-id> \
  --secret-permissions get list

# Grant Azure RBAC role
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Storage Blob Data Reader" \
  --scope /subscriptions/<sub-id>/resourceGroups/MyRG/providers/Microsoft.Storage/storageAccounts/mystorage
```

#### Managed Identity vs Service Principal Decision Guide

**Use Managed Identity When:**
- Application/service runs within Azure (VM, App Service, Function, Container Instances, AKS)
- Want zero credential management
- Single or shared identity across Azure resources
- Automatic credential rotation needed

**Use Service Principal When:**
- Application runs outside Azure (on-premises, other clouds)
- Need more granular control over credentials and lifecycle
- Automating tasks via scripts/CI-CD from external systems
- Integrating with third-party services
- Need multiple credentials per identity (for rotation strategies)

---

### 1.7 Azure AD B2B and B2C (External Identities)

#### Important 2026 Changes

**Azure AD B2C Deprecation:**
- Azure AD B2C no longer available for **new customers** as of May 1, 2025
- Azure AD B2C P2 will be **discontinued March 15, 2026** for all customers
- Migration path to **Microsoft Entra External ID** (next-generation CIAM)

#### Azure AD B2B Collaboration

**Purpose:** Partner/supplier organization collaboration

**Use Cases:**
- External consultants accessing internal resources
- Partner organization collaboration on projects
- Supplier access to procurement systems
- Cross-organization team collaboration

**Key Features:**
- Guest users managed in the same directory as employees
- Can be added to same groups as internal users
- Access to internal resources (SharePoint, Teams, apps)
- Guest user lifecycle management
- Identity provider agnostic (any email, social accounts)

**Out-of-Box Identity Providers:**
- Microsoft accounts
- Google accounts
- Facebook accounts
- Other Azure AD tenants
- Any email (one-time passcode)

**Inviting B2B Users:**
```powershell
# Microsoft Graph PowerShell
New-MgInvitation -InvitedUserEmailAddress "partner@example.com" `
    -InviteRedirectUrl "https://myapp.contoso.com" `
    -SendInvitationMessage:$true
```

```bash
# Azure CLI
az ad user create --display-name "Partner User" \
  --user-principal-name "partner_example.com#EXT#@contoso.onmicrosoft.com" \
  --mail-nickname "partner"
```

#### Azure AD B2C (Legacy - Being Replaced)

**Purpose:** Consumer-facing applications (commerce, customer portals)

**Use Cases:**
- E-commerce websites
- Mobile apps for customers
- Self-service customer portals
- Consumer-facing web applications

**Key Features:**
- Separate B2C directory (isolated from internal users)
- Social and local account sign-in
- Custom branding and user journeys
- Identity Experience Framework (custom policies)
- Millions of users, billions of authentications

**Out-of-Box Identity Providers:**
- Microsoft accounts
- Amazon
- Facebook
- Google
- LinkedIn
- Twitter
- Local accounts (email/username + password)

#### Microsoft Entra External ID (Next Generation)

**Overview:** Unified platform combining B2B collaboration and CIAM (Customer Identity Access Management) use cases.

**Key Advantages:**
- Single platform for both B2B and customer scenarios
- Modern authentication flows
- Better integration with Microsoft Entra features
- Enhanced security capabilities
- Unified administration

**Migration Timeline:**
- New B2C customers: Must use External ID (as of May 1, 2025)
- Existing B2C P2 customers: Migrate by March 15, 2026
- Existing B2C Standard customers: Continue with guidance to migrate

#### Security Best Practices

**B2B Security:**
1. **Restrict guest invitations** to specific admin roles only
2. **Review guest access** regularly via Access Reviews
3. **Apply Conditional Access** policies to guest users
4. **Use entitlement management** for structured access
5. **Limit guest user permissions** via external collaboration settings
6. **Enable MFA** for guest users
7. **Monitor guest activity** via audit logs

**B2C/External ID Security:**
1. **Enable MFA** for sensitive operations
2. **Implement risk-based access** (Identity Protection)
3. **Use custom domains** (not .b2clogin.com)
4. **Validate email addresses** during sign-up
5. **Implement rate limiting** (DDoS protection)
6. **Monitor for unusual patterns** (bulk signups, account takeovers)
7. **Regular security reviews** of custom policies

---

### 1.8 Microsoft Graph API for Identity Operations

#### Overview

Microsoft Graph is the unified REST API for accessing Microsoft 365, Windows, and Enterprise Mobility + Security data. It replaces the legacy Azure AD Graph API (deprecated).

**Endpoint:** `https://graph.microsoft.com`

#### Authentication

**OAuth 2.0 Flow:**
```bash
# Client credentials flow (application permissions)
curl -X POST https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=<app-id>" \
  -d "client_secret=<secret>" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "grant_type=client_credentials"
```

**PowerShell Authentication:**
```powershell
# Interactive (delegated permissions)
Connect-MgGraph -Scopes "User.Read.All", "Group.ReadWrite.All"

# Application (client credentials)
$clientId = "<app-id>"
$tenantId = "<tenant-id>"
$clientSecret = "<secret>" | ConvertTo-SecureString -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($clientId, $clientSecret)

Connect-MgGraph -TenantId $tenantId -ClientSecretCredential $credential
```

#### Important 2026 Update: MFA Requirement

**Effective Date:** January 26, 2026

**Change:** Users managing their own authentication methods (phone numbers, email addresses) through Microsoft Graph API must complete MFA if they last authenticated more than 10 minutes ago.

**Impact:** Self-service operations require recent MFA, improving security for sensitive identity operations.

#### Common User Operations

**List Users:**
```bash
# REST API
curl -X GET "https://graph.microsoft.com/v1.0/users" \
  -H "Authorization: Bearer <token>"

# With filter
curl -X GET "https://graph.microsoft.com/v1.0/users?\$filter=startswith(displayName,'John')" \
  -H "Authorization: Bearer <token>"
```

```powershell
# PowerShell
Get-MgUser
Get-MgUser -Filter "startswith(displayName,'John')"
Get-MgUser -UserId "user@contoso.com"
```

**Create User:**
```powershell
$passwordProfile = @{
    ForceChangePasswordNextSignIn = $true
    Password = "T3mp@P@ssw0rd!"
}

New-MgUser -DisplayName "John Doe" `
    -UserPrincipalName "john.doe@contoso.com" `
    -AccountEnabled:$true `
    -MailNickname "johndoe" `
    -PasswordProfile $passwordProfile
```

**Update User:**
```powershell
Update-MgUser -UserId "john.doe@contoso.com" `
    -Department "Engineering" `
    -JobTitle "Senior Engineer"
```

**Delete User:**
```powershell
Remove-MgUser -UserId "john.doe@contoso.com"
```

#### Common Group Operations

**List Groups:**
```powershell
Get-MgGroup
Get-MgGroup -Filter "displayName eq 'Engineering'"
```

**Create Group:**
```powershell
$group = New-MgGroup -DisplayName "Engineering Team" `
    -MailNickname "engineering" `
    -MailEnabled:$false `
    -SecurityEnabled:$true `
    -Description "Engineering department group"
```

**Add Members:**
```powershell
$user = Get-MgUser -UserId "john.doe@contoso.com"
New-MgGroupMember -GroupId $group.Id -DirectoryObjectId $user.Id
```

**List Group Members:**
```powershell
Get-MgGroupMember -GroupId $group.Id
```

**Remove Member:**
```powershell
Remove-MgGroupMemberByRef -GroupId $group.Id -DirectoryObjectId $user.Id
```

#### Directory Role Operations

**List Available Roles:**
```powershell
Get-MgDirectoryRole
Get-MgDirectoryRoleTemplate  # All available role templates
```

**Assign Role:**
```powershell
# Activate role if not already active
$roleTemplate = Get-MgDirectoryRoleTemplate -Filter "displayName eq 'User Administrator'"
$role = Get-MgDirectoryRole -Filter "roleTemplateId eq '$($roleTemplate.Id)'"

if (-not $role) {
    $role = New-MgDirectoryRole -RoleTemplateId $roleTemplate.Id
}

# Add user to role
$user = Get-MgUser -UserId "admin@contoso.com"
New-MgDirectoryRoleMemberByRef -DirectoryRoleId $role.Id `
    -OdataId "https://graph.microsoft.com/v1.0/users/$($user.Id)"
```

#### Application and Service Principal Operations

**List Applications:**
```powershell
Get-MgApplication
Get-MgServicePrincipal
```

**Create App Registration:**
```powershell
$app = New-MgApplication -DisplayName "MyGraphApp" `
    -SignInAudience "AzureADMyOrg"
```

**Add API Permissions:**
```powershell
$graphSp = Get-MgServicePrincipal -Filter "displayName eq 'Microsoft Graph'"

$permission = $graphSp.AppRoles | Where-Object { $_.Value -eq "User.Read.All" }

Update-MgApplication -ApplicationId $app.Id `
    -RequiredResourceAccess @{
        ResourceAppId = "00000003-0000-0000-c000-000000000000"
        ResourceAccess = @(
            @{
                Id = $permission.Id
                Type = "Role"
            }
        )
    }
```

#### 2026 Feature: JIT User Migration

**New Authentication Event Resources:**

**Purpose:** Support Just-In-Time user migration from legacy authentication systems

**Components:**
- `onPasswordSubmitListener` - Triggers during password submission
- `onPasswordSubmitCustomExtension` - Validates passwords against external legacy systems

**Use Case:** Gradually migrate users from legacy identity systems to Entra ID without requiring bulk password resets.

#### Rate Limits and Throttling

**Service Protection Limits:**
- User-level throttling: 2,000 requests per minute per user
- Application-level throttling: 150,000 requests per minute per tenant
- Specific endpoint limits vary (e.g., group creation: 20/min)

**Best Practices:**
- Implement exponential backoff on 429 responses
- Use batching for multiple operations
- Request only needed properties with `$select`
- Use delta queries for change tracking
- Cache data when appropriate

**Retry-After Header:**
```bash
# Response includes Retry-After header on 429 status
HTTP/1.1 429 Too Many Requests
Retry-After: 120
```

---

### 1.9 CLI and PowerShell Command Reference

#### Module Migration Status (2026)

**DEPRECATED Modules:**
- ❌ Azure AD PowerShell (`AzureAD`)
- ❌ Azure AD Preview (`AzureADPreview`)
- ❌ MSOnline
- ❌ Azure AD Graph API

**CURRENT Modules:**
- ✅ Microsoft Graph PowerShell (`Microsoft.Graph`)
- ⚠️ Azure CLI (`az ad`) - Uses Azure AD Graph, limited functionality

#### Microsoft Graph PowerShell Installation

```powershell
# Install (recommended approach)
Install-Module Microsoft.Graph -Scope CurrentUser

# Install specific sub-modules
Install-Module Microsoft.Graph.Users
Install-Module Microsoft.Graph.Groups
Install-Module Microsoft.Graph.Identity.SignIns
Install-Module Microsoft.Graph.Identity.Governance

# Check installed version
Get-Module Microsoft.Graph -ListAvailable

# Update to latest
Update-Module Microsoft.Graph
```

#### Azure CLI Installation

```bash
# Linux (Ubuntu/Debian)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# macOS
brew update && brew install azure-cli

# Windows (PowerShell)
Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi
Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'

# Check version
az --version
```

#### Authentication

```powershell
# Microsoft Graph PowerShell - Interactive
Connect-MgGraph -Scopes "User.ReadWrite.All", "Group.ReadWrite.All"

# Check current context
Get-MgContext

# Disconnect
Disconnect-MgGraph
```

```bash
# Azure CLI - Interactive
az login

# Service principal
az login --service-principal \
  --username <app-id> \
  --password <password-or-cert> \
  --tenant <tenant-id>

# Check current account
az account show
```

#### Migration Examples: AzureAD → Microsoft.Graph

```powershell
# OLD: AzureAD module
Connect-AzureAD
Get-AzureADUser -ObjectId "user@contoso.com"
New-AzureADGroup -DisplayName "Test" -MailEnabled $false -SecurityEnabled $true -MailNickName "Test"

# NEW: Microsoft.Graph module
Connect-MgGraph
Get-MgUser -UserId "user@contoso.com"
New-MgGroup -DisplayName "Test" -MailEnabled:$false -SecurityEnabled:$true -MailNickname "Test"
```

**Cmdlet Mapping Reference:**
| AzureAD | Microsoft.Graph |
|---------|----------------|
| `Get-AzureADUser` | `Get-MgUser` |
| `New-AzureADUser` | `New-MgUser` |
| `Set-AzureADUser` | `Update-MgUser` |
| `Remove-AzureADUser` | `Remove-MgUser` |
| `Get-AzureADGroup` | `Get-MgGroup` |
| `New-AzureADGroup` | `New-MgGroup` |
| `Add-AzureADGroupMember` | `New-MgGroupMember` |
| `Get-AzureADGroupMember` | `Get-MgGroupMember` |
| `Get-AzureADApplication` | `Get-MgApplication` |
| `Get-AzureADServicePrincipal` | `Get-MgServicePrincipal` |

#### Common PowerShell Patterns

**Bulk User Operations:**
```powershell
# Import users from CSV
$users = Import-Csv "C:\users.csv"

foreach ($user in $users) {
    $passwordProfile = @{
        ForceChangePasswordNextSignIn = $true
        Password = $user.InitialPassword
    }

    New-MgUser -DisplayName $user.DisplayName `
        -UserPrincipalName $user.UserPrincipalName `
        -AccountEnabled:$true `
        -MailNickname $user.MailNickname `
        -Department $user.Department `
        -JobTitle $user.JobTitle `
        -PasswordProfile $passwordProfile
}
```

**Bulk Group Membership:**
```powershell
# Add all users from one group to another
$sourceGroup = Get-MgGroup -Filter "displayName eq 'Source Group'"
$targetGroup = Get-MgGroup -Filter "displayName eq 'Target Group'"

$members = Get-MgGroupMember -GroupId $sourceGroup.Id

foreach ($member in $members) {
    New-MgGroupMember -GroupId $targetGroup.Id -DirectoryObjectId $member.Id
    Write-Host "Added $($member.Id) to target group"
}
```

**Export Directory Data:**
```powershell
# Export all users with selected properties
Get-MgUser -All |
    Select-Object DisplayName, UserPrincipalName, Department, JobTitle, AccountEnabled |
    Export-Csv "C:\users-export.csv" -NoTypeInformation

# Export group memberships
$groups = Get-MgGroup -All
$report = @()

foreach ($group in $groups) {
    $members = Get-MgGroupMember -GroupId $group.Id
    foreach ($member in $members) {
        $report += [PSCustomObject]@{
            GroupName = $group.DisplayName
            GroupId = $group.Id
            MemberId = $member.Id
            MemberType = $member.AdditionalProperties.'@odata.type'
        }
    }
}

$report | Export-Csv "C:\group-memberships.csv" -NoTypeInformation
```

#### Azure CLI Examples

```bash
# User operations
az ad user list
az ad user show --id "user@contoso.com"
az ad user create --display-name "John Doe" \
  --password "T3mp@P@ss!" \
  --user-principal-name "john.doe@contoso.com" \
  --force-change-password-next-sign-in true

az ad user update --id "john.doe@contoso.com" \
  --set department="Engineering"

az ad user delete --id "john.doe@contoso.com"

# Group operations
az ad group list
az ad group show --group "Engineering"
az ad group create --display-name "Engineering" \
  --mail-nickname "engineering"

az ad group member add --group "Engineering" \
  --member-id <user-object-id>

az ad group member list --group "Engineering"

# App registration operations
az ad app list
az ad app create --display-name "MyApp"
az ad app show --id <app-id>
az ad app delete --id <app-id>

# Service principal operations
az ad sp list
az ad sp create --id <app-id>
az ad sp show --id <app-id>
az ad sp delete --id <app-id>

# Credential operations
az ad app credential reset --id <app-id> --years 1
az ad sp credential reset --id <app-id>
```

---

## Part 2: Identity Governance

### 2.1 Identity Lifecycle Management (JML Process)

#### Overview

The Joiner-Mover-Leaver (JML) lifecycle defines how identities are created, updated, and removed as people join, change roles, or leave an organization. It's the backbone of Identity Governance and Administration (IGA).

#### The Three Phases

**1. Joiner (Onboarding)**

User joins the organization and receives initial access.

**Key Activities:**
- Create identity in directory
- Assign to appropriate groups
- Provision access to applications
- Assign licenses (Microsoft 365, etc.)
- Enroll devices
- Complete compliance training
- Set up MFA

**Automation Goals:**
- Day-1 access (immediate productivity)
- Zero manual provisioning tickets
- Automatic license assignment
- Role-based access provisioning
- Welcome workflows

**Implementation Examples:**

*Lifecycle Workflows (Microsoft Entra):*
```
Trigger: New user created in HR system
Workflow:
  1. Create user in Entra ID
  2. Assign to department group
  3. Assign M365 E5 license
  4. Add to department Teams
  5. Provision SharePoint access
  6. Send welcome email
  7. Schedule MFA enrollment reminder (Day 3)
  8. Assign training modules
```

*PowerShell Automation:*
```powershell
function New-JoinerIdentity {
    param(
        [string]$FirstName,
        [string]$LastName,
        [string]$Department,
        [string]$JobTitle,
        [string]$ManagerUPN
    )

    $upn = "$FirstName.$LastName@contoso.com".ToLower()

    # Create user
    $passwordProfile = @{
        ForceChangePasswordNextSignIn = $true
        Password = "T3mp@P@ssw0rd!" + (Get-Random -Maximum 9999)
    }

    $user = New-MgUser -DisplayName "$FirstName $LastName" `
        -UserPrincipalName $upn `
        -AccountEnabled:$true `
        -MailNickname "$FirstName$LastName" `
        -Department $Department `
        -JobTitle $JobTitle `
        -PasswordProfile $passwordProfile

    # Assign to department group
    $deptGroup = Get-MgGroup -Filter "displayName eq 'Department-$Department'"
    New-MgGroupMember -GroupId $deptGroup.Id -DirectoryObjectId $user.Id

    # Assign license
    $license = @{
        AddLicenses = @(
            @{
                SkuId = "c7df2760-2c81-4ef7-b578-5b5392b571df"  # M365 E5
            }
        )
        RemoveLicenses = @()
    }
    Set-MgUserLicense -UserId $user.Id -BodyParameter $license

    # Set manager
    $manager = Get-MgUser -Filter "userPrincipalName eq '$ManagerUPN'"
    Set-MgUserManagerByRef -UserId $user.Id `
        -OdataId "https://graph.microsoft.com/v1.0/users/$($manager.Id)"

    Write-Host "Created user: $upn"
}
```

**2. Mover (Role Changes)**

User's role, department, or responsibilities change, triggering access updates.

**Triggers:**
- Department transfer
- Promotion/demotion
- Role change
- Location change
- Project assignment changes

**Key Activities:**
- Update attributes (department, title, manager)
- Add new group memberships
- Remove old group memberships
- Re-provision application access
- Adjust license assignments
- Update device policies

**Automation Goals:**
- Same-day access changes
- Automatic removal of old access
- No orphaned permissions
- Audit trail of changes
- Manager approval workflows

**Implementation Example:**

*Access Package Reassignment:*
```
Trigger: HR system updates user department
Workflow:
  1. Remove from old department groups
  2. Add to new department groups
  3. Revoke old department app access
  4. Request new department access packages
  5. Update manager relationship
  6. Update SharePoint permissions
  7. Notify new and old managers
  8. Schedule access review (30 days)
```

*PowerShell Automation:*
```powershell
function Update-MoverIdentity {
    param(
        [string]$UserUPN,
        [string]$NewDepartment,
        [string]$NewJobTitle,
        [string]$NewManagerUPN
    )

    $user = Get-MgUser -Filter "userPrincipalName eq '$UserUPN'"

    # Get current department
    $oldDepartment = $user.Department

    # Update user attributes
    Update-MgUser -UserId $user.Id `
        -Department $NewDepartment `
        -JobTitle $NewJobTitle

    # Update manager
    $newManager = Get-MgUser -Filter "userPrincipalName eq '$NewManagerUPN'"
    Set-MgUserManagerByRef -UserId $user.Id `
        -OdataId "https://graph.microsoft.com/v1.0/users/$($newManager.Id)"

    # Remove from old department group
    if ($oldDepartment) {
        $oldGroup = Get-MgGroup -Filter "displayName eq 'Department-$oldDepartment'"
        Remove-MgGroupMemberByRef -GroupId $oldGroup.Id -DirectoryObjectId $user.Id
    }

    # Add to new department group
    $newGroup = Get-MgGroup -Filter "displayName eq 'Department-$NewDepartment'"
    New-MgGroupMember -GroupId $newGroup.Id -DirectoryObjectId $user.Id

    Write-Host "Updated mover: $UserUPN"
}
```

**3. Leaver (Offboarding)**

User exits and their access must be revoked.

**Key Activities:**
- Disable account immediately
- Revoke all access and licenses
- Remove from all groups
- Wipe corporate devices
- Backup user data (mailbox, OneDrive)
- Convert mailbox to shared (if needed)
- Delete account (after retention period)
- Revoke all refresh tokens and sessions

**Automation Goals:**
- Immediate access revocation (within minutes)
- Data preservation compliance
- Complete audit trail
- No lingering access
- Automated device wipe

**Security Requirements:**
- Same-day termination access removal
- Emergency termination process (high-risk departures)
- Litigation hold capabilities
- Credential revocation
- Physical access revocation coordination

**Implementation Example:**

*Lifecycle Workflow:*
```
Trigger: HR system marks employee as terminated
Workflow:
  1. Disable user account (immediate)
  2. Revoke all refresh tokens
  3. Sign out all sessions
  4. Remove from all groups
  5. Revoke all licenses (except mailbox)
  6. Convert mailbox to shared (if manager requests)
  7. Backup OneDrive to SharePoint
  8. Wipe enrolled devices
  9. Schedule account deletion (90 days)
  10. Notify manager and IT security
```

*PowerShell Automation:*
```powershell
function Invoke-LeaverProcess {
    param(
        [string]$UserUPN,
        [string]$ManagerUPN,
        [bool]$ConvertMailbox = $false
    )

    $user = Get-MgUser -Filter "userPrincipalName eq '$UserUPN'"

    # Disable account
    Update-MgUser -UserId $user.Id -AccountEnabled:$false

    # Revoke sign-in sessions
    Revoke-MgUserSignInSession -UserId $user.Id

    # Remove from all groups
    $groups = Get-MgUserMemberOf -UserId $user.Id
    foreach ($group in $groups) {
        if ($group.AdditionalProperties.'@odata.type' -eq '#microsoft.graph.group') {
            Remove-MgGroupMemberByRef -GroupId $group.Id -DirectoryObjectId $user.Id
        }
    }

    # Remove licenses (preserve Exchange for mailbox conversion)
    $licenses = Get-MgUserLicenseDetail -UserId $user.Id
    $licensesToRemove = $licenses | Where-Object {
        $_.SkuPartNumber -notlike "*EXCHANGE*"
    } | Select-Object -ExpandProperty SkuId

    if ($licensesToRemove) {
        Set-MgUserLicense -UserId $user.Id -AddLicenses @() -RemoveLicenses $licensesToRemove
    }

    # Set manager as delegate for mailbox (if converting)
    if ($ConvertMailbox) {
        # This requires Exchange Online PowerShell
        # Add-MailboxPermission -Identity $UserUPN -User $ManagerUPN -AccessRights FullAccess
    }

    # Schedule deletion (implement with Azure Automation or Logic Apps)
    Write-Host "Leaver process completed for: $UserUPN"
    Write-Host "Account scheduled for deletion in 90 days"
}
```

#### Automation Technologies

**Microsoft Entra Lifecycle Workflows:**
- Cloud-based workflow automation
- Pre-built templates for joiner/mover/leaver
- Integration with HR systems (Workday, SuccessFactors, etc.)
- Scheduled tasks and approval workflows
- Available in Microsoft Entra ID Governance (Premium P2 + Governance)

**HR-Driven Provisioning:**
- Direct integration with HR systems
- Attribute mapping (HR → Entra ID)
- Automatic user creation from HR records
- Real-time or scheduled synchronization

**Third-Party IGA Solutions:**
- SailPoint IdentityIQ/IdentityNow
- Saviynt
- Omada
- One Identity Manager
- IBM Security Identity Governance

#### Best Practices

1. **Single Source of Truth:** HR system should be authoritative
2. **Automation First:** Minimize manual provisioning
3. **Immediate Revocation:** Leaver access removed within minutes
4. **Audit Everything:** Complete trail for compliance
5. **Manager Involvement:** Attestation for mover/leaver events
6. **Data Retention:** Comply with legal/regulatory requirements
7. **Testing:** Test workflows in non-production first
8. **Exception Handling:** Process for edge cases (contractors, mergers, etc.)
9. **Monitoring:** Alert on failed provisioning/deprovisioning
10. **Regular Reviews:** Quarterly review of automation effectiveness

---

### 2.2 Access Reviews and Attestation

#### Overview

Access reviews (also called access attestation or recertification) ensure users maintain only the access they need. Reviewers periodically confirm whether users still require their current access.

#### When to Use Access Reviews

**Common Scenarios:**
- Guest user access review (every 6-12 months)
- Privileged role membership review (quarterly)
- Application access review (annually)
- Group membership review (semi-annually)
- Access package assignment review (annually)
- Dynamic group review (validate rule accuracy)

**Compliance Drivers:**
- SOX: Segregation of duties, periodic recertification
- HIPAA: Minimum necessary access validation
- GDPR: Data access minimization
- ISO 27001: Access rights review requirements
- PCI DSS: Quarterly user access reviews

#### Creating Access Reviews

**Via Microsoft Entra Portal:**
1. Navigate to Identity Governance > Access reviews
2. Click "New access review"
3. Configure scope (groups, apps, Azure roles, Entra roles)
4. Set reviewers (managers, resource owners, self-review)
5. Set frequency (one-time, quarterly, annually, etc.)
6. Configure advanced settings (default decisions, recommendations)

**Via PowerShell:**
```powershell
# Note: Access review management via Graph API requires beta endpoint
# Install beta module if needed
Install-Module Microsoft.Graph.Beta.Identity.Governance

Connect-MgGraph -Scopes "AccessReview.ReadWrite.All"

# Create access review for a group
$params = @{
    DisplayName = "Quarterly review of Engineering group"
    DescriptionForAdmins = "Review engineering team membership"
    DescriptionForReviewers = "Please confirm each user still requires access"
    Scope = @{
        "@odata.type" = "#microsoft.graph.accessReviewQueryScope"
        Query = "/groups/<group-id>/members"
        QueryType = "MicrosoftGraph"
    }
    Reviewers = @(
        @{
            Query = "/users/<manager-id>"
            QueryType = "MicrosoftGraph"
        }
    )
    Settings = @{
        MailNotificationsEnabled = $true
        ReminderNotificationsEnabled = $true
        DefaultDecisionEnabled = $false
        AutoApplyDecisionsEnabled = $true
        RecommendationsEnabled = $true
        InstanceDurationInDays = 14
        Recurrence = @{
            Pattern = @{
                Type = "absoluteMonthly"
                Interval = 3
            }
            Range = @{
                Type = "noEnd"
                StartDate = (Get-Date).ToString("yyyy-MM-dd")
            }
        }
    }
}

New-MgBetaIdentityGovernanceAccessReviewDefinition -BodyParameter $params
```

#### Reviewer Options

**Self Review:**
- Users attest to their own access needs
- Least secure option (self-interest bias)
- Use only for low-risk resources

**Manager Review:**
- User's direct manager reviews access
- Good for general group memberships
- Managers closest to understanding user needs

**Resource Owner Review:**
- Application/resource owner reviews access
- Best for application-specific access
- Owners understand who needs what

**Specific Reviewers:**
- Designated individuals (security team, compliance team)
- Good for highly sensitive resources
- Ensures expert review

**Fallback Reviewers:**
- If primary reviewer doesn't respond
- Escalation path for review completion

#### Access Review Settings

**Duration:** 1-4 weeks typical (14 days recommended)

**Frequency:**
- Guest users: Every 6-12 months
- Privileged roles: Quarterly (90 days)
- Sensitive apps: Semi-annually
- General groups: Annually
- Access packages: At assignment expiration

**Auto-Apply Decisions:**
- Automatically remove access after review completes
- Recommended for automated governance
- Reduces admin overhead

**Default Decision:**
- Action taken if reviewer doesn't respond
- Options: Approve, Deny, No change, Use recommendations
- Consider risk tolerance and reviewer engagement

**Recommendations:**
- ML-based suggestions for reviewers
- Based on usage patterns (last sign-in, usage frequency)
- Improves review accuracy and speed

**Helper Information:**
- Last sign-in date (very useful)
- Group membership details
- Access package assignment reason

#### Access Review for Entitlement Management

**Access Package Reviews:**
```
Configuration:
  - Review frequency: At time of assignment expiration
  - Reviewers: Manager of requestor
  - Duration: 14 days
  - Auto-apply: Enabled
  - Default decision: Deny (if no response)

Benefits:
  - Ensures access packages aren't auto-renewed without validation
  - Manager explicitly re-approves continued access
  - Automatic cleanup of unnecessary access
```

**Implementation:**
1. Navigate to Entitlement management > Access packages
2. Select access package > Policies
3. Edit policy > Enable access reviews
4. Configure review settings
5. Save policy

#### Guest User Access Reviews

**Best Practice Configuration:**
```
Name: Guest User Access Review
Scope: All guest users in directory
Reviewers: Resource owners (group owners, app owners)
Frequency: Every 6 months
Duration: 21 days
Auto-apply: Enabled
Default decision: Remove access
Recommendations: Enabled (show last sign-in)

Helper settings:
- Show last sign-in date: Yes
- Show access usage: Yes
- Require reviewer justification: Yes
```

**Automation Example:**
```powershell
# Find stale guest users (no sign-in in 90 days)
$guestUsers = Get-MgUser -Filter "userType eq 'Guest'" -All

foreach ($guest in $guestUsers) {
    $signIns = Get-MgAuditLogSignIn -Filter "userId eq '$($guest.Id)'" `
        -Top 1 -OrderBy "createdDateTime desc"

    if ($signIns) {
        $lastSignIn = [DateTime]$signIns.CreatedDateTime
        $daysSinceSignIn = (Get-Date) - $lastSignIn

        if ($daysSinceSignIn.Days -gt 90) {
            Write-Host "Stale guest: $($guest.UserPrincipalName) - Last sign-in: $lastSignIn"
            # Option: Remove automatically or flag for review
        }
    } else {
        Write-Host "Guest never signed in: $($guest.UserPrincipalName)"
    }
}
```

#### Monitoring and Reporting

**View Access Review Results:**
```powershell
# List all access review schedules
Get-MgBetaIdentityGovernanceAccessReviewDefinition

# Get specific review results
$reviewId = "<review-definition-id>"
$instances = Get-MgBetaIdentityGovernanceAccessReviewDefinitionInstance -AccessReviewScheduleDefinitionId $reviewId

foreach ($instance in $instances) {
    $decisions = Get-MgBetaIdentityGovernanceAccessReviewDefinitionInstanceDecision `
        -AccessReviewScheduleDefinitionId $reviewId `
        -AccessReviewInstanceId $instance.Id

    $decisions | Select-Object ReviewedBy, Decision, Justification
}
```

**Export for Compliance:**
```powershell
# Export all access review decisions for audit
$allReviews = Get-MgBetaIdentityGovernanceAccessReviewDefinition -All

$report = @()
foreach ($review in $allReviews) {
    $instances = Get-MgBetaIdentityGovernanceAccessReviewDefinitionInstance `
        -AccessReviewScheduleDefinitionId $review.Id

    foreach ($instance in $instances) {
        $decisions = Get-MgBetaIdentityGovernanceAccessReviewDefinitionInstanceDecision `
            -AccessReviewScheduleDefinitionId $review.Id `
            -AccessReviewInstanceId $instance.Id

        foreach ($decision in $decisions) {
            $report += [PSCustomObject]@{
                ReviewName = $review.DisplayName
                InstanceStartDate = $instance.StartDateTime
                PrincipalUPN = $decision.Principal.UserPrincipalName
                ResourceName = $decision.Resource.DisplayName
                ReviewerUPN = $decision.ReviewedBy.UserPrincipalName
                Decision = $decision.Decision
                Justification = $decision.Justification
                AppliedDateTime = $decision.AppliedDateTime
            }
        }
    }
}

$report | Export-Csv "AccessReviewCompliance_$(Get-Date -Format 'yyyyMMdd').csv" -NoTypeInformation
```

#### Best Practices

1. **Start with high-risk access** (privileged roles, sensitive apps, guest users)
2. **Enable recommendations** to improve reviewer efficiency
3. **Auto-apply decisions** to reduce administrative overhead
4. **Set realistic durations** (14-21 days typical)
5. **Configure fallback reviewers** to ensure completion
6. **Provide context** to reviewers (last sign-in, usage data)
7. **Require justification** for sensitive resources
8. **Monitor completion rates** and send reminders
9. **Document review criteria** for consistency
10. **Review the reviewers** - ensure appropriate reviewer assignment

---

### 2.3 Entitlement Management and Access Packages

#### Overview

Entitlement management in Microsoft Entra ID Governance provides automated access request, approval, assignment, and lifecycle management through **access packages**. Access packages bundle resources that users need to perform their jobs or projects.

#### Key Concepts

**Access Package:**
- Collection of resources with policies for access
- One-time setup for recurring access scenarios
- Resources can include: Groups, Teams, Applications, SharePoint sites, Entra roles

**Catalog:**
- Container for related access packages and resources
- Organizational boundary
- Delegation unit (catalog owners manage packages within)

**Policy:**
- Rules for requesting, approving, and maintaining access
- Multiple policies per access package (different user populations)
- Defines: Who can request, approval requirements, assignment duration, access reviews

**Resource Roles:**
- Specific role within a resource (e.g., Member of group, Owner of team)
- Fine-grained access control

#### Creating Access Packages

**Example: Marketing Campaign Access Package**

**Resources:**
- Marketing group (member role)
- Marketing SharePoint site (member role)
- Marketing Teams (team member role)
- Marketing application (user role)

**Policy:**
- Requestors: Internal users
- Approval: Manager approval required
- Assignment duration: 30 days
- Access review: Monthly

**Via Portal:**
1. Navigate to Identity Governance > Entitlement management
2. Create catalog (or use General)
3. Add resources to catalog
4. Create new access package
5. Add resources and roles
6. Create policy with approval and lifecycle settings

**Via PowerShell (Microsoft Graph):**
```powershell
Connect-MgGraph -Scopes "EntitlementManagement.ReadWrite.All"

# Create catalog (if needed)
$catalog = New-MgEntitlementManagementCatalog -DisplayName "Marketing Campaigns" `
    -Description "Resources for marketing campaigns" `
    -IsExternallyVisible:$true

# Add resources to catalog (group example)
$group = Get-MgGroup -Filter "displayName eq 'Marketing Team'"

$resourceParams = @{
    CatalogId = $catalog.Id
    RequestType = "adminAdd"
    Resource = @{
        OriginId = $group.Id
        OriginSystem = "AadGroup"
    }
}
New-MgEntitlementManagementResourceRequest -BodyParameter $resourceParams

# Wait for resource to be added (async operation)
Start-Sleep -Seconds 10

# Get the catalog resource
$catalogResource = Get-MgEntitlementManagementCatalogResource -AccessPackageCatalogId $catalog.Id `
    -Filter "originId eq '$($group.Id)'"

# Get resource roles (e.g., Member, Owner)
$resourceRoles = Get-MgEntitlementManagementCatalogResourceRole `
    -AccessPackageCatalogId $catalog.Id `
    -Filter "originSystem eq 'AadGroup' and resource/id eq '$($catalogResource.Id)'"

$memberRole = $resourceRoles | Where-Object { $_.DisplayName -eq "Member" }

# Create access package
$accessPackage = New-MgEntitlementManagementAccessPackage -CatalogId $catalog.Id `
    -DisplayName "Marketing Campaign Access" `
    -Description "Access for marketing campaign team members"

# Add resource role to access package
$resourceRoleScope = @{
    Role = @{
        Id = $memberRole.Id
        OriginId = $memberRole.OriginId
        OriginSystem = $memberRole.OriginSystem
    }
    Scope = @{
        Id = $catalogResource.Id
        OriginId = $catalogResource.OriginId
        OriginSystem = $catalogResource.OriginSystem
    }
}

New-MgEntitlementManagementAccessPackageResourceRoleScope `
    -AccessPackageId $accessPackage.Id `
    -BodyParameter $resourceRoleScope

# Create assignment policy
$policyParams = @{
    AccessPackageId = $accessPackage.Id
    DisplayName = "Internal users with manager approval"
    Description = "Policy for internal employees"
    AllowedTargetScope = "specificDirectoryUsers"
    SpecificAllowedTargets = @(
        @{
            "@odata.type" = "#microsoft.graph.internalSponsors"
        }
    )
    Expiration = @{
        Type = "afterDuration"
        Duration = "P30D"  # 30 days
    }
    RequestorSettings = @{
        AllowCustomAssignmentSchedule = $false
        EnableTargetsToSelfAddAccess = $true
        EnableTargetsToSelfRemoveAccess = $false
    }
    RequestApprovalSettings = @{
        IsApprovalRequiredForAdd = $true
        IsApprovalRequiredForUpdate = $false
        Stages = @(
            @{
                DurationBeforeAutomaticDenial = "P7D"  # 7 days
                IsApproverJustificationRequired = $true
                IsEscalationEnabled = $false
                PrimaryApprovers = @(
                    @{
                        "@odata.type" = "#microsoft.graph.requestorManager"
                        ManagerLevel = 1
                    }
                )
            }
        )
    }
    AccessReviewSettings = @{
        IsEnabled = $true
        RecurrenceType = "monthly"
        DurationInDays = 14
        Reviewers = @(
            @{
                "@odata.type" = "#microsoft.graph.requestorManager"
                ManagerLevel = 1
            }
        )
    }
}

New-MgEntitlementManagementAccessPackageAssignmentPolicy -BodyParameter $policyParams
```

#### Policy Configuration Options

**Requestor Scope:**
- All users in directory
- Specific users and groups
- All external users (B2B)
- Specific connected organizations
- Users not in directory (new guests)

**Approval Settings:**
- No approval required (auto-assign)
- Single-stage approval
- Multi-stage approval (up to 3 stages)
- Manager approval
- Specific users as approvers
- Internal sponsors (access package owners)

**Assignment Duration:**
- Permanent (until manually removed)
- Specific date
- Number of days from assignment
- Number of days from request

**Access Review:**
- Disabled
- One-time review at specific date
- Recurring review (monthly, quarterly, annually)
- Review at assignment expiration

#### External User Onboarding via Access Package

**Scenario:** Partner collaboration project

```
Access Package: Partner Project Alpha
Catalog: External Collaborations

Resources:
- Project Alpha Teams team (member)
- Project Alpha SharePoint site (contributor)
- Project collaboration app (user)

Policy: External Partners
- Requestor scope: Users not in your directory
- Sponsor approval: Project manager + Security team (2-stage)
- Assignment duration: Project end date (6 months)
- Access review: Quarterly
- Questions for requestors:
  - Company name
  - Project role
  - Business justification
```

**Self-Service Request Portal:**
```
URL: https://myaccess.microsoft.com/@<tenant-name>
Users navigate to: Browse > Find "Partner Project Alpha" > Request
```

#### Managing Access Package Assignments

**View Assignments:**
```powershell
# List all assignments for an access package
$assignments = Get-MgEntitlementManagementAccessPackageAssignment `
    -Filter "accessPackageId eq '<access-package-id>'"

foreach ($assignment in $assignments) {
    $target = Get-MgUser -UserId $assignment.TargetId
    Write-Host "User: $($target.UserPrincipalName), State: $($assignment.State), Expires: $($assignment.Schedule.Expiration.EndDateTime)"
}
```

**Directly Assign (Admin):**
```powershell
# Admin directly assigns user to access package
$assignmentRequest = @{
    RequestType = "adminAdd"
    AccessPackageAssignment = @{
        AccessPackageId = "<access-package-id>"
        AssignmentPolicyId = "<policy-id>"
        TargetId = "<user-id>"
    }
}

New-MgEntitlementManagementAccessPackageAssignmentRequest -BodyParameter $assignmentRequest
```

**Remove Assignment:**
```powershell
$assignmentRequest = @{
    RequestType = "adminRemove"
    AccessPackageAssignment = @{
        Id = "<assignment-id>"
    }
}

New-MgEntitlementManagementAccessPackageAssignmentRequest -BodyParameter $assignmentRequest
```

#### Reporting and Monitoring

**View Request Log:**
```powershell
# Audit access package requests
$requests = Get-MgEntitlementManagementAccessPackageAssignmentRequest `
    -Filter "accessPackageId eq '<access-package-id>'" `
    -ExpandProperty requestor

$requests | Select-Object `
    @{N='Requestor';E={$_.Requestor.DisplayName}}, `
    RequestType, State, CreatedDateTime, `
    @{N='Justification';E={$_.Answers.DisplayValue}}
```

**Export Assignments for Compliance:**
```powershell
$allPackages = Get-MgEntitlementManagementAccessPackage -All

$report = @()
foreach ($package in $allPackages) {
    $assignments = Get-MgEntitlementManagementAccessPackageAssignment `
        -Filter "accessPackageId eq '$($package.Id)'"

    foreach ($assignment in $assignments) {
        $user = Get-MgUser -UserId $assignment.TargetId -ErrorAction SilentlyContinue

        $report += [PSCustomObject]@{
            AccessPackage = $package.DisplayName
            UserUPN = $user.UserPrincipalName
            UserDisplayName = $user.DisplayName
            State = $assignment.State
            AssignedDate = $assignment.Schedule.StartDateTime
            ExpiresDate = $assignment.Schedule.Expiration.EndDateTime
            PolicyName = $assignment.AssignmentPolicyId
        }
    }
}

$report | Export-Csv "AccessPackageAssignments_$(Get-Date -Format 'yyyyMMdd').csv" -NoTypeInformation
```

#### Best Practices

1. **Start with high-value scenarios** (onboarding, projects, campaigns)
2. **Use descriptive names** for access packages (explain what access it provides)
3. **Document in description** what the package is for and who should request it
4. **Limit catalog owners** to trusted administrators
5. **Separate catalogs** by department or sensitivity level
6. **Always include expiration** dates for time-bound access
7. **Enable access reviews** for access packages with extended durations
8. **Use questions** to gather context from requestors
9. **Multi-stage approval** for sensitive resources
10. **Monitor request denials** to improve package design

---

### 2.4 Just-In-Time (JIT) and Privileged Identity Management (PIM)

#### Overview

Privileged Identity Management (PIM) provides time-based, approval-based, and MFA-protected activation of privileged roles. It implements the Zero Trust principle of "just-in-time access" - users get elevated permissions only when needed, for a limited time.

#### Why PIM?

**Security Risks of Standing Admin Access:**
- Compromised admin accounts have unlimited access
- Over-privileged users increase attack surface
- Difficult to audit who actually needs admin rights
- No visibility into when/why admin rights are used
- Violates least privilege principle

**PIM Benefits:**
- Time-limited elevation (1-8 hours typical)
- Approval required for activation
- MFA enforced at activation
- Justification required (audit trail)
- Automatic expiration (no manual cleanup)
- Reduces standing admin count by 70-90%

#### PIM Capabilities

**1. Microsoft Entra Roles (Directory Roles)**
- Global Administrator
- User Administrator
- Application Administrator
- Privileged Role Administrator
- Security Administrator
- All other Entra ID built-in roles

**2. Azure Resource Roles (RBAC)**
- Owner
- Contributor
- User Access Administrator
- Custom roles

**3. PIM for Groups**
- Just-in-time membership in security groups
- Group-based access to applications/resources
- Extends PIM to any resource accessible via groups

#### Role Assignment Types

**Eligible:**
- User can activate the role when needed
- Requires activation (MFA, approval, justification)
- Time-limited activation (max 8 hours, configurable)
- Recommended for most admin scenarios

**Active:**
- User has permanent or time-bound standing access
- No activation required
- Should be minimized (emergency access accounts only)
- Can be time-limited (e.g., 30-day active assignment)

#### Configuring PIM

**Enable PIM:**
1. Navigate to Microsoft Entra ID > Privileged Identity Management
2. Consent to PIM (first time)
3. Select roles to manage (Entra roles or Azure resources)

**Assign Eligible Role:**
```powershell
# Microsoft Graph PowerShell (requires beta module)
Connect-MgGraph -Scopes "RoleManagement.ReadWrite.Directory", "PrivilegedAccess.ReadWrite.AzureADGroup"

# Assign user as eligible for Global Administrator role
$roleDefinitionId = (Get-MgRoleManagementDirectoryRoleDefinition -Filter "displayName eq 'Global Administrator'").Id
$principalId = (Get-MgUser -Filter "userPrincipalName eq 'admin@contoso.com'").Id

$params = @{
    Action = "adminAssign"
    RoleDefinitionId = $roleDefinitionId
    DirectoryScopeId = "/"
    PrincipalId = $principalId
    Justification = "Eligible assignment for emergency scenarios"
    ScheduleInfo = @{
        StartDateTime = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        Expiration = @{
            Type = "noExpiration"
        }
    }
}

New-MgRoleManagementDirectoryRoleEligibilityScheduleRequest -BodyParameter $params
```

**Via Azure Portal:**
1. Navigate to PIM > Microsoft Entra roles
2. Select role (e.g., User Administrator)
3. Click "Add assignments"
4. Select user
5. Assignment type: Eligible
6. Duration: Permanent eligible or time-bound
7. Assign

#### Role Settings (Activation Requirements)

**Configurable Settings:**
- Activation maximum duration (1-8 hours, default 8)
- MFA required on activation
- Approval required for activation
- Justification required
- Ticket system integration (require ticket number)
- Notification settings

**Recommended Settings for Privileged Roles:**
```
Role: Global Administrator
- Activation duration: 4 hours
- MFA required: Yes
- Approval required: Yes (2 approvers)
- Justification required: Yes
- Notifications: Alert on activation
- Eligible assignment max: 90 days (re-approval required)
```

**Configure Role Settings:**
```powershell
# Get role policy
$roleDefinitionId = (Get-MgRoleManagementDirectoryRoleDefinition -Filter "displayName eq 'Global Administrator'").Id

$policy = Get-MgPolicyRoleManagementPolicy -Filter "scopeId eq '/' and scopeType eq 'DirectoryRole'" |
    Where-Object { $_.Rules.Target.RoleDefinitionId -eq $roleDefinitionId }

# Update activation rules (requires REST API for detailed control)
# This is complex - typically done via portal
```

#### Activating Roles

**User Experience:**
1. User navigates to https://aka.ms/mypim
2. Selects "My roles" > Microsoft Entra roles
3. Clicks "Activate" on eligible role
4. Provides justification
5. Completes MFA (if required)
6. Waits for approval (if required)
7. Role active for configured duration

**Programmatic Activation:**
```powershell
# User activates their eligible role
$roleDefinitionId = (Get-MgRoleManagementDirectoryRoleDefinition -Filter "displayName eq 'User Administrator'").Id
$principalId = (Get-MgContext).Account

$params = @{
    Action = "selfActivate"
    RoleDefinitionId = $roleDefinitionId
    DirectoryScopeId = "/"
    PrincipalId = $principalId
    Justification = "Need to reset user passwords for locked-out users in Sales department"
    ScheduleInfo = @{
        StartDateTime = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        Expiration = @{
            Type = "afterDuration"
            Duration = "PT4H"  # 4 hours
        }
    }
}

New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest -BodyParameter $params
```

#### PIM for Groups

**Use Case:** Just-in-time access to resources via group membership

**Example:**
```
Group: Production Environment Access
Members: Empty (all members are eligible)
Group provides access to:
- Production Azure subscriptions (Owner role)
- Production application admin portal
- Production database access

PIM Configuration:
- Users assigned as eligible members
- Activation requires: Manager approval + MFA + Justification
- Activation duration: 4 hours
- Access review: Quarterly (validate eligible assignments)
```

**Assign Eligible Group Membership:**
```powershell
# Assign user as eligible member of PIM-enabled group
$groupId = (Get-MgGroup -Filter "displayName eq 'Production Environment Access'").Id
$principalId = (Get-MgUser -Filter "userPrincipalName eq 'engineer@contoso.com'").Id

$params = @{
    AccessId = "member"  # or "owner"
    PrincipalId = $principalId
    GroupId = $groupId
    Action = "adminAssign"
    ScheduleInfo = @{
        StartDateTime = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        Expiration = @{
            Type = "noExpiration"
        }
    }
    Justification = "Eligible for production access during on-call rotation"
}

New-MgIdentityGovernancePrivilegedAccessGroupEligibilityScheduleRequest -BodyParameter $params
```

#### Monitoring and Alerting

**PIM Alerts:**
- Roles are being activated too frequently
- Roles are being assigned outside of PIM
- Too many global administrators
- Duplicate roles assigned
- Eligible assignments about to expire

**View PIM Audit History:**
```powershell
# Get PIM audit log (role activations, assignments, etc.)
Get-MgAuditLogDirectoryAudit -Filter "category eq 'RoleManagement'" -Top 50 |
    Select-Object ActivityDisplayName, ActivityDateTime, `
        @{N='InitiatedBy';E={$_.InitiatedBy.User.UserPrincipalName}}, `
        @{N='Target';E={$_.TargetResources[0].DisplayName}}
```

**Export Activation History:**
```powershell
# Export who activated what roles and when
$roleAssignments = Get-MgRoleManagementDirectoryRoleAssignmentScheduleInstance -All

$activations = $roleAssignments | Where-Object {
    $_.AssignmentType -eq "Activated"
} | ForEach-Object {
    $user = Get-MgUser -UserId $_.PrincipalId -ErrorAction SilentlyContinue
    $role = Get-MgRoleManagementDirectoryRoleDefinition -UnifiedRoleDefinitionId $_.RoleDefinitionId

    [PSCustomObject]@{
        User = $user.UserPrincipalName
        Role = $role.DisplayName
        ActivatedAt = $_.StartDateTime
        ExpiresAt = $_.EndDateTime
        Status = $_.Status
    }
}

$activations | Export-Csv "PIM_Activations_$(Get-Date -Format 'yyyyMMdd').csv" -NoTypeInformation
```

#### Best Practices

1. **No standing admins** except emergency access accounts (2 break-glass accounts)
2. **Eligible only** for all regular administrators
3. **Short activation windows** (4-8 hours maximum)
4. **Always require MFA** on activation
5. **Require approval** for highly privileged roles (Global Admin, Privileged Role Admin)
6. **Require justification** for all activations (audit trail)
7. **Regular access reviews** of eligible assignments (quarterly)
8. **Alert on activations** for most privileged roles
9. **Time-bound eligible assignments** (re-certify every 90 days)
10. **Use PIM for Groups** to extend JIT access to Azure resources and applications

**Recommended Role Tiers:**

**Tier 0 (Highest Privilege):**
- Global Administrator
- Privileged Role Administrator
- Security Administrator
- Activation: 4 hours, MFA + 2-person approval

**Tier 1 (High Privilege):**
- User Administrator
- Exchange Administrator
- SharePoint Administrator
- Activation: 8 hours, MFA + manager approval

**Tier 2 (Moderate Privilege):**
- Helpdesk Administrator
- Groups Administrator
- License Administrator
- Activation: 8 hours, MFA + justification (no approval)

---

### 2.5 Compliance Requirements and Identity Governance

#### Overview

Identity governance supports regulatory compliance by ensuring appropriate access controls, audit trails, and periodic attestation. Different regulations have specific identity-related requirements.

#### SOX (Sarbanes-Oxley Act)

**Scope:** Publicly traded companies, financial reporting controls

**Key Identity Requirements:**

**1. Segregation of Duties (SoD):**
- Users with conflicting roles cannot hold both simultaneously
- Example: User cannot both approve purchases AND process payments
- Prevents fraud and financial misstatement

**Implementation in Entra:**
```powershell
# Example: Detect SoD violations
# Define conflicting roles
$conflictingRoles = @(
    @{
        Role1 = "Purchase Approver"  # Group name
        Role2 = "Payment Processor"  # Group name
        Conflict = "Can approve and pay - fraud risk"
    }
)

$violations = @()

foreach ($conflict in $conflictingRoles) {
    $group1Members = Get-MgGroupMember -GroupId (Get-MgGroup -Filter "displayName eq '$($conflict.Role1)'").Id
    $group2Members = Get-MgGroupMember -GroupId (Get-MgGroup -Filter "displayName eq '$($conflict.Role2)'").Id

    $group1Ids = $group1Members | Select-Object -ExpandProperty Id
    $group2Ids = $group2Members | Select-Object -ExpandProperty Id

    $conflicts = $group1Ids | Where-Object { $_ -in $group2Ids }

    foreach ($userId in $conflicts) {
        $user = Get-MgUser -UserId $userId
        $violations += [PSCustomObject]@{
            User = $user.UserPrincipalName
            ConflictType = $conflict.Conflict
            Role1 = $conflict.Role1
            Role2 = $conflict.Role2
        }
    }
}

if ($violations) {
    Write-Host "SOX VIOLATIONS DETECTED:"
    $violations | Format-Table
}
```

**2. Access Reviews:**
- Quarterly or annual review of privileged access
- Manager attestation of user access rights
- Documentation of review process

**3. Audit Logging:**
- Retain logs of all access changes (creation, modification, deletion)
- Minimum 7-year retention for financial systems
- Immutable audit trail

**4. Change Management:**
- Documented process for access provisioning
- Approval workflows required
- No standing admin access to financial systems

**Entra Features for SOX:**
- Access Reviews (quarterly attestation)
- Entitlement Management (documented approval workflows)
- PIM (eliminate standing admin access)
- Audit logs → Azure Monitor → Azure Storage (7-year retention)
- Conditional Access (MFA for financial applications)

---

#### HIPAA (Health Insurance Portability and Accountability Act)

**Scope:** Healthcare providers, payers, clearinghouses, business associates

**Key Identity Requirements:**

**1. Unique User Identification:**
- Each user must have unique identifier
- Shared accounts prohibited (except limited exceptions)
- Audit trail must identify specific individual

**2. Minimum Necessary Access:**
- Users only have access to PHI (Protected Health Information) needed for job
- Role-based access control
- Regular validation of access appropriateness

**3. Access Controls:**
- MFA for remote access to PHI
- Automatic logoff after inactivity
- Encryption of data at rest and in transit

**4. Audit Controls:**
- Log all access to PHI systems
- Regular audit log review
- Identify access outside normal patterns

**5. Workforce Training:**
- Annual security awareness training
- Documentation of training completion

**Implementation in Entra:**
```
Conditional Access Policies for HIPAA:

Policy 1: MFA for Healthcare Apps
- Users: All users
- Apps: EMR, patient portal, billing system
- Conditions: Any location
- Grant: Require MFA
- Session: Sign-in frequency: 8 hours

Policy 2: Device Compliance for PHI Access
- Users: All users
- Apps: Healthcare apps (tagged)
- Conditions: Any device
- Grant: Require device to be compliant
- Block if device not encrypted

Policy 3: Block External Access to PHI
- Users: All users
- Apps: Healthcare apps
- Conditions: Location not in trusted IPs
- Grant: Block (except for approved remote users with VPN)

Access Reviews:
- Semi-annual review of all healthcare app access
- Manager attestation
- Auto-remove if not approved
```

**PowerShell Example: Audit PHI Access:**
```powershell
# Audit sign-ins to healthcare applications
$healthcareApps = @(
    "Electronic Medical Records",
    "Patient Billing System",
    "Lab Results Portal"
)

# Get app IDs
$appIds = @()
foreach ($appName in $healthcareApps) {
    $app = Get-MgServicePrincipal -Filter "displayName eq '$appName'" -ErrorAction SilentlyContinue
    if ($app) { $appIds += $app.AppId }
}

# Get sign-ins to these apps (last 30 days)
$signIns = Get-MgAuditLogSignIn -Filter "createdDateTime ge $((Get-Date).AddDays(-30).ToString('yyyy-MM-dd'))" -All

$phiAccess = $signIns | Where-Object { $_.AppId -in $appIds } | ForEach-Object {
    [PSCustomObject]@{
        User = $_.UserPrincipalName
        Application = $_.AppDisplayName
        DateTime = $_.CreatedDateTime
        Location = $_.Location.City
        IPAddress = $_.IPAddress
        DeviceOS = $_.DeviceDetail.OperatingSystem
        Status = $_.Status.ErrorCode
    }
}

$phiAccess | Export-Csv "HIPAA_PHI_Access_Audit_$(Get-Date -Format 'yyyyMMdd').csv" -NoTypeInformation
```

---

#### GDPR (General Data Protection Regulation)

**Scope:** Organizations processing data of EU residents

**Key Identity Requirements:**

**1. Data Subject Rights:**
- Right to access (user can see their data)
- Right to rectification (correct inaccurate data)
- Right to erasure ("right to be forgotten")
- Right to data portability (export in machine-readable format)

**2. Consent Management:**
- Explicit consent for data processing
- Granular consent (per purpose)
- Withdraw consent easily
- Document consent decisions

**3. Data Minimization:**
- Collect only necessary identity data
- Limit access to personal data
- Regular review of data retention

**4. Breach Notification:**
- Report breaches within 72 hours
- Notify affected individuals
- Document breach response

**5. Privacy by Design:**
- Default to least privilege
- Encrypt personal data
- Pseudonymization where possible

**Implementation in Entra:**
```powershell
# Example: GDPR Data Export (Data Subject Access Request)
function Export-UserDataForGDPR {
    param([string]$UserUPN)

    $user = Get-MgUser -UserId $UserUPN

    # User profile data
    $profile = $user | Select-Object DisplayName, UserPrincipalName, JobTitle, Department,
        OfficeLocation, MobilePhone, BusinessPhones, StreetAddress, City, State, PostalCode, Country

    # Group memberships
    $groups = Get-MgUserMemberOf -UserId $user.Id | Select-Object DisplayName, Description

    # Application assignments
    $appAssignments = Get-MgUserAppRoleAssignment -UserId $user.Id | Select-Object AppDisplayName, PrincipalType

    # Sign-in history (last 90 days)
    $signIns = Get-MgAuditLogSignIn -Filter "userId eq '$($user.Id)'" -Top 1000 |
        Select-Object CreatedDateTime, AppDisplayName, IPAddress, Location

    # Audit activities (user's actions)
    $auditLogs = Get-MgAuditLogDirectoryAudit -Filter "initiatedBy/user/id eq '$($user.Id)'" -Top 1000 |
        Select-Object ActivityDisplayName, ActivityDateTime, Result

    # Export all data
    $exportPath = "C:\GDPRExports\$($UserUPN)_$(Get-Date -Format 'yyyyMMdd')"
    New-Item -ItemType Directory -Path $exportPath -Force | Out-Null

    $profile | ConvertTo-Json | Out-File "$exportPath\profile.json"
    $groups | Export-Csv "$exportPath\groups.csv" -NoTypeInformation
    $appAssignments | Export-Csv "$exportPath\applications.csv" -NoTypeInformation
    $signIns | Export-Csv "$exportPath\sign-ins.csv" -NoTypeInformation
    $auditLogs | Export-Csv "$exportPath\activities.csv" -NoTypeInformation

    Write-Host "GDPR export completed: $exportPath"
}

# Example: Right to Erasure (requires careful consideration!)
function Remove-UserDataForGDPR {
    param([string]$UserUPN)

    $user = Get-MgUser -UserId $UserUPN

    # WARNING: This is permanent!
    # 1. Remove from all groups
    $groups = Get-MgUserMemberOf -UserId $user.Id
    foreach ($group in $groups) {
        Remove-MgGroupMemberByRef -GroupId $group.Id -DirectoryObjectId $user.Id
    }

    # 2. Revoke all sessions
    Revoke-MgUserSignInSession -UserId $user.Id

    # 3. Remove licenses
    Set-MgUserLicense -UserId $user.Id -AddLicenses @() -RemoveLicenses @($user.AssignedLicenses.SkuId)

    # 4. Delete user (soft delete, 30-day recovery window)
    Remove-MgUser -UserId $user.Id

    # 5. Hard delete (after 30 days, or immediate if legally required)
    # Remove-MgDirectoryDeletedItem -DirectoryObjectId $user.Id

    Write-Host "User data removed per GDPR request: $UserUPN"
}
```

**GDPR Compliance Features:**
- Conditional Access (minimize data exposure)
- Identity Protection (detect compromised accounts)
- Audit logs (document all access and changes)
- Microsoft 365 compliance center (data classification, retention)
- Azure Information Protection (encrypt/label personal data)

---

#### Identity Governance Tools and Frameworks

**Microsoft Entra ID Governance:**
- Access Reviews
- Entitlement Management
- Privileged Identity Management
- Lifecycle Workflows
- Access package policies
- Terms of Use

**Third-Party IGA Solutions:**

**SailPoint IdentityNow/IdentityIQ:**
- Comprehensive IGA platform
- Advanced SoD detection
- Role mining and analytics
- Multi-cloud support

**Saviynt:**
- Cloud-native IGA
- GRC integration
- Application governance
- Risk-based access certification

**Omada Identity:**
- Identity Analytics
- Role management
- Compliance reporting
- IT shop for access requests

**One Identity Manager:**
- Enterprise IGA
- Application onboarding
- Attestation campaigns
- Compliance dashboards

**IBM Security Identity Governance:**
- Identity analytics
- Risk scoring
- Segregation of Duties
- Compliance reporting

---

### 2.6 Audit Logging and Reporting

#### Overview

Microsoft Entra ID provides comprehensive audit and sign-in logs for identity governance, security monitoring, and compliance.

#### Log Types

**1. Audit Logs:**
- User and group management (create, update, delete)
- Application assignments
- License changes
- Role assignments
- Policy changes (Conditional Access, etc.)
- Password resets and changes
- MFA registrations
- Device registrations

**2. Sign-In Logs:**
- Interactive user sign-ins
- Non-interactive sign-ins (refresh tokens)
- Service principal sign-ins
- Managed identity sign-ins
- MFA challenges and results
- Conditional Access policy evaluation
- Risk detections (Identity Protection)

**3. Provisioning Logs:**
- User provisioning to SaaS applications
- HR-driven provisioning events
- Synchronization errors
- Attribute mapping results

**4. PIM Logs:**
- Role activations
- Role assignments
- Approval decisions
- Role setting changes

#### Data Retention

**Default Retention:**
- Free/Office 365 tenants: 7 days
- Azure AD Premium P1: 30 days
- Azure AD Premium P2: 30 days

**Extended Retention (Required for Compliance):**

**Option 1: Azure Monitor Integration**
- Route logs to Log Analytics workspace
- Retention: Up to 2 years in workspace, unlimited in Azure Storage
- Query with KQL (Kusto Query Language)
- Custom alerts and dashboards

**Option 2: Azure Storage Account**
- Archive logs to blob storage
- Retention: Unlimited (policy-based deletion)
- Cost-effective long-term storage
- Export to SIEM or compliance systems

**Option 3: Event Hub**
- Stream logs in real-time
- Integration with SIEM (Splunk, QRadar, ArcSight, Sentinel)
- Custom processing pipelines

#### Configuring Log Export

**Export to Azure Monitor:**
1. Navigate to Microsoft Entra ID > Monitoring > Diagnostic settings
2. Add diagnostic setting
3. Select log categories (AuditLogs, SignInLogs, etc.)
4. Send to Log Analytics workspace
5. Configure retention

**Via PowerShell:**
```powershell
# Note: Requires Azure PowerShell (Az module), not Microsoft Graph

# Create diagnostic setting to send logs to Log Analytics
$workspaceId = "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.OperationalInsights/workspaces/<workspace>"

$log = @{
    Category = "AuditLogs"
    Enabled = $true
    RetentionPolicy = @{
        Enabled = $true
        Days = 365
    }
}

$signInLog = @{
    Category = "SignInLogs"
    Enabled = $true
    RetentionPolicy = @{
        Enabled = $true
        Days = 365
    }
}

$diagnosticSetting = @{
    Name = "SendToLogAnalytics"
    WorkspaceId = $workspaceId
    Logs = @($log, $signInLog)
}

# Azure CLI approach (more reliable)
az monitor diagnostic-settings create `
    --resource "/subscriptions/<sub-id>/providers/Microsoft.AADIAM/diagnosticSettings/SendToLogAnalytics" `
    --name "SendToLogAnalytics" `
    --workspace $workspaceId `
    --logs '[{"category":"AuditLogs","enabled":true,"retentionPolicy":{"enabled":true,"days":365}},{"category":"SignInLogs","enabled":true,"retentionPolicy":{"enabled":true,"days":365}}]'
```

#### Querying Logs with PowerShell

**Audit Logs:**
```powershell
# Get recent audit logs
Get-MgAuditLogDirectoryAudit -Top 50 |
    Select-Object ActivityDisplayName, ActivityDateTime, Result, `
        @{N='User';E={$_.InitiatedBy.User.UserPrincipalName}}, `
        @{N='Target';E={$_.TargetResources[0].DisplayName}}

# Filter by activity
Get-MgAuditLogDirectoryAudit -Filter "activityDisplayName eq 'Add user'" -Top 100

# Filter by date range
$startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
Get-MgAuditLogDirectoryAudit -Filter "activityDateTime ge $startDate"

# Find specific user's activities
$userId = (Get-MgUser -Filter "userPrincipalName eq 'admin@contoso.com'").Id
Get-MgAuditLogDirectoryAudit -Filter "initiatedBy/user/id eq '$userId'" -Top 100

# Password reset activities
Get-MgAuditLogDirectoryAudit -Filter "activityDisplayName eq 'Reset password (by admin)'" -Top 50 |
    Select-Object ActivityDateTime, `
        @{N='Admin';E={$_.InitiatedBy.User.UserPrincipalName}}, `
        @{N='TargetUser';E={$_.TargetResources[0].UserPrincipalName}}
```

**Sign-In Logs:**
```powershell
# Get recent sign-ins
Get-MgAuditLogSignIn -Top 50 |
    Select-Object CreatedDateTime, UserPrincipalName, AppDisplayName, `
        IPAddress, @{N='Location';E={$_.Location.City}}, `
        @{N='Status';E={$_.Status.ErrorCode}}

# Failed sign-ins
Get-MgAuditLogSignIn -Filter "status/errorCode ne 0" -Top 100 |
    Select-Object CreatedDateTime, UserPrincipalName, `
        @{N='Error';E={$_.Status.FailureReason}}, IPAddress

# MFA challenges
Get-MgAuditLogSignIn -Filter "authenticationRequirement eq 'multiFactorAuthentication'" -Top 100

# Conditional Access policy results
Get-MgAuditLogSignIn -Top 100 |
    Select-Object UserPrincipalName, AppDisplayName, `
        @{N='CAPolicies';E={($_.AppliedConditionalAccessPolicies | ForEach-Object { "$($_.DisplayName):$($_.Result)" }) -join '; '}}

# Risky sign-ins (requires Identity Protection)
Get-MgAuditLogSignIn -Filter "riskLevelDuringSignIn ne 'none'" -Top 50 |
    Select-Object CreatedDateTime, UserPrincipalName, RiskLevelDuringSignIn, `
        RiskDetail, IPAddress, @{N='Location';E={$_.Location.City}}

# Sign-ins from specific user
Get-MgAuditLogSignIn -Filter "userPrincipalName eq 'user@contoso.com'" -Top 100
```

#### Querying with Azure Monitor (KQL)

**After exporting logs to Log Analytics, use KQL for advanced queries:**

```kql
// Failed sign-ins in last 24 hours
SigninLogs
| where TimeGenerated > ago(24h)
| where ResultType != 0
| summarize FailedAttempts = count() by UserPrincipalName, AppDisplayName
| order by FailedAttempts desc

// MFA fraud alerts
SigninLogs
| where TimeGenerated > ago(7d)
| where ResultType == 50074  // MFA denied
| extend City = LocationDetails.city
| project TimeGenerated, UserPrincipalName, IPAddress, City, UserAgent

// Conditional Access policy impact
SigninLogs
| where TimeGenerated > ago(30d)
| mv-expand ConditionalAccessPolicies
| where ConditionalAccessPolicies.result == "failure"
| summarize BlockedSignIns = count() by tostring(ConditionalAccessPolicies.displayName)
| order by BlockedSignIns desc

// User and group changes
AuditLogs
| where TimeGenerated > ago(7d)
| where OperationName in ("Add user", "Delete user", "Add member to group", "Remove member from group")
| extend Actor = tostring(InitiatedBy.user.userPrincipalName)
| extend Target = tostring(TargetResources[0].userPrincipalName)
| project TimeGenerated, OperationName, Actor, Target, Result

// Privileged role activations
AuditLogs
| where TimeGenerated > ago(30d)
| where Category == "RoleManagement"
| where OperationName == "Add member to role completed (PIM activation)"
| extend Actor = tostring(InitiatedBy.user.userPrincipalName)
| extend Role = tostring(TargetResources[0].displayName)
| project TimeGenerated, Actor, Role, Result

// Sign-ins from risky locations
SigninLogs
| where TimeGenerated > ago(7d)
| where RiskLevelDuringSignIn in ("high", "medium")
| extend City = LocationDetails.city
| extend Country = LocationDetails.countryOrRegion
| project TimeGenerated, UserPrincipalName, City, Country, IPAddress, RiskLevelDuringSignIn

// Anomalous sign-in patterns (multiple locations)
SigninLogs
| where TimeGenerated > ago(1h)
| extend City = LocationDetails.city
| summarize Cities = make_set(City) by UserPrincipalName
| where array_length(Cities) > 1
| extend Alert = "User signed in from multiple cities within 1 hour"
```

#### Compliance Reporting

**SOX Compliance Report: Privileged Access Changes:**
```powershell
# Export all privileged role assignments in last quarter
$startDate = (Get-Date).AddDays(-90).ToString("yyyy-MM-dd")

$roleChanges = Get-MgAuditLogDirectoryAudit `
    -Filter "activityDateTime ge $startDate and category eq 'RoleManagement'" -All

$report = $roleChanges | ForEach-Object {
    [PSCustomObject]@{
        DateTime = $_.ActivityDateTime
        Activity = $_.ActivityDisplayName
        InitiatedBy = $_.InitiatedBy.User.UserPrincipalName
        TargetUser = $_.TargetResources[0].UserPrincipalName
        Role = $_.TargetResources[0].DisplayName
        Result = $_.Result
        Justification = $_.AdditionalDetails | Where-Object { $_.Key -eq "Justification" } | Select-Object -ExpandProperty Value
    }
}

$report | Export-Csv "SOX_Privileged_Access_Report_Q$(Get-Date -Format 'Q_yyyy').csv" -NoTypeInformation
```

**HIPAA Compliance Report: PHI Access Audit:**
```powershell
# Track all access to healthcare applications
$healthcareApps = @("EMR System", "Patient Portal", "Billing System")

$phiAccess = Get-MgAuditLogSignIn -Filter "createdDateTime ge $((Get-Date).AddDays(-30).ToString('yyyy-MM-dd'))" -All |
    Where-Object { $_.AppDisplayName -in $healthcareApps }

$report = $phiAccess | Select-Object `
    @{N='AccessDate';E={$_.CreatedDateTime}},
    UserPrincipalName,
    AppDisplayName,
    IPAddress,
    @{N='Location';E={$_.Location.City + ", " + $_.Location.State}},
    @{N='DeviceOS';E={$_.DeviceDetail.OperatingSystem}},
    @{N='DeviceCompliant';E={$_.DeviceDetail.IsCompliant}},
    @{N='MFAUsed';E={if($_.AuthenticationRequirement -eq 'multiFactorAuthentication'){'Yes'}else{'No'}}},
    @{N='Status';E={if($_.Status.ErrorCode -eq 0){'Success'}else{'Failed'}}}

$report | Export-Csv "HIPAA_PHI_Access_Audit_$(Get-Date -Format 'yyyyMM').csv" -NoTypeInformation

# Summary statistics
Write-Host "Total PHI Access Events: $($report.Count)"
Write-Host "Unique Users: $(($report | Select-Object -Unique UserPrincipalName).Count)"
Write-Host "Failed Access Attempts: $(($report | Where-Object {$_.Status -eq 'Failed'}).Count)"
```

**GDPR Compliance Report: Data Processing Activities:**
```powershell
# Document who accessed/modified user data
$startDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")

$dataProcessing = Get-MgAuditLogDirectoryAudit -Filter "activityDateTime ge $startDate" -All |
    Where-Object { $_.Category -in @("UserManagement", "GroupManagement") }

$report = $dataProcessing | Select-Object `
    ActivityDateTime,
    ActivityDisplayName,
    @{N='ProcessedBy';E={$_.InitiatedBy.User.UserPrincipalName}},
    @{N='DataSubject';E={$_.TargetResources[0].UserPrincipalName}},
    @{N='DataType';E={$_.TargetResources[0].ModifiedProperties | ForEach-Object { $_.DisplayName } | Select-Object -First 5}},
    Result

$report | Export-Csv "GDPR_Data_Processing_Log_$(Get-Date -Format 'yyyyMM').csv" -NoTypeInformation
```

#### Best Practices

1. **Export logs immediately** to Azure Monitor or Storage (don't rely on 30-day retention)
2. **Set up alerts** for critical events (admin role changes, MFA fraud, etc.)
3. **Regular log reviews** (weekly for security, quarterly for compliance)
4. **Automate compliance reporting** (monthly/quarterly exports)
5. **Retention policies** match regulatory requirements (7 years for SOX)
6. **Protect log data** (RBAC, immutable storage for compliance)
7. **Integrate with SIEM** for real-time monitoring
8. **Document log review procedures** for auditors
9. **Test log export** regularly (ensure logs are captured correctly)
10. **Use Log Analytics** for complex queries and dashboards

---

## Summary

This research brief provides a comprehensive overview of Microsoft Entra ID (Azure AD) and Identity Governance as of February 2026. Key takeaways:

**Core Identity (Part 1):**
- Microsoft Entra ID is the cloud identity platform (rebranded from Azure AD)
- Critical 2026 deadline: Entra Connect v2.5.79.0+ required by Sept 30, 2026
- Conditional Access is the Zero Trust policy engine (resource exclusion changes March 27, 2026)
- Managed identities eliminate credential management for Azure resources
- Microsoft Graph PowerShell replaces deprecated AzureAD module
- External ID replaces Azure AD B2C (P2 discontinued March 15, 2026)

**Identity Governance (Part 2):**
- JML (Joiner-Mover-Leaver) lifecycle automation reduces risk and improves efficiency
- Access Reviews ensure least privilege through periodic attestation
- Entitlement Management provides self-service access with approval workflows
- PIM (Privileged Identity Management) implements just-in-time admin access
- Compliance frameworks (SOX, HIPAA, GDPR) have specific identity requirements
- Audit logging to Azure Monitor enables long-term retention and compliance reporting

**Best Practices:**
- Automate identity lifecycle (HR-driven provisioning)
- Eliminate standing admin accounts (PIM for all admins)
- Implement Conditional Access for Zero Trust
- Enable MFA universally (especially for privileged roles)
- Regular access reviews (quarterly for privileged, annually for general)
- Export logs for compliance (7+ year retention)
- Use managed identities instead of service principals where possible
- Document all governance processes for auditors

**Next Steps:**
- Upgrade Entra Connect to v2.5.79.0+ before September 30, 2026
- Migrate PowerShell scripts from AzureAD to Microsoft.Graph module
- Review Conditional Access policies for March 27, 2026 enforcement changes
- Plan migration from Azure AD B2C to Entra External ID (if applicable)
- Implement PIM for all administrator roles
- Configure audit log export to Azure Monitor/Storage
- Establish access review cadence for compliance

---

## Sources

- [Microsoft Entra ID documentation - Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity/)
- [Microsoft Entra releases and announcements](https://learn.microsoft.com/en-us/entra/fundamentals/whats-new)
- [Hardening updates for Microsoft Entra Connect Sync](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/harden-update-ad-fs-pingfederate)
- [Microsoft Entra Conditional Access: Zero Trust Policy Engine](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)
- [Plan Your Microsoft Entra Conditional Access Deployment](https://learn.microsoft.com/en-us/entra/identity/conditional-access/plan-conditional-access)
- [Upcoming Conditional Access change: Improved enforcement for policies with resource exclusions](https://techcommunity.microsoft.com/blog/microsoft-entra-blog/upcoming-conditional-access-change-improved-enforcement-for-policies-with-resour/4488925)
- [Apps & service principals in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals)
- [Managed identity vs. service principal for Azure apps - TechTarget](https://www.techtarget.com/searchcloudcomputing/tip/Managed-identity-vs-service-principal-for-Azure-apps)
- [Microsoft Entra External ID overview](https://learn.microsoft.com/en-us/entra/external-id/external-identities-overview)
- [Microsoft to End Sale of Azure AD B2B/B2C on May 1, 2025 – Envision IT](https://envisionit.com/resources/articles/microsoft-to-end-sale-of-azure-ad-b2bb2c-on-may-1-2025-shifting-to-entra-id-external-identities)
- [What's new in Microsoft Graph - Microsoft Learn](https://learn.microsoft.com/en-us/graph/whats-new-overview)
- [Microsoft Entra Identity and Network Access Management APIs on Microsoft Graph](https://learn.microsoft.com/en-us/graph/identity-network-access-overview)
- [Find Azure AD and MSOnline cmdlets in Microsoft Graph PowerShell](https://learn.microsoft.com/en-us/powershell/microsoftgraph/azuread-msoline-cmdlet-map)
- [Migrate from Azure AD PowerShell to Microsoft Graph PowerShell](https://learn.microsoft.com/en-us/powershell/microsoftgraph/migration-steps)
- [What Is the Joiner–Mover–Leaver (JML) Lifecycle? - OpenIAM](https://www.openiam.com/workforce-identity-concepts/identity-lifecycle-management/joiner-mover-leaver-lifecycle)
- [What are access reviews? - Microsoft Entra ID Governance](https://learn.microsoft.com/en-us/entra/id-governance/access-reviews-overview)
- [Plan a Microsoft Entra access reviews deployment](https://learn.microsoft.com/en-us/entra/id-governance/deploy-access-reviews)
- [What is entitlement management? - Microsoft Entra ID Governance](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-overview)
- [Create an access package in entitlement management](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-create)
- [What is Privileged Identity Management? - Microsoft Entra ID Governance](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure)
- [Plan a Privileged Identity Management deployment](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-deployment-plan)
- [Achieving GDPR, HIPAA, and SOX Compliance Requirements - CEIA America](https://www.ceiamerica.com/compliance-requirements-guide/)
- [12 Best IGA Vendors & Providers Heading Into 2026 - ConductorOne](https://www.conductorone.com/guides/iga-solutions/)
- [Learn about the audit logs in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-audit-logs)
- [View reports & logs in entitlement management](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-reports)
- [Best practices to secure with Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/architecture/secure-best-practices)
- [Azure identity & access security best practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/identity-management-best-practices)
- [PowerShell V2 examples for managing groups](https://learn.microsoft.com/en-us/entra/identity/users/groups-settings-v2-cmdlets)
- [Azure AD vs Active Directory | Key Differences - NinjaOne](https://www.ninjaone.com/blog/azure-ad-vs-active-directory-whats-the-difference/)
- [Hybrid identity with Active Directory and Microsoft Entra ID in Azure landing zones](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-area/identity-access-active-directory-hybrid-identity)
