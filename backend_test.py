#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Gobchat
Tests all endpoints with realistic data for a mesh chat application
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Configuration
BASE_URL = "https://nearby-gobchat.preview.emergentagent.com/api"
TIMEOUT = 30

class GobchatAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        
        # Test data - realistic for a mesh chat app
        self.test_users = [
            {"username": "alice_mesh", "device_id": f"device_{uuid.uuid4()}"},
            {"username": "bob_outdoor", "device_id": f"device_{uuid.uuid4()}"},
            {"username": "charlie_hiker", "device_id": f"device_{uuid.uuid4()}"}
        ]
        
        self.test_messages = [
            {
                "text": "Hey everyone! Just set up my mesh node at the campsite",
                "sender_id": "",  # Will be filled with device_id
                "username": "alice_mesh",
                "message_type": "text",
                "room_id": "global"
            },
            {
                "text": "Great! I can see your node from the hiking trail",
                "sender_id": "",
                "username": "bob_outdoor", 
                "message_type": "text",
                "room_id": "global"
            },
            {
                "text": "Perfect for off-grid communication! 📡",
                "sender_id": "",
                "username": "charlie_hiker",
                "message_type": "text", 
                "room_id": "global"
            }
        ]
        
        self.test_nodes = [
            {
                "device_id": "",  # Will be filled
                "username": "alice_mesh",
                "ip_address": "192.168.1.100",
                "connection_type": "mesh"
            },
            {
                "device_id": "",
                "username": "bob_outdoor",
                "ip_address": "192.168.1.101", 
                "connection_type": "wifi_direct"
            },
            {
                "device_id": "",
                "username": "charlie_hiker",
                "connection_type": "bluetooth"
            }
        ]

    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and data.get("service") == "gobchat-api":
                    self.log_test("Health Check", True, "Service is healthy", data)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
        
        return False

    def test_user_registration(self):
        """Test user registration endpoint"""
        success_count = 0
        
        for i, user_data in enumerate(self.test_users):
            try:
                response = self.session.post(
                    f"{self.base_url}/users",
                    json=user_data,
                    timeout=TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if (data.get("username") == user_data["username"] and 
                        data.get("device_id") == user_data["device_id"] and
                        data.get("is_online") == True):
                        self.log_test(f"User Registration - {user_data['username']}", True, 
                                    f"User registered successfully", data)
                        success_count += 1
                    else:
                        self.log_test(f"User Registration - {user_data['username']}", False, 
                                    f"Invalid response data: {data}")
                else:
                    self.log_test(f"User Registration - {user_data['username']}", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test(f"User Registration - {user_data['username']}", False, 
                            f"Request failed: {str(e)}")
        
        return success_count == len(self.test_users)

    def test_get_online_users(self):
        """Test getting online users"""
        try:
            response = self.session.get(f"{self.base_url}/users", timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.test_users):
                    # Check if our test users are in the list
                    usernames = [user.get("username") for user in data]
                    test_usernames = [user["username"] for user in self.test_users]
                    
                    if all(username in usernames for username in test_usernames):
                        self.log_test("Get Online Users", True, 
                                    f"Retrieved {len(data)} users including test users", data)
                        return True
                    else:
                        self.log_test("Get Online Users", False, 
                                    f"Test users not found in response: {usernames}")
                else:
                    self.log_test("Get Online Users", False, 
                                f"Invalid response format or insufficient users: {data}")
            else:
                self.log_test("Get Online Users", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Online Users", False, f"Request failed: {str(e)}")
        
        return False

    def test_user_status_update(self):
        """Test updating user status"""
        success_count = 0
        
        for user_data in self.test_users:
            try:
                # Test setting offline
                response = self.session.put(
                    f"{self.base_url}/users/{user_data['device_id']}/status",
                    params={"is_online": False},
                    timeout=TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "updated":
                        # Test setting back online
                        response2 = self.session.put(
                            f"{self.base_url}/users/{user_data['device_id']}/status",
                            params={"is_online": True},
                            timeout=TIMEOUT
                        )
                        
                        if response2.status_code == 200:
                            self.log_test(f"User Status Update - {user_data['username']}", True, 
                                        "Status updated successfully")
                            success_count += 1
                        else:
                            self.log_test(f"User Status Update - {user_data['username']}", False, 
                                        f"Failed to set online: HTTP {response2.status_code}")
                    else:
                        self.log_test(f"User Status Update - {user_data['username']}", False, 
                                    f"Invalid response: {data}")
                else:
                    self.log_test(f"User Status Update - {user_data['username']}", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test(f"User Status Update - {user_data['username']}", False, 
                            f"Request failed: {str(e)}")
        
        return success_count == len(self.test_users)

    def test_send_messages(self):
        """Test sending messages"""
        success_count = 0
        
        # Fill sender_id with device_id from test users
        for i, message in enumerate(self.test_messages):
            message["sender_id"] = self.test_users[i]["device_id"]
        
        for message_data in self.test_messages:
            try:
                response = self.session.post(
                    f"{self.base_url}/messages",
                    json=message_data,
                    timeout=TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if (data.get("text") == message_data["text"] and 
                        data.get("sender_id") == message_data["sender_id"] and
                        data.get("username") == message_data["username"]):
                        self.log_test(f"Send Message - {message_data['username']}", True, 
                                    f"Message sent successfully", data)
                        success_count += 1
                    else:
                        self.log_test(f"Send Message - {message_data['username']}", False, 
                                    f"Invalid response data: {data}")
                else:
                    self.log_test(f"Send Message - {message_data['username']}", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Send Message - {message_data['username']}", False, 
                            f"Request failed: {str(e)}")
        
        return success_count == len(self.test_messages)

    def test_get_messages(self):
        """Test retrieving messages"""
        try:
            response = self.session.get(f"{self.base_url}/messages", timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.test_messages):
                    # Check if our test messages are in the response
                    message_texts = [msg.get("text") for msg in data]
                    test_texts = [msg["text"] for msg in self.test_messages]
                    
                    if all(text in message_texts for text in test_texts):
                        self.log_test("Get Messages", True, 
                                    f"Retrieved {len(data)} messages including test messages", data)
                        return True
                    else:
                        self.log_test("Get Messages", False, 
                                    f"Test messages not found in response")
                else:
                    self.log_test("Get Messages", False, 
                                f"Invalid response format or insufficient messages: {data}")
            else:
                self.log_test("Get Messages", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Messages", False, f"Request failed: {str(e)}")
        
        return False

    def test_mesh_node_registration(self):
        """Test mesh node registration"""
        success_count = 0
        
        # Fill device_id from test users
        for i, node in enumerate(self.test_nodes):
            node["device_id"] = self.test_users[i]["device_id"]
        
        for node_data in self.test_nodes:
            try:
                response = self.session.post(
                    f"{self.base_url}/mesh/nodes",
                    json=node_data,
                    timeout=TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if (data.get("device_id") == node_data["device_id"] and 
                        data.get("username") == node_data["username"] and
                        data.get("connection_type") == node_data["connection_type"] and
                        data.get("is_active") == True):
                        self.log_test(f"Mesh Node Registration - {node_data['username']}", True, 
                                    f"Node registered successfully", data)
                        success_count += 1
                    else:
                        self.log_test(f"Mesh Node Registration - {node_data['username']}", False, 
                                    f"Invalid response data: {data}")
                else:
                    self.log_test(f"Mesh Node Registration - {node_data['username']}", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Mesh Node Registration - {node_data['username']}", False, 
                            f"Request failed: {str(e)}")
        
        return success_count == len(self.test_nodes)

    def test_get_mesh_nodes(self):
        """Test getting active mesh nodes"""
        try:
            response = self.session.get(f"{self.base_url}/mesh/nodes", timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.test_nodes):
                    # Check if our test nodes are in the list
                    device_ids = [node.get("device_id") for node in data]
                    test_device_ids = [node["device_id"] for node in self.test_nodes]
                    
                    if all(device_id in device_ids for device_id in test_device_ids):
                        self.log_test("Get Mesh Nodes", True, 
                                    f"Retrieved {len(data)} nodes including test nodes", data)
                        return True
                    else:
                        self.log_test("Get Mesh Nodes", False, 
                                    f"Test nodes not found in response")
                else:
                    self.log_test("Get Mesh Nodes", False, 
                                f"Invalid response format or insufficient nodes: {data}")
            else:
                self.log_test("Get Mesh Nodes", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Mesh Nodes", False, f"Request failed: {str(e)}")
        
        return False

    def test_mesh_node_ping(self):
        """Test pinging mesh nodes"""
        success_count = 0
        
        for node_data in self.test_nodes:
            try:
                response = self.session.put(
                    f"{self.base_url}/mesh/nodes/{node_data['device_id']}/ping",
                    timeout=TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "pinged":
                        self.log_test(f"Mesh Node Ping - {node_data['username']}", True, 
                                    "Node pinged successfully")
                        success_count += 1
                    else:
                        self.log_test(f"Mesh Node Ping - {node_data['username']}", False, 
                                    f"Invalid response: {data}")
                else:
                    self.log_test(f"Mesh Node Ping - {node_data['username']}", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Mesh Node Ping - {node_data['username']}", False, 
                            f"Request failed: {str(e)}")
        
        return success_count == len(self.test_nodes)

    def test_mesh_node_disconnect(self):
        """Test disconnecting mesh nodes"""
        success_count = 0
        
        for node_data in self.test_nodes:
            try:
                response = self.session.delete(
                    f"{self.base_url}/mesh/nodes/{node_data['device_id']}",
                    timeout=TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "disconnected":
                        self.log_test(f"Mesh Node Disconnect - {node_data['username']}", True, 
                                    "Node disconnected successfully")
                        success_count += 1
                    else:
                        self.log_test(f"Mesh Node Disconnect - {node_data['username']}", False, 
                                    f"Invalid response: {data}")
                else:
                    self.log_test(f"Mesh Node Disconnect - {node_data['username']}", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Mesh Node Disconnect - {node_data['username']}", False, 
                            f"Request failed: {str(e)}")
        
        return success_count == len(self.test_nodes)

    def test_clear_messages(self):
        """Test clearing messages"""
        try:
            response = self.session.delete(f"{self.base_url}/messages", timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                if "deleted_count" in data:
                    self.log_test("Clear Messages", True, 
                                f"Cleared {data['deleted_count']} messages", data)
                    return True
                else:
                    self.log_test("Clear Messages", False, f"Invalid response format: {data}")
            else:
                self.log_test("Clear Messages", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Clear Messages", False, f"Request failed: {str(e)}")
        
        return False

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Gobchat Backend API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("Get Online Users", self.test_get_online_users),
            ("User Status Update", self.test_user_status_update),
            ("Send Messages", self.test_send_messages),
            ("Get Messages", self.test_get_messages),
            ("Mesh Node Registration", self.test_mesh_node_registration),
            ("Get Mesh Nodes", self.test_get_mesh_nodes),
            ("Mesh Node Ping", self.test_mesh_node_ping),
            ("Mesh Node Disconnect", self.test_mesh_node_disconnect),
            ("Clear Messages", self.test_clear_messages)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running {test_name}...")
            if test_func():
                passed += 1
            time.sleep(1)  # Brief pause between tests
        
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Gobchat API is working correctly.")
        else:
            print(f"⚠️  {total - passed} tests failed. Check the details above.")
        
        return passed == total

    def print_summary(self):
        """Print detailed test summary"""
        print("\n" + "=" * 60)
        print("📋 DETAILED TEST SUMMARY")
        print("=" * 60)
        
        passed_tests = [t for t in self.test_results if t["success"]]
        failed_tests = [t for t in self.test_results if not t["success"]]
        
        print(f"\n✅ PASSED TESTS ({len(passed_tests)}):")
        for test in passed_tests:
            print(f"  • {test['test']}: {test['details']}")
        
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        print(f"\n📈 Overall Success Rate: {len(passed_tests)}/{len(self.test_results)} ({len(passed_tests)/len(self.test_results)*100:.1f}%)")


if __name__ == "__main__":
    tester = GobchatAPITester()
    success = tester.run_all_tests()
    tester.print_summary()
    
    # Exit with appropriate code
    exit(0 if success else 1)