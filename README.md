# 🚑 LifeLineX



### AI-Powered Emergency Healthcare Platform

**One Platform. Every Emergency. Faster Healthcare Support.**

LifeLineX is an AI-powered, real-time emergency healthcare platform that connects patients, hospitals, ambulance providers, blood banks, pharmacies, NGOs, volunteers, donors, and other healthcare organizations through one unified ecosystem. It brings emergency response, healthcare resources, financial assistance, community support, AI-based matching, real-time coordination, and centralized administration together in a single platform.

🌐 **Fully Multilingual** — English + Tamil across the entire platform

---

## 🎯 The Problem

During an emergency, patients may need blood, an ambulance, a suitable hospital, medicines, financial assistance, equipment, or volunteers at the same time. Fragmented services make finding and coordinating these resources difficult, leading to delays and communication gaps.

LifeLineX solves this by bringing these services into one connected, real-time platform.

---

## 🔐 Access & Authentication

LifeLineX provides two primary portals.

### 👤 User Portal

Individual users can:

- Sign up and sign in with credentials
- Create emergency requests
- Find blood, ambulances, hospitals and medicines
- Create and support medical crowdfunding
- Become blood donors or volunteers
- Donate medicines and medical equipment
- Communicate with organizations
- Track requests and view history

### 🏢 Organization Portal

Healthcare organizations can register as:

- Hospitals
- Ambulance Providers
- Blood Banks
- Pharmacies
- NGOs
- Volunteer Organizations
- Medical Equipment Providers

Organizations follow a controlled verification process:

```
Signup → Details & Documents → Admin Review → Approval → Account Activation → Login
```

Only admin-approved organizations can sign in and access organization services.

---

## 🌏 English + Tamil

The complete platform is multilingual, including:

- Login • Signup • Dashboard
- Emergency Services • Modules • Forms
- Notifications • Communication
- Admin Portal

Users can switch between English and Tamil (தமிழ்) throughout the platform.

---

## 🧩 Six Core Modules

After login, users can access six major healthcare modules.

### 🩸 1. Blood Donation

Connects patients with compatible blood donors and blood banks.

- Blood requests
- Blood-group compatibility
- Nearby verified donors
- Availability and eligibility
- Donation history
- AI-powered donor matching
- Real-time donor notifications

### 🚑 2. Find Ambulance

Helps users locate and request available ambulances.

- Nearby ambulance discovery
- Emergency booking
- Smart assignment
- Driver information
- ETA
- Live tracking
- Hospital destination
- Real-time status

### 🏥 3. Find Hospital

Helps users find suitable hospitals based on their emergency requirements.

- Nearby hospitals
- Hospital services
- Bed/ICU availability
- Oxygen and blood availability
- Medical specialties
- Emergency facilities
- AI-based hospital recommendation

### 💰 4. Medical Crowdfunding

Provides financial assistance for medical treatment.

- Fundraising campaigns
- Patient/treatment information
- Document verification
- Campaign approval
- Online donations
- Fund tracking
- Donation history
- Transaction records
- Sponsor support

### 💊 5. Medicine & Pharmacy

Connects users with nearby pharmacies and medicine availability.

- Medicine search
- Nearby pharmacies
- Stock checking
- Medicine requests
- Prescription upload
- Reservation
- Home delivery
- Medicine donation
- Hospital/NGO medicine support

### 👥 6. Volunteer & Community Support

Creates a community-driven emergency support network.

Volunteers can assist with:

- Blood • Medicine • Ambulance • Hospital
- Patient Guidance • Equipment • Medical Camps
- Disaster Relief • Health Awareness • Elderly Assistance
- Fundraising • Community Outreach

Volunteers can manage availability, tasks, hours, contributions, achievements, certificates, and community impact.

---

## 🤖 AI Decision Engine

AI acts as the intelligent decision-support and matching layer of LifeLineX.

**AI capabilities:**

- 🚨 Emergency priority classification
- 🏥 Smart hospital recommendation
- 🩸 Blood donor matching
- 🚑 Ambulance recommendation
- 👥 Volunteer matching
- 💊 Healthcare resource recommendation
- 🔎 Fraud/anomaly detection
- 📊 Demand prediction
- 💬 Multilingual AI assistance

AI considers factors such as location, availability, compatibility, resources, skills, verification, emergency priority, response history, and workload to help identify suitable resources.

> AI supports healthcare coordination and decision-making; it does not replace medical professionals.

---

## 🤝 NGO & Community Coordination

Approved NGOs can manage volunteers and coordinate community healthcare activities.

They can:

- Add individual or bulk volunteers
- Manage volunteer profiles
- Monitor availability
- Create emergency/community tasks
- Assign volunteers
- Track task progress
- Monitor volunteer hours and activities
- Coordinate with hospitals, blood banks, ambulances, pharmacies, patients, and other organizations

---

## ⚡ Real-Time Emergency Coordination

LifeLineX connects emergency requests with suitable resources in real time:

```
Emergency Need
      ↓
Request Creation
      ↓
AI Decision Engine
      ↓
Smart Matching & Ranking
      ↓
Hospital / Blood / Ambulance / Pharmacy / Volunteer / NGO
      ↓
Real-Time Notification
      ↓
Request Accepted
      ↓
Live Coordination
      ↓
Service Completed
      ↓
History & Feedback
```

Real-time updates can cover emergency requests, blood requests, ambulance assignments, volunteer tasks, request status, task progress, and live ambulance locations.

---

## 📍 Location-Based Services

Location services help users discover nearby:

- Hospitals • Blood Donors • Blood Banks
- Ambulances • Pharmacies • Volunteers
- Healthcare Organizations

Resources can be prioritized using distance, availability, suitability, and emergency requirements.

---

## 💬 Communication & Notifications

### Communication

- In-app chat
- Emergency communication
- Patient–hospital communication
- Volunteer/NGO coordination
- Voice communication
- Video communication

### Notifications

- Emergency alerts
- Blood requests
- Ambulance assignments
- Volunteer tasks
- Request updates
- Organization approvals
- Donation and crowdfunding updates
- Administrative alerts

---

## 💳 Payments, Donations & Verification

LifeLineX supports:

- Medical crowdfunding
- Patient support
- Donations
- Sponsorship
- Healthcare-related payments
- Transaction history
- Payment receipts

Verification supports identity, organizations, hospitals, blood banks, ambulance providers, NGOs, volunteers, and crowdfunding campaigns through document submission and administrative review.

---

## 🛡️ Centralized Admin Control

The Admin Portal monitors the entire LifeLineX ecosystem.

Admin has centralized visibility and control over:

- Users • Organizations • Hospitals
- Ambulances • Blood Banks • Pharmacies
- Volunteers • NGOs • Emergencies
- Blood Requests • Medicine Requests • Crowdfunding
- Donations • Transactions • Notifications
- Verification • Reports • Platform Activity

**Admin can:**

- Approve/reject organizations
- Verify documents
- Manage users and organizations
- Monitor hospital resources
- Monitor ambulance activity and tracking
- Monitor blood donors and requests
- Monitor pharmacies and medicine requests
- Monitor volunteers and NGO activities
- Review crowdfunding campaigns
- Monitor donations and transactions
- Identify suspicious activity
- Suspend/deactivate accounts
- Monitor emergency requests
- Track overall platform activity

Everything happening throughout LifeLineX can be monitored and managed through the Admin Portal.

---

## 🏗️ Architecture

```
                 LIFE LINEX
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
      USER       ORGANIZATION    ADMIN
     PORTAL         PORTAL       PORTAL
        └────────────┼────────────┘
                     ↓
          React + TypeScript
                     ↓
        REST API + Socket.io
                     ↓
              Service Layer
                     ↓
        ┌────────────┴────────────┐
        ↓                         ↓
   AI Decision Engine        Real-Time Engine
        └────────────┬────────────┘
                     ↓
               MongoDB Atlas
```

---

## 🗄️ Core Data

The platform manages data for:

- Users • Organizations • Hospitals
- Blood Donors • Blood Requests • Blood Banks
- Ambulances • Pharmacies • Medicines
- Volunteers • NGOs • Crowdfunding
- Donations • Medical Equipment • Emergencies
- Notifications • Transactions • Verification

---

## 🔐 Security

- JWT Authentication
- Google OAuth
- OTP Verification
- Password Hashing
- Access Control
- Organization Approval
- Document Verification
- API Security
- Rate Limiting
- CORS Protection
- Activity Monitoring

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript, TypeScript, React, Tailwind CSS |
| **Backend** | Node.js, Express.js, TypeScript, REST APIs |
| **Real-Time** | Socket.io |
| **Database** | MongoDB Atlas, Mongoose |
| **AI** | Google Gemini API |
| **Authentication** | JWT, Google OAuth, OTP |
| **Location** | Google Maps API, Geolocation |
| **Storage** | Cloudinary |
| **Payments** | Razorpay |
| **Notifications** | Firebase FCM, Email, SMS |

---

## 📁 Project Structure

```
LifeLineX/
├── lifelinex-frontend/
├── lifelinex-backend/
│   └── src/
│       ├── config/
│       ├── models/
│       ├── repositories/
│       ├── services/
│       ├── controllers/
│       ├── routes/
│       ├── middlewares/
│       ├── validators/
│       ├── socket/
│       ├── jobs/
│       ├── utils/
│       ├── tests/
│       ├── app.ts
│       └── server.ts
├── docs/
└── README.md
```

---

## 🔄 Complete Platform Flow

```
                 SIGNUP
                    ↓
          ┌─────────┴─────────┐
          ↓                   ↓
        USER             ORGANIZATION
          │                   │
          │              ADMIN APPROVAL
          │                   │
          │                APPROVED
          │                   │
          └─────────┬─────────┘
                    ↓
                  LOGIN
                    ↓
               DASHBOARD
                    ↓
        Six Healthcare Modules
                    ↓
                AI ENGINE
                    ↓
             SMART MATCHING
                    ↓
           REAL-TIME RESPONSE
                    ↓
             SERVICE DELIVERY
                    ↓
             HISTORY / FEEDBACK
                    ↓
            ADMIN MONITORING
```

---

## 🚀 Future Enhancements

- Advanced emergency prediction
- Healthcare demand forecasting
- IoT-based ambulance monitoring
- Wearable emergency integration
- Mobile applications
- Government healthcare integration
- Advanced fraud detection
- AI-powered multilingual assistant
- Expanded healthcare network
- Wider geographical coverage

---

## 🎓 Academic Project

**LIFELINEX — AI-Powered Emergency Healthcare Platform**
