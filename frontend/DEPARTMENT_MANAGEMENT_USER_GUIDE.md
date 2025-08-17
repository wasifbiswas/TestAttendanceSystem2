# Department Management System - User Guide

## Overview

The Department Management System provides administrators with complete control over organizational departments, including creation, modification, deletion, and employee assignment. This dynamic system allows real-time management of departmental structure according to organizational requirements.

## Accessing Department Management

### For Administrators

1. **Login** as an administrator user
2. **Navigate to Admin Dashboard** (`http://localhost:5175/admin`)
3. **Click "Manage Departments"** button in the Admin Actions section
4. **Or directly visit** `http://localhost:5175/admin/departments`

## Core Features

### 📊 Department Statistics Dashboard

- **Total Departments**: Overview of all departments
- **Active/Inactive Status**: Real-time status tracking
- **Department Heads**: Count of departments with assigned heads
- **Employee Distribution**: Visual representation of department sizes

### 🔍 Advanced Search & Filtering

- **Search by Name**: Find departments by name or description
- **Status Filter**: Filter by Active/Inactive departments
- **Real-time Results**: Instant search results as you type
- **Pagination**: Efficient handling of large department lists

### 🏢 Department Operations

#### ➕ Create Department

**Required Information:**

- Department Name (unique, required)
- Description (optional)
- Status (Active/Inactive)
- Location (optional)
- Budget (optional, in USD)

**Process:**

1. Click "Create Department" button
2. Fill out the form with department details
3. Click "Create Department" to save
4. System validates and creates the new department

#### ✏️ Edit Department

**Editable Fields:**

- Department name
- Description
- Status (Active/Inactive)
- Location
- Budget
- View current employee count (read-only)

**Process:**

1. Click the edit icon (pencil) next to any department
2. Modify the desired fields
3. Click "Update Department" to save changes

#### 🗑️ Delete Department

**Safety Features:**

- Cannot delete departments with assigned employees
- Requires typing department name to confirm
- Shows employee count before deletion
- Permanent action warning

**Process:**

1. Click the delete icon (trash) next to the department
2. Review department information and warnings
3. Type the exact department name to confirm
4. Click "Delete Department" (only if no employees are assigned)

#### 👥 Manage Department Head

**Available Actions:**

- Assign employee as department head
- Remove current department head
- View all eligible employees in the department
- Switch between different employees

**Process:**

1. Click the user icon next to any department
2. View current department head (if assigned)
3. Select from available employees in that department
4. Click "Assign as Head" or "Remove" as needed

#### 📋 View Department Details

**Detailed Information Includes:**

- Basic department information
- Current department head details
- Complete list of assigned employees
- Employee contact information
- Department statistics
- Creation and modification dates

**Process:**

1. Click the building icon next to any department
2. Review comprehensive department information
3. See all employees with their contact details

### 📱 User Interface Features

#### 🎨 Modern Design

- **Dark/Light Mode**: Automatic theme adaptation
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Intuitive Icons**: Clear visual indicators for all actions
- **Loading States**: Smooth loading animations
- **Success/Error Messages**: Clear feedback for all operations

#### ⚡ Real-time Updates

- **Instant Search**: Results update as you type
- **Live Statistics**: Auto-refreshing department counts
- **Dynamic Status**: Real-time active/inactive indicators
- **Pagination**: Smart page navigation

#### 🔒 Security Features

- **Admin-only Access**: Restricted to authorized administrators
- **Validation**: Client and server-side input validation
- **Confirmation Dialogs**: Prevent accidental deletions
- **Error Handling**: Graceful error management

## API Integration

### Backend Endpoints

The frontend integrates with these API endpoints:

```
GET    /api/departments/stats              - Department statistics
GET    /api/departments                    - List departments (paginated)
POST   /api/departments                    - Create new department
GET    /api/departments/:id               - Get department details
PUT    /api/departments/:id               - Update department
DELETE /api/departments/:id               - Delete department
PUT    /api/departments/:id/head          - Assign department head
DELETE /api/departments/:id/head          - Remove department head
GET    /api/departments/:id/available-heads - Available employees
```

### Authentication

- All requests require valid JWT authentication token
- Admin role required for most operations
- Token automatically included in API calls

## Usage Examples

### Daily Operations

1. **Morning Review**: Check department statistics on dashboard
2. **New Department**: Use create form when new department needed
3. **Employee Changes**: Update department heads when promotions occur
4. **Quarterly Review**: Update budgets and locations as needed
5. **Reorganization**: Reassign employees before deleting departments

### Common Workflows

#### Creating a New Department

```
1. Navigate to /admin/departments
2. Click "Create Department"
3. Enter "Marketing" as department name
4. Add "Marketing and promotional activities" as description
5. Set status to "Active"
6. Enter "Building B, Floor 2" as location
7. Set budget to $75,000
8. Click "Create Department"
9. Success notification appears
10. Department appears in the list
```

#### Assigning Department Head

```
1. Find the department in the list
2. Click the user icon (Manage Department Head)
3. Review current head (if any)
4. Select new employee from available list
5. Click "Assign as Head"
6. Success notification appears
7. Department list updates with new head
```

#### Department Reorganization

```
1. Search for departments to reorganize
2. Edit each department to update details
3. Reassign employees to different departments (via Employee Management)
4. Update department heads as needed
5. Delete empty departments if necessary
6. Review final structure in statistics dashboard
```

## Troubleshooting

### Common Issues

#### Cannot Delete Department

**Error**: "Cannot delete department. X employees are assigned."
**Solution**:

1. Go to Employee Management
2. Reassign all employees to other departments
3. Return to Department Management
4. Try deletion again

#### Department Head Assignment Failed

**Error**: "Employee must belong to the department"
**Solution**:

1. Ensure the employee is assigned to the correct department
2. Use Employee Management to assign employee to department first
3. Return and try head assignment again

#### Search Not Working

**Issue**: Search results not appearing
**Solution**:

1. Check internet connection
2. Refresh the page
3. Clear search term and try again
4. Check browser console for errors

### Performance Tips

1. **Use Search**: Instead of scrolling through all departments
2. **Filter by Status**: Narrow down results when needed
3. **Pagination**: Don't load all departments at once
4. **Regular Cleanup**: Remove inactive departments periodically

## Technical Requirements

### Browser Compatibility

- **Chrome**: Version 90+
- **Firefox**: Version 85+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Network Requirements

- **Stable Internet**: For real-time updates
- **Backend Access**: Connection to API server on port 5003
- **WebSocket**: For live notifications (if implemented)

### Admin Permissions

- Must have "admin" role in the system
- Active user account
- Valid authentication token

## Integration with Other Modules

### Employee Management

- Departments appear in employee assignment dropdown
- Employee count automatically updated
- Department heads must be existing employees

### Reports

- Department-wise attendance reports
- Budget analysis by department
- Employee distribution reports

### Settings

- Department-specific configurations
- Organizational hierarchy setup
- Access control by department

## Best Practices

### Data Management

1. **Consistent Naming**: Use clear, descriptive department names
2. **Regular Updates**: Keep location and budget information current
3. **Description Standards**: Use consistent format for descriptions
4. **Status Management**: Properly mark inactive departments

### Security

1. **Regular Reviews**: Audit department access quarterly
2. **Head Assignments**: Ensure department heads have proper access
3. **Clean Permissions**: Remove access when departments are deleted

### Organization

1. **Logical Structure**: Group related departments together
2. **Clear Hierarchy**: Maintain proper reporting structure
3. **Contact Information**: Keep employee details updated
4. **Regular Maintenance**: Clean up unused departments

This comprehensive department management system provides dynamic, real-time control over organizational structure, enabling administrators to efficiently manage departments according to changing business requirements.
