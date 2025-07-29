#!/usr/bin/env python3
"""
Test script for the gifts API endpoints.
"""

import asyncio
import json
from eth_account import Account
from eth_account.messages import encode_defunct
import requests

# Test wallet (same as before)
test_private_key = "0x" + "1" * 64
test_account = Account.from_key(test_private_key)
TEST_WALLET = test_account.address

print(f"Test wallet address: {TEST_WALLET}")

async def test_gifts_api():
    """Test the gifts API endpoints."""
    
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
    
    # Step 2: Test gift creation
    print("\n=== Step 2: Create Gift ===")
    import time
    unique_escrow_id = f"gift_{int(time.time())}"
    gift_data = {
        "recipient_address": "0x742d35Cc6634C0532925a3b8D8C12bFA3B0D9e2d",
        "escrow_id": unique_escrow_id,
        "lat": 40.7831,
        "lon": -73.9712,
        "message": "Happy Birthday! Find this gift in Central Park!"
    }
    
    create_response = requests.post(
        "http://localhost:8000/api/v1/gifts/",
        json=gift_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(f"Create gift status: {create_response.status_code}")
    if create_response.status_code == 201:
        created_gift = create_response.json()
        print(f"Gift created successfully!")
        print(f"Gift ID: {created_gift['id']}")
        print(f"Escrow ID: {created_gift['escrow_id']}")
        gift_id = created_gift['id']
        escrow_id = created_gift['escrow_id']
        
        # Step 3: Test get gift by ID
        print("\n=== Step 3: Get Gift by ID ===")
        get_response = requests.get(f"http://localhost:8000/api/v1/gifts/{gift_id}")
        print(f"Get gift status: {get_response.status_code}")
        if get_response.status_code == 200:
            print("Gift retrieved successfully!")
            
        # Step 4: Test get gift by escrow ID
        print("\n=== Step 4: Get Gift by Escrow ID ===")
        escrow_response = requests.get(f"http://localhost:8000/api/v1/gifts/escrow/{escrow_id}")
        print(f"Get gift by escrow status: {escrow_response.status_code}")
        if escrow_response.status_code == 200:
            print("Gift retrieved by escrow ID successfully!")
            
        # Step 5: Test get user gifts
        print("\n=== Step 5: Get User Gifts ===")
        user_response = requests.get(f"http://localhost:8000/api/v1/gifts/user/{TEST_WALLET}")
        print(f"Get user gifts status: {user_response.status_code}")
        if user_response.status_code == 200:
            user_gifts = user_response.json()
            print(f"User has {len(user_gifts)} gifts")
            
    else:
        print(f"Gift creation failed: {create_response.text}")

if __name__ == "__main__":
    asyncio.run(test_gifts_api())