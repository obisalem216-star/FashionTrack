# 🚀 FashionTrack: Blockchain Supply Chain for Clothing

Welcome to FashionTrack, a Web3 solution that brings transparency to the fashion industry! Using QR codes and the Stacks blockchain, this project tracks clothing items from factory production to retail stores, combating counterfeits, ensuring ethical sourcing, and empowering consumers with verifiable supply chain data. By leveraging blockchain's immutability, we solve real-world problems like opaque manufacturing processes, fake goods flooding the market, and lack of accountability in labor and environmental practices.

## ✨ Features

🔍 Scan QR codes to view a clothing item's full journey (factory, suppliers, shipping, store)  
📦 Register and track unique clothing items with blockchain-anchored data  
🏭 Onboard factories, suppliers, and retailers securely  
🔄 Record ownership transfers at each supply chain stage  
✅ Verify authenticity and ethics instantly via public queries  
📝 Immutable audit logs for compliance and reporting  
🚫 Prevent tampering or duplicate entries with hash-based uniqueness  
🌍 Support for global standards like fair trade certifications  
🔐 Role-based access for stakeholders (e.g., manufacturers vs. consumers)  

## 🛠 How It Works

FashionTrack uses 8 smart contracts written in Clarity to manage the end-to-end process. Each contract handles a specific aspect of the supply chain, ensuring modularity and security. Here's a high-level overview:

### Core Smart Contracts
- **FactoryRegistry.clar**: Registers factories with details like location, certifications, and owner. Ensures only verified factories can initiate item tracking.
- **SupplierRegistry.clar**: Onboards material suppliers, storing info on sourcing (e.g., organic cotton) and linking to ethical audits.
- **ItemCreation.clar**: Creates a new clothing item entry with a unique ID, initial hash (based on design specs), and QR code association.
- **TransferLog.clar**: Logs ownership transfers between stages (e.g., factory to distributor), updating the item's journey with timestamps and signatures.
- **QRVerifier.clar**: Handles QR code scans, querying the blockchain to display the item's history without revealing sensitive data.
- **AuthenticityCheck.clar**: Verifies the item's hash against registered data to detect counterfeits or alterations.
- **AuditTrail.clar**: Maintains an immutable log of all events for regulatory compliance and dispute resolution.
- **StakeholderAccess.clar**: Manages permissions, allowing roles like "manufacturer" to update data while "consumer" can only read.

**For Manufacturers/Factories**  
- Register your factory via FactoryRegistry.  
- Create an item in ItemCreation, generating a unique hash and QR code.  
- As the item moves (e.g., to supplier or shipping), call TransferLog to record each step immutably.  

**For Suppliers/Retailers**  
- Onboard via SupplierRegistry.  
- Accept transfers in TransferLog, adding your stage's data (e.g., shipping details).  
- Use AuthenticityCheck to confirm incoming items are genuine.  

**For Consumers**  
- Scan the QR code on the clothing.  
- The QRVerifier contract fetches and displays the journey (e.g., "Made in ethical factory X, shipped via green logistics").  
- Verify via AuthenticityCheck for peace of mind—no fakes here!  

That's it! With blockchain tracking, every stitch tells a transparent story. Get started by deploying these Clarity contracts on Stacks and integrating QR generation in your app.