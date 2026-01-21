#!/usr/bin/env python3
"""
Walleta Backend API Testing Suite
Tests all backend endpoints for the Finnish personal finance management app
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class WalletaAPITester:
    def __init__(self, base_url="https://money-tracker-2300.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_user = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@walleta.fi",
            "password": "TestPass123!"
        }

    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED")
        else:
            print(f"❌ {test_name}: FAILED - {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make API request with error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, data = self.make_request('GET', '')
        self.log_result("Root endpoint", success, 
                       "" if success else f"Status: {data.get('status_code', 'unknown')}")
        
        # Test health endpoint
        success, data = self.make_request('GET', 'health')
        self.log_result("Health check", success,
                       "" if success else f"Status: {data.get('status_code', 'unknown')}")

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        success, data = self.make_request('POST', 'auth/register', self.test_user)
        
        if success and 'token' in data and 'user' in data:
            self.token = data['token']
            self.user_id = data['user']['id']
            self.log_result("User registration", True, f"User ID: {self.user_id}")
        else:
            self.log_result("User registration", False, 
                           f"Missing token or user data: {data}")
            return False
        
        return True

    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        success, data = self.make_request('POST', 'auth/login', login_data)
        
        if success and 'token' in data:
            self.log_result("User login", True)
        else:
            self.log_result("User login", False, f"Login failed: {data}")
            return False
        
        return True

    def test_get_current_user(self):
        """Test get current user info"""
        print("\n🔍 Testing Get Current User...")
        
        success, data = self.make_request('GET', 'auth/me')
        
        if success and 'id' in data and data['id'] == self.user_id:
            self.log_result("Get current user", True)
        else:
            self.log_result("Get current user", False, f"User data mismatch: {data}")

    def test_expense_operations(self):
        """Test expense CRUD operations"""
        print("\n🔍 Testing Expense Operations...")
        
        # Get categories first
        success, categories = self.make_request('GET', 'categories')
        if not success or not categories:
            self.log_result("Get categories", False, "No categories available")
            return
        
        self.log_result("Get categories", True, f"Found {len(categories)} categories")
        
        # Create expense
        expense_data = {
            "amount": 25.50,
            "description": "Test ruokaostokset",
            "category": categories[0]["name"],
            "date": datetime.now().strftime("%Y-%m-%d")
        }
        
        success, expense = self.make_request('POST', 'expenses', expense_data)
        if success and 'id' in expense:
            expense_id = expense['id']
            self.log_result("Create expense", True, f"Expense ID: {expense_id}")
        else:
            self.log_result("Create expense", False, f"Failed to create: {expense}")
            return
        
        # Get expenses
        current_month = datetime.now().strftime("%Y-%m")
        success, expenses = self.make_request('GET', f'expenses?month={current_month}')
        if success and isinstance(expenses, list) and len(expenses) > 0:
            self.log_result("Get expenses", True, f"Found {len(expenses)} expenses")
        else:
            self.log_result("Get expenses", False, f"No expenses found: {expenses}")
        
        # Delete expense
        success, result = self.make_request('DELETE', f'expenses/{expense_id}')
        self.log_result("Delete expense", success, 
                       "" if success else f"Delete failed: {result}")

    def test_income_operations(self):
        """Test income CRUD operations"""
        print("\n🔍 Testing Income Operations...")
        
        # Create income
        income_data = {
            "amount": 3000.00,
            "description": "Test kuukausipalkka",
            "source": "salary",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "recurring": True
        }
        
        success, income = self.make_request('POST', 'incomes', income_data)
        if success and 'id' in income:
            income_id = income['id']
            self.log_result("Create income", True, f"Income ID: {income_id}")
        else:
            self.log_result("Create income", False, f"Failed to create: {income}")
            return
        
        # Get incomes
        current_month = datetime.now().strftime("%Y-%m")
        success, incomes = self.make_request('GET', f'incomes?month={current_month}')
        if success and isinstance(incomes, list) and len(incomes) > 0:
            self.log_result("Get incomes", True, f"Found {len(incomes)} incomes")
        else:
            self.log_result("Get incomes", False, f"No incomes found: {incomes}")
        
        # Delete income
        success, result = self.make_request('DELETE', f'incomes/{income_id}')
        self.log_result("Delete income", success,
                       "" if success else f"Delete failed: {result}")

    def test_budget_operations(self):
        """Test budget operations"""
        print("\n🔍 Testing Budget Operations...")
        
        # Create/update budget
        budget_data = {
            "amount": 1200.00,
            "month": datetime.now().strftime("%Y-%m")
        }
        
        success, budget = self.make_request('POST', 'budgets', budget_data, 201)
        if success and 'id' in budget:
            self.log_result("Create budget", True, f"Budget ID: {budget['id']}")
        else:
            self.log_result("Create budget", False, f"Failed to create: {budget}")
        
        # Get current budget
        success, current_budget = self.make_request('GET', 'budgets/current')
        if success and current_budget and 'amount' in current_budget:
            self.log_result("Get current budget", True, f"Amount: {current_budget['amount']}")
        else:
            self.log_result("Get current budget", False, f"No budget found: {current_budget}")
        
        # Get all budgets
        success, budgets = self.make_request('GET', 'budgets')
        if success and isinstance(budgets, list):
            self.log_result("Get all budgets", True, f"Found {len(budgets)} budgets")
        else:
            self.log_result("Get all budgets", False, f"Failed: {budgets}")

    def test_loan_operations(self):
        """Test loan CRUD operations"""
        print("\n🔍 Testing Loan Operations...")
        
        # Create loan
        loan_data = {
            "name": "Test Asuntolaina",
            "loan_type": "asuntolaina",
            "original_amount": 150000.00,
            "remaining_amount": 120000.00,
            "interest_rate": 3.5,
            "monthly_payment": 800.00,
            "start_date": "2023-01-01",
            "end_date": "2043-01-01"
        }
        
        success, loan = self.make_request('POST', 'loans', loan_data, 201)
        if success and 'id' in loan:
            loan_id = loan['id']
            self.log_result("Create loan", True, f"Loan ID: {loan_id}")
        else:
            self.log_result("Create loan", False, f"Failed to create: {loan}")
            return
        
        # Get loans
        success, loans = self.make_request('GET', 'loans')
        if success and isinstance(loans, list) and len(loans) > 0:
            self.log_result("Get loans", True, f"Found {len(loans)} loans")
        else:
            self.log_result("Get loans", False, f"No loans found: {loans}")
        
        # Update loan
        update_data = loan_data.copy()
        update_data["remaining_amount"] = 115000.00
        
        success, updated_loan = self.make_request('PUT', f'loans/{loan_id}', update_data)
        if success and 'remaining_amount' in updated_loan:
            self.log_result("Update loan", True, f"New amount: {updated_loan['remaining_amount']}")
        else:
            self.log_result("Update loan", False, f"Update failed: {updated_loan}")
        
        # Delete loan
        success, result = self.make_request('DELETE', f'loans/{loan_id}')
        self.log_result("Delete loan", success,
                       "" if success else f"Delete failed: {result}")

    def test_savings_operations(self):
        """Test savings goal CRUD operations"""
        print("\n🔍 Testing Savings Operations...")
        
        # Create savings goal
        savings_data = {
            "name": "Test Lomamatka",
            "target_amount": 5000.00,
            "current_amount": 1500.00,
            "target_date": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
            "icon": "plane"
        }
        
        success, savings = self.make_request('POST', 'savings', savings_data, 201)
        if success and 'id' in savings:
            savings_id = savings['id']
            self.log_result("Create savings goal", True, f"Savings ID: {savings_id}")
        else:
            self.log_result("Create savings goal", False, f"Failed to create: {savings}")
            return
        
        # Get savings goals
        success, goals = self.make_request('GET', 'savings')
        if success and isinstance(goals, list) and len(goals) > 0:
            self.log_result("Get savings goals", True, f"Found {len(goals)} goals")
        else:
            self.log_result("Get savings goals", False, f"No goals found: {goals}")
        
        # Update savings goal
        update_data = savings_data.copy()
        update_data["current_amount"] = 2000.00
        
        success, updated_savings = self.make_request('PUT', f'savings/{savings_id}', update_data)
        if success and 'current_amount' in updated_savings:
            self.log_result("Update savings goal", True, f"New amount: {updated_savings['current_amount']}")
        else:
            self.log_result("Update savings goal", False, f"Update failed: {updated_savings}")
        
        # Delete savings goal
        success, result = self.make_request('DELETE', f'savings/{savings_id}')
        self.log_result("Delete savings goal", success,
                       "" if success else f"Delete failed: {result}")

    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        print("\n🔍 Testing Dashboard Summary...")
        
        success, summary = self.make_request('GET', 'dashboard/summary')
        
        if success and isinstance(summary, dict):
            required_keys = ['budget', 'income', 'expenses', 'loans', 'savings', 'balance']
            missing_keys = [key for key in required_keys if key not in summary]
            
            if not missing_keys:
                self.log_result("Dashboard summary", True, f"All sections present")
            else:
                self.log_result("Dashboard summary", False, f"Missing keys: {missing_keys}")
        else:
            self.log_result("Dashboard summary", False, f"Invalid response: {summary}")

    def test_stripe_payment_flow(self):
        """Test Stripe payment integration"""
        print("\n🔍 Testing Stripe Payment Flow...")
        
        # Test checkout session creation
        checkout_data = {
            "origin_url": "https://money-tracker-2300.preview.emergentagent.com"
        }
        
        success, checkout_response = self.make_request('POST', 'payments/checkout', checkout_data)
        
        if success and 'url' in checkout_response and 'session_id' in checkout_response:
            session_id = checkout_response['session_id']
            self.log_result("Create checkout session", True, f"Session ID: {session_id}")
            
            # Test payment status check
            success, status_response = self.make_request('GET', f'payments/status/{session_id}')
            if success and 'status' in status_response:
                self.log_result("Check payment status", True, f"Status: {status_response['status']}")
            else:
                self.log_result("Check payment status", False, f"Status check failed: {status_response}")
        else:
            self.log_result("Create checkout session", False, f"Checkout failed: {checkout_response}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Walleta Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Health checks
        self.test_health_check()
        
        # Authentication flow
        if not self.test_user_registration():
            print("❌ Registration failed, stopping tests")
            return False
        
        if not self.test_user_login():
            print("❌ Login failed, stopping tests")
            return False
        
        self.test_get_current_user()
        
        # Core functionality tests
        self.test_expense_operations()
        self.test_income_operations()
        self.test_budget_operations()
        self.test_loan_operations()
        self.test_savings_operations()
        self.test_dashboard_summary()
        
        # Payment integration
        self.test_stripe_payment_flow()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("✅ Backend API tests mostly successful!")
            return True
        else:
            print("❌ Backend API has significant issues")
            return False

    def get_test_summary(self):
        """Get test summary for reporting"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    """Main test execution"""
    tester = WalletaAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    summary = tester.get_test_summary()
    with open('/tmp/backend_test_results.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())