"""
Quick API test script to verify backend functionality.
Run this after starting the server to test all endpoints.
"""

import requests
import json
from time import sleep

BASE_URL = "http://localhost:8000/api"

def print_response(response, title):
    """Pretty print API response."""
    print(f"\n{'='*60}")
    print(f"TEST: {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    print(f"{'='*60}\n")

def test_health():
    """Test health check endpoint."""
    response = requests.get(f"{BASE_URL}/health")
    print_response(response, "Health Check")
    return response.status_code == 200

def test_create_source():
    """Test creating RSS source."""
    data = {
        "name": "TechCrunch Test",
        "url": "https://techcrunch.com/feed/",
        "category": "technology"
    }
    response = requests.post(f"{BASE_URL}/rss-sources", json=data)
    print_response(response, "Create RSS Source")
    
    if response.status_code == 201:
        return response.json()["id"]
    return None

def test_list_sources():
    """Test listing RSS sources."""
    response = requests.get(f"{BASE_URL}/rss-sources")
    print_response(response, "List RSS Sources")
    return response.status_code == 200

def test_refresh_articles():
    """Test refreshing articles."""
    print("\n⏳ Refreshing articles (this may take a moment)...")
    response = requests.post(f"{BASE_URL}/articles/refresh")
    print_response(response, "Refresh Articles")
    return response.status_code == 200

def test_list_articles():
    """Test listing articles."""
    response = requests.get(f"{BASE_URL}/articles?limit=5")
    print_response(response, "List Articles")
    
    if response.status_code == 200:
        data = response.json()
        if data["items"]:
            return data["items"][0]["id"]
    return None

def test_get_article(article_id):
    """Test getting single article."""
    if not article_id:
        print("\n⚠️  Skipping article detail test (no articles found)")
        return False
    
    response = requests.get(f"{BASE_URL}/articles/{article_id}")
    print_response(response, f"Get Article {article_id}")
    return response.status_code == 200

def test_stats():
    """Test dashboard statistics."""
    response = requests.get(f"{BASE_URL}/stats")
    print_response(response, "Dashboard Statistics")
    return response.status_code == 200

def test_delete_source(source_id):
    """Test deleting RSS source."""
    if not source_id:
        print("\n⚠️  Skipping delete test (no source created)")
        return False
    
    response = requests.delete(f"{BASE_URL}/rss-sources/{source_id}")
    print_response(response, f"Delete RSS Source {source_id}")
    return response.status_code == 204

def run_all_tests():
    """Run all API tests."""
    print("\n" + "="*60)
    print("🚀 STARTING API TESTS")
    print("="*60)
    print("\nMake sure the backend is running at http://localhost:8000")
    print("Start with: uvicorn main:app --reload\n")
    
    input("Press Enter to start tests...")
    
    results = []
    
    # Test 1: Health Check
    results.append(("Health Check", test_health()))
    
    # Test 2: Create RSS Source
    source_id = test_create_source()
    results.append(("Create RSS Source", source_id is not None))
    
    # Test 3: List RSS Sources
    results.append(("List RSS Sources", test_list_sources()))
    
    # Test 4: Refresh Articles
    results.append(("Refresh Articles", test_refresh_articles()))
    sleep(1)  # Give it a moment
    
    # Test 5: List Articles
    article_id = test_list_articles()
    results.append(("List Articles", article_id is not None))
    
    # Test 6: Get Article Detail
    results.append(("Get Article Detail", test_get_article(article_id)))
    
    # Test 7: Dashboard Stats
    results.append(("Dashboard Stats", test_stats()))
    
    # Test 8: Delete RSS Source
    results.append(("Delete RSS Source", test_delete_source(source_id)))
    
    # Print Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Backend is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
    
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        run_all_tests()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to backend.")
        print("Make sure the server is running:")
        print("  cd backend")
        print("  uvicorn main:app --reload")
        print("\nThen run this test script again.\n")
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user.\n")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
