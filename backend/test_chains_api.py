#!/usr/bin/env python3
"""
Test script for the chains API endpoints.
"""

import asyncio
import json
from eth_account import Account
from eth_account.messages import encode_defunct
import requests
import time

# Test wallet (same as before)
test_private_key = "0x" + "1" * 64
test_account = Account.from_key(test_private_key)
TEST_WALLET = test_account.address

print(f"Test wallet address: {TEST_WALLET}")

async def test_chains_api():
    """Test the chains API endpoints."""
    
    # Step 1: Authenticate to get a token
    print("\n=== Step 1: Authenticate ===")
    challenge_response = requests.post(
        "http://localhost:8000/api/v1/auth/challenge",
        json={"wallet_address": TEST_WALLET}
    )
    
    if challenge_response.status_code != 201:
        print(f"Challenge failed: {challenge_response.status_code}")
        print(challenge_response.text)
        return
    
    challenge_data = challenge_response.json()
    print(f"Challenge received")
    
    # Sign the message
    message = challenge_data['message']
    encoded_message = encode_defunct(text=message)
    signed_message = test_account.sign_message(encoded_message)
    signature = "0x" + signed_message.signature.hex()
    
    # Verify signature with backend
    verify_response = requests.post(
        "http://localhost:8000/api/v1/auth/verify",
        json={
            "wallet_address": TEST_WALLET,
            "signature": signature,
            "nonce": challenge_data['nonce']
        }
    )
    
    if verify_response.status_code != 200:
        print(f"Authentication failed: {verify_response.status_code}")
        print(verify_response.text)
        return
    
    auth_data = verify_response.json()
    token = auth_data['access_token']
    print(f"Authentication successful!")
    
    # Step 2: Test chain creation
    print("\n=== Step 2: Create Chain ===")
    chain_data = {
        "chain_title": "Test Multi-Step Adventure",
        "chain_description": "A fun treasure hunt in NYC",
        "recipient_address": "0x742d35Cc6634C0532925a3b8D8C12bFA3B0D9e2d",
        "recipient_email": "test@example.com",
        "total_value": "100",
        "expiry_days": 30,
        "steps": [
            {
                "step_index": 0,
                "step_title": "First Treasure",
                "step_message": "Find the hidden gem in Central Park",
                "unlock_type": 0,  # GPS
                "unlock_data": None,
                "latitude": 40.7831,
                "longitude": -73.9712,
                "radius": 50,
                "step_value": "50"
            },
            {
                "step_index": 1,
                "step_title": "Final Prize",
                "step_message": "Complete the adventure at Times Square",
                "unlock_type": 0,  # GPS
                "unlock_data": None,
                "latitude": 40.7580,
                "longitude": -73.9855,
                "radius": 100,
                "step_value": "50"
            }
        ],
        "blockchain_chain_id": int(time.time()),
        "transaction_hash": f"0x{hex(int(time.time()))[2:].zfill(64)}"
    }
    
    create_response = requests.post(
        "http://localhost:8000/api/v1/chains/",
        json=chain_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(f"Create chain status: {create_response.status_code}")
    if create_response.status_code == 201:
        created_chain = create_response.json()
        print(f"Chain created successfully!")
        print(f"Chain ID: {created_chain['id']}")
        print(f"Chain Title: {created_chain['chain_title']}")
        print(f"Total Steps: {created_chain['total_steps']}")
        chain_id = created_chain['id']
        
        # Step 3: Test get chain by ID
        print("\n=== Step 3: Get Chain by ID ===")
        get_response = requests.get(f"http://localhost:8000/api/v1/chains/{chain_id}")
        print(f"Get chain status: {get_response.status_code}")
        if get_response.status_code == 200:
            print("Chain retrieved successfully!")
            
        # Step 4: Test list chains
        print("\n=== Step 4: List Chains ===")
        list_response = requests.get(f"http://localhost:8000/api/v1/chains/")
        print(f"List chains status: {list_response.status_code}")
        if list_response.status_code == 200:
            chains = list_response.json()
            print(f"Found {chains['total']} chains")
            
    else:
        print(f"Chain creation failed: {create_response.text}")

if __name__ == "__main__":
    asyncio.run(test_chains_api())