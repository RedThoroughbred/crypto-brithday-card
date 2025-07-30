# Profile API Integration Plan

> Comprehensive plan for integrating the profile page with real backend APIs to replace mock data with persistent user profile information.

## 🎯 **Objective**

Integrate the profile page with real backend APIs to replace mock data with persistent user profile information, enabling users to customize their identity, manage settings, and track personal achievements.

## 📊 **Current Analysis**

### **✅ What We Have:**
- **Existing User Model**: Basic User table with `wallet_address`, `created_at`, timestamps
- **Web3 Authentication**: Complete JWT-based auth system working with challenge-response flow  
- **Profile Frontend**: Dark-themed profile page with tabs for Profile, Settings, Achievements
- **Mock Data Structure**: Display name, bio, favorite location, notification preferences
- **Dashboard Integration**: Real gift/chain statistics already working via API

### **🔧 What We Need:**
- **Extended User Profile Fields**: Add profile-specific columns to users table
- **Profile API Endpoints**: CRUD operations for user profile data
- **Achievement System**: Track user milestones and accomplishments based on real activity
- **Frontend Integration**: Replace mock data with real API calls using existing patterns

## 🗃️ **Database Strategy: Extend Existing Users Table**

### **Recommendation: Add Columns to Existing `users` Table**

**Why not create a separate table:**
- ✅ Maintains existing relationships (`gifts_sent`, `chains_created`)
- ✅ No additional JOINs needed for profile data
- ✅ Simpler data model and queries
- ✅ Wallet address already serves as unique identifier
- ✅ Consistent with existing architecture

### **New Profile Columns to Add:**

```sql
-- Personal Profile Fields
display_name VARCHAR(100) NULL,
bio TEXT NULL,  
favorite_location VARCHAR(200) NULL,
is_public_profile BOOLEAN DEFAULT FALSE,

-- Notification Preferences  
email_notifications BOOLEAN DEFAULT TRUE,
gift_notifications BOOLEAN DEFAULT TRUE,
marketing_emails BOOLEAN DEFAULT FALSE,

-- Achievement Tracking (for performance)
total_gifts_created INTEGER DEFAULT 0,
total_gifts_claimed INTEGER DEFAULT 0,
total_chains_created INTEGER DEFAULT 0,
first_gift_created_at TIMESTAMP NULL,
first_gift_claimed_at TIMESTAMP NULL,
last_activity_at TIMESTAMP NULL
```

### **Migration Considerations:**
- All new fields are nullable or have defaults
- Existing users get default values
- Can backfill achievement counters from existing gift/chain data
- Preserve existing `created_at` for "Member Since" functionality

## 🔗 **API Endpoints to Create**

### **1. Profile Management**
```python
GET    /api/v1/profile          # Get current user profile
PUT    /api/v1/profile          # Update profile information
```

**Profile Data Structure:**
```typescript
interface UserProfile {
  wallet_address: string;
  display_name: string | null;
  bio: string | null;
  favorite_location: string | null;
  is_public_profile: boolean;
  member_since: string; // created_at
  last_activity: string | null;
}
```

### **2. Notification Preferences**
```python
GET    /api/v1/profile/preferences     # Get notification settings
PUT    /api/v1/profile/preferences     # Update notification settings
```

**Preferences Data Structure:**
```typescript
interface NotificationPreferences {
  email_notifications: boolean;
  gift_notifications: boolean;
  marketing_emails: boolean;
}
```

### **3. Achievement System**
```python
GET    /api/v1/profile/achievements    # Get user achievements with progress
```

**Achievement Data Structure:**
```typescript
interface UserAchievement {
  id: string;
  title: string;
  description: string;
  category: 'milestone' | 'creator' | 'explorer';
  earned: boolean;
  earned_date: string | null;
  progress?: number; // 0-100 for partially complete achievements
}
```

## 🔄 **Implementation Plan**

### **Phase 1: Database Schema (Days 1-2)**

#### **Step 1: Create Alembic Migration**
- Add profile fields to users table
- Set appropriate defaults and constraints  
- Add indexes for performance on frequently queried fields

#### **Step 2: Update User Model**
- Add new profile fields to SQLAlchemy User model
- Create Pydantic schemas for API requests/responses
- Add validation rules (display name length, bio length, etc.)

### **Phase 2: Backend APIs (Days 3-5)**

#### **Step 3: Profile CRUD Endpoints**
- **GET /profile**: Return complete user profile data
- **PUT /profile**: Update display name, bio, favorite location, privacy settings
- Include proper validation, error handling, and security checks
- Maintain audit trail with updated_at timestamps

#### **Step 4: Notification Preferences**
- **GET /preferences**: Return notification settings
- **PUT /preferences**: Update email and notification preferences
- Integration points for future email system usage

#### **Step 5: Achievement System Backend**
- Achievement calculation service based on existing gift/chain data
- Real-time achievement updates when users perform actions
- Achievement rules implementation (see detailed logic below)

### **Phase 3: Frontend Integration (Days 6-8)**

#### **Step 6: API Client Updates**
- Add profile API methods to existing API client (`/lib/api.ts`)
- Follow existing patterns used in dashboard integration
- Profile data fetching with React Query for caching

#### **Step 7: Replace Mock Data**
- Connect Profile tab to real API data
- Connect Settings tab to notification preferences API
- Connect Achievements tab to real achievement data
- Form submission handlers for profile updates

#### **Step 8: User Experience Polish**
- Loading states and error handling
- Success notifications for profile updates  
- Achievement unlock celebrations
- Optimistic updates for better UX

## 🏆 **Achievement System Logic**

### **Personal Milestones (Based on Real Data)**

#### **Automatic Achievements:**
1. **Welcome Aboard** 
   - *Condition*: User created (automatic on first login)
   - *Tracking*: `created_at` timestamp

2. **Community Member**
   - *Condition*: Active for 30+ days
   - *Tracking*: `created_at + 30 days < now()`

#### **Activity-Based Achievements:**
3. **First Steps**
   - *Condition*: Created first gift
   - *Tracking*: `total_gifts_created > 0` or `first_gift_created_at IS NOT NULL`

4. **Adventure Seeker** 
   - *Condition*: Claimed first gift (as recipient)
   - *Tracking*: Check if `wallet_address` appears in `gifts.recipient_address` with status 'CLAIMED'

5. **Chain Master**
   - *Condition*: Created first multi-step chain
   - *Tracking*: `total_chains_created > 0` or `chains_created.count() > 0`

#### **Advanced Achievements (Future):**
6. **Explorer**
   - *Condition*: Created gifts at 5+ different locations
   - *Tracking*: `SELECT DISTINCT lat, lon FROM gifts WHERE sender_id = user.id`

7. **Generous Giver**
   - *Condition*: Sent gifts worth over X GGT
   - *Tracking*: Sum of gift amounts from blockchain data

### **Achievement Update Triggers:**
- **Gift Creation**: Update `total_gifts_created`, `first_gift_created_at`, check First Steps
- **Gift Claiming**: Check Adventure Seeker achievement
- **Chain Creation**: Update `total_chains_created`, check Chain Master  
- **Daily Cron**: Check time-based achievements (Community Member)

## 📈 **Data Migration Strategy**

### **For Existing Users:**
1. **Set Default Values**: All new fields get appropriate defaults
2. **Backfill Achievement Counters**:
   ```sql
   UPDATE users SET 
     total_gifts_created = (SELECT COUNT(*) FROM gifts WHERE sender_id = users.id),
     total_chains_created = (SELECT COUNT(*) FROM gift_chains WHERE creator_id = users.id),
     first_gift_created_at = (SELECT MIN(created_at) FROM gifts WHERE sender_id = users.id)
   ```
3. **Preserve Timestamps**: Keep existing `created_at` for "Member Since"
4. **Calculate Initial Achievements**: Run achievement check for all existing users

### **New Users:**
- Profile fields start as NULL/default values
- Achievement tracking begins immediately
- Progressive achievement unlocking as they use the platform

## 🎯 **Success Metrics**

### **Technical Goals:**
- ✅ Profile data persists across wallet connections
- ✅ Achievement progress updates in real-time  
- ✅ Notification preferences control future email behavior
- ✅ All profile changes save successfully with validation
- ✅ API response times < 200ms for profile operations
- ✅ Zero data loss during migration

### **User Experience Goals:**
- ✅ Profile page loads real user data (no mock data visible)
- ✅ Settings changes save and persist between sessions
- ✅ Achievement system shows actual progress based on activity
- ✅ Smooth, responsive profile management experience
- ✅ Clear feedback for all user actions (loading, success, error states)

## 🔐 **Security Considerations**

### **Data Protection:**
- Profile updates require JWT authentication
- Users can only modify their own profile data
- Input validation and sanitization for all text fields
- Rate limiting on profile update endpoints

### **Privacy Controls:**
- `is_public_profile` flag controls visibility
- Sensitive data (email preferences) never exposed publicly
- Wallet address is the only required field

## 🔄 **Integration Points**

### **With Existing Systems:**
- **Dashboard APIs**: Profile data complements existing gift/chain statistics
- **Authentication**: Uses existing JWT-based Web3 auth system
- **Email System**: Notification preferences will control future email behavior
- **Gift/Chain Creation**: Achievement updates trigger on these actions

### **Future Enhancements:**
- **ENS Integration**: Display ENS names when available
- **Avatar System**: Profile picture uploads and management
- **Public Profiles**: Shareable profile pages for social features
- **Advanced Analytics**: Detailed activity tracking and insights

## 📋 **Implementation Checklist**

### **Database:**
- [ ] Create Alembic migration for new profile fields
- [ ] Update User SQLAlchemy model  
- [ ] Create Pydantic schemas for API validation
- [ ] Run migration and backfill existing user data

### **Backend:**
- [ ] Implement GET /profile endpoint
- [ ] Implement PUT /profile endpoint  
- [ ] Implement preferences endpoints
- [ ] Implement achievements calculation service
- [ ] Add achievement update triggers
- [ ] Write comprehensive tests

### **Frontend:**
- [ ] Add profile API methods to API client
- [ ] Connect Profile tab data to real API
- [ ] Connect Settings tab to preferences API
- [ ] Connect Achievements tab to real data
- [ ] Replace all mock data references
- [ ] Add loading states and error handling
- [ ] Test cross-browser and mobile compatibility

### **Testing:**
- [ ] Unit tests for all new API endpoints
- [ ] Integration tests for profile workflows
- [ ] Achievement system testing
- [ ] Migration testing with existing data
- [ ] Frontend component testing
- [ ] End-to-end user journey testing

---

**This plan provides a comprehensive roadmap for implementing profile API integration while maintaining the existing architecture and ensuring a smooth user experience.**