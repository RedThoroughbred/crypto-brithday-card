# Testing New User Gifts - Quick Guide

## 🚨 **ROOT CAUSE OF HIGH GAS FEES**

The transaction is failing because **GGT tokens need approval first**. The high gas fee (0.0315 ETH) is MetaMask estimating a failed transaction.

## ✅ **SOLUTION: Manual GGT Approval**

Before creating new user gifts, you need to approve GGT tokens:

### Step 1: Approve GGT Tokens

**Option A: Using Etherscan (Recommended)**
1. Go to: https://sepolia.etherscan.io/address/0x1775997EE682CCab7c6443168d63D2605922C633#writeContract
2. Connect your wallet
3. Find `approve` function
4. Enter:
   - `spender`: `0x9fAE6c354C7514d19Ad2029f7Adc534A31eac712` (our contract)
   - `value`: `1000000000000000000000` (1000 GGT tokens)
5. Click "Write" and confirm transaction

**Option B: Using Frontend (Future Enhancement)**
- We'll add an approval button to the UI later

### Step 2: Create New User Gift

1. Go to: http://localhost:3000/create
2. Click "Send to New User" tab
3. Fill out the form (100 GGT default)
4. Click "Create New User Gift"
5. Should now work with normal gas fees!

## 🔍 **Debugging Info**

**Contract Addresses:**
- GGT Token: `0x1775997EE682CCab7c6443168d63D2605922C633`
- NewUserGiftEscrowGGT: `0x9fAE6c354C7514d19Ad2029f7Adc534A31eac712`

**Test Parameters:**
- Amount: 100 GGT (modify as needed)
- Unlock Type: Simple (no additional challenge)
- Expiry: 7 days default

## 🎯 **Expected Results**

After approval:
- Transaction should cost normal gas (~0.001-0.005 ETH)
- Success modal should appear with claim code
- Email template should be generated
- Claim URL should be functional

## 🐛 **If Still Issues**

Check console for:
- `NewUserGiftForm - Submitting:` (form data)
- `Contract params:` (prepared parameters)
- `NewUserGiftForm state:` (hook state)

The form validation issue was also fixed - GPS console logs were from the main form, not new user form.