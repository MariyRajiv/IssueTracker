import requests
import sys
import json
import io
from datetime import datetime

class IssueTrackerAPITester:
    def __init__(self, base_url="https://issue-tracker-176.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.created_labels = []
        self.created_issues = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")

    def make_request(self, method, endpoint, data=None, files=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = self.headers.copy()
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if files:
                # Remove Content-Type for file uploads
                headers.pop('Content-Type', None)
                response = requests.request(method, url, headers=headers, files=files)
            else:
                response = requests.request(method, url, headers=headers, json=data)
            
            success = response.status_code == expected_status
            return success, response
        except Exception as e:
            print(f"Request error: {str(e)}")
            return False, None

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "username": f"testuser_{timestamp}",
            "password": "TestPass123!",
            "full_name": f"Test User {timestamp}"
        }
        
        success, response = self.make_request('POST', 'auth/register', user_data, expected_status=201)
        
        if success:
            data = response.json()
            self.token = data.get('access_token')
            self.user_id = data.get('user', {}).get('id')
            self.log_test("User Registration", True, f"- Token received, User ID: {self.user_id}")
            return user_data
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("User Registration", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return None

    def test_login(self, user_data):
        """Test user login"""
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data)
        
        if success:
            data = response.json()
            self.token = data.get('access_token')
            self.log_test("User Login", True, "- Token received")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("User Login", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.make_request('GET', 'auth/me')
        
        if success:
            data = response.json()
            self.log_test("Get Current User", True, f"- User: {data.get('username')}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Get Current User", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return False

    def test_get_users(self):
        """Test get users list"""
        success, response = self.make_request('GET', 'users')
        
        if success:
            data = response.json()
            self.log_test("Get Users List", True, f"- Found {len(data)} users")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Get Users List", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return False

    def test_create_labels(self):
        """Test creating labels"""
        labels_data = [
            {"name": "Bug", "color": "#ff0000"},
            {"name": "Feature", "color": "#00ff00"},
            {"name": "Enhancement", "color": "#0000ff"}
        ]
        
        for label_data in labels_data:
            success, response = self.make_request('POST', 'labels', label_data, expected_status=201)
            
            if success:
                data = response.json()
                self.created_labels.append(data)
                self.log_test(f"Create Label '{label_data['name']}'", True, f"- ID: {data.get('id')}")
            else:
                error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
                self.log_test(f"Create Label '{label_data['name']}'", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

    def test_get_labels(self):
        """Test get labels list"""
        success, response = self.make_request('GET', 'labels')
        
        if success:
            data = response.json()
            self.log_test("Get Labels List", True, f"- Found {len(data)} labels")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Get Labels List", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return False

    def test_create_issues(self):
        """Test creating issues"""
        issues_data = [
            {
                "title": "Critical Bug in Login",
                "description": "Users cannot login to the system",
                "status": "open",
                "priority": "critical",
                "assignee_id": self.user_id,
                "label_ids": [self.created_labels[0]['id']] if self.created_labels else []
            },
            {
                "title": "Add Dark Mode Feature",
                "description": "Implement dark mode for better user experience",
                "status": "open",
                "priority": "medium",
                "assignee_id": self.user_id,
                "label_ids": [self.created_labels[1]['id']] if len(self.created_labels) > 1 else []
            },
            {
                "title": "Performance Enhancement",
                "description": "Optimize database queries",
                "status": "in_progress",
                "priority": "high",
                "assignee_id": self.user_id,
                "label_ids": [self.created_labels[2]['id']] if len(self.created_labels) > 2 else []
            },
            {
                "title": "UI Improvement",
                "description": "Improve button styling",
                "status": "resolved",
                "priority": "low",
                "assignee_id": self.user_id,
                "label_ids": []
            },
            {
                "title": "Documentation Update",
                "description": "Update API documentation",
                "status": "closed",
                "priority": "medium",
                "assignee_id": self.user_id,
                "label_ids": []
            }
        ]
        
        for issue_data in issues_data:
            success, response = self.make_request('POST', 'issues', issue_data, expected_status=201)
            
            if success:
                data = response.json()
                self.created_issues.append(data)
                self.log_test(f"Create Issue '{issue_data['title']}'", True, f"- ID: {data.get('id')}, Status: {data.get('status')}")
            else:
                error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
                self.log_test(f"Create Issue '{issue_data['title']}'", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

    def test_list_issues(self):
        """Test listing issues with filters"""
        # Test basic list
        success, response = self.make_request('GET', 'issues')
        if success:
            data = response.json()
            self.log_test("List All Issues", True, f"- Found {len(data)} issues")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("List All Issues", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

        # Test filter by status
        success, response = self.make_request('GET', 'issues?status=open')
        if success:
            data = response.json()
            self.log_test("Filter Issues by Status (open)", True, f"- Found {len(data)} open issues")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Filter Issues by Status (open)", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

        # Test filter by priority
        success, response = self.make_request('GET', 'issues?priority=high')
        if success:
            data = response.json()
            self.log_test("Filter Issues by Priority (high)", True, f"- Found {len(data)} high priority issues")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Filter Issues by Priority (high)", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

    def test_get_issue_detail(self):
        """Test getting issue detail"""
        if not self.created_issues:
            self.log_test("Get Issue Detail", False, "- No issues created to test")
            return False

        issue_id = self.created_issues[0]['id']
        success, response = self.make_request('GET', f'issues/{issue_id}')
        
        if success:
            data = response.json()
            self.log_test("Get Issue Detail", True, f"- Issue ID: {issue_id}, Title: {data.get('title')}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Get Issue Detail", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return False

    def test_update_issue_version_control(self):
        """Test updating issue with version control"""
        if not self.created_issues:
            self.log_test("Update Issue (Version Control)", False, "- No issues created to test")
            return False

        issue = self.created_issues[0]
        issue_id = issue['id']
        current_version = issue['version']
        
        # Test successful update with correct version
        update_data = {
            "title": "Updated Critical Bug in Login",
            "version": current_version
        }
        
        success, response = self.make_request('PATCH', f'issues/{issue_id}', update_data)
        
        if success:
            data = response.json()
            self.log_test("Update Issue (Correct Version)", True, f"- New version: {data.get('version')}")
            
            # Test version conflict
            conflict_data = {
                "title": "This should fail",
                "version": current_version  # Using old version
            }
            
            success_conflict, response_conflict = self.make_request('PATCH', f'issues/{issue_id}', conflict_data, expected_status=409)
            
            if success_conflict:
                self.log_test("Update Issue (Version Conflict)", True, "- Correctly rejected with 409")
            else:
                self.log_test("Update Issue (Version Conflict)", False, f"- Expected 409, got {response_conflict.status_code if response_conflict else 'N/A'}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Update Issue (Correct Version)", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

    def test_add_comments(self):
        """Test adding comments to issues"""
        if not self.created_issues:
            self.log_test("Add Comments", False, "- No issues created to test")
            return False

        issue_id = self.created_issues[0]['id']
        comment_data = {
            "body": "This is a test comment for the issue"
        }
        
        success, response = self.make_request('POST', f'issues/{issue_id}/comments', comment_data, expected_status=201)
        
        if success:
            data = response.json()
            self.log_test("Add Comment", True, f"- Comment ID: {data.get('id')}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Add Comment", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return False

    def test_replace_labels(self):
        """Test replacing issue labels"""
        if not self.created_issues or not self.created_labels:
            self.log_test("Replace Labels", False, "- No issues or labels created to test")
            return False

        issue_id = self.created_issues[0]['id']
        label_ids = [label['id'] for label in self.created_labels[:2]]  # Use first 2 labels
        
        success, response = self.make_request('PUT', f'issues/{issue_id}/labels', label_ids)
        
        if success:
            data = response.json()
            self.log_test("Replace Issue Labels", True, f"- Updated labels for issue {issue_id}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Replace Issue Labels", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return False

    def test_bulk_status_update(self):
        """Test bulk status update"""
        if len(self.created_issues) < 2:
            self.log_test("Bulk Status Update", False, "- Need at least 2 issues to test")
            return False

        # Test successful bulk update
        issue_ids = [issue['id'] for issue in self.created_issues[:3]]
        bulk_data = {
            "issue_ids": issue_ids,
            "status": "in_progress"
        }
        
        success, response = self.make_request('POST', 'issues/bulk-status', bulk_data)
        
        if success:
            data = response.json()
            self.log_test("Bulk Status Update (Valid)", True, f"- Updated {data.get('updated')} issues to {data.get('status')}")
            
            # Test bulk update with invalid ID (should rollback)
            invalid_bulk_data = {
                "issue_ids": [99999, issue_ids[0]],  # Invalid ID + valid ID
                "status": "closed"
            }
            
            success_invalid, response_invalid = self.make_request('POST', 'issues/bulk-status', invalid_bulk_data, expected_status=400)
            
            if success_invalid:
                self.log_test("Bulk Status Update (Invalid ID)", True, "- Correctly rejected with 400")
            else:
                self.log_test("Bulk Status Update (Invalid ID)", False, f"- Expected 400, got {response_invalid.status_code if response_invalid else 'N/A'}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Bulk Status Update (Valid)", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

    def test_csv_import(self):
        """Test CSV import functionality"""
        # Create test CSV content
        csv_content = """title,description,status,priority,assignee_email
Valid Issue 1,This is a valid issue,open,high,
Valid Issue 2,Another valid issue,in_progress,medium,
Invalid Issue,,open,invalid_priority,
,Missing title,open,low,"""
        
        csv_file = io.StringIO(csv_content)
        files = {'file': ('test_issues.csv', csv_file.getvalue(), 'text/csv')}
        
        success, response = self.make_request('POST', 'issues/import', files=files)
        
        if success:
            data = response.json()
            self.log_test("CSV Import", True, f"- Total: {data.get('total_rows')}, Success: {data.get('successful')}, Failed: {data.get('failed')}")
            if data.get('errors'):
                print(f"   Import errors: {len(data['errors'])} rows failed")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("CSV Import", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return False

    def test_issue_timeline(self):
        """Test getting issue timeline"""
        if not self.created_issues:
            self.log_test("Issue Timeline", False, "- No issues created to test")
            return False

        issue_id = self.created_issues[0]['id']
        success, response = self.make_request('GET', f'issues/{issue_id}/timeline')
        
        if success:
            data = response.json()
            self.log_test("Issue Timeline", True, f"- Found {len(data)} timeline entries")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Issue Timeline", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return False

    def test_reports(self):
        """Test reports endpoints"""
        # Test top assignees
        success, response = self.make_request('GET', 'reports/top-assignees')
        if success:
            data = response.json()
            self.log_test("Top Assignees Report", True, f"- Found {len(data)} assignees")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Top Assignees Report", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

        # Test resolution time stats
        success, response = self.make_request('GET', 'reports/resolution-time')
        if success:
            data = response.json()
            self.log_test("Resolution Time Report", True, f"- Total resolved: {data.get('total_resolved')}, Avg hours: {data.get('average_resolution_hours')}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Resolution Time Report", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.make_request('GET', 'stats/dashboard')
        
        if success:
            data = response.json()
            self.log_test("Dashboard Stats", True, f"- Total issues: {data.get('total_issues')}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Dashboard Stats", False, f"- Status: {response.status_code if response else 'N/A'}, Error: {error_msg}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Issue Tracker API Tests")
        print("=" * 50)
        
        # Authentication flow
        print("\n📋 Testing Authentication Flow")
        user_data = self.test_register()
        if not user_data:
            print("❌ Registration failed, stopping tests")
            return False
        
        if not self.test_login(user_data):
            print("❌ Login failed, stopping tests")
            return False
        
        self.test_get_me()
        
        # Users and Labels
        print("\n📋 Testing Users and Labels")
        self.test_get_users()
        self.test_create_labels()
        self.test_get_labels()
        
        # Issue Management
        print("\n📋 Testing Issue Management")
        self.test_create_issues()
        self.test_list_issues()
        self.test_get_issue_detail()
        self.test_update_issue_version_control()
        
        # Comments and Labels
        print("\n📋 Testing Comments and Labels")
        self.test_add_comments()
        self.test_replace_labels()
        
        # Bulk Operations
        print("\n📋 Testing Bulk Operations")
        self.test_bulk_status_update()
        
        # CSV Import
        print("\n📋 Testing CSV Import")
        self.test_csv_import()
        
        # Timeline and Reports
        print("\n📋 Testing Timeline and Reports")
        self.test_issue_timeline()
        self.test_reports()
        self.test_dashboard_stats()
        
        # Final results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = IssueTrackerAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())